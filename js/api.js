/**
 * Serviço de API para JSONBin.io
 */

class JSONBinService {
    constructor() {
        this.baseUrl = CONFIG.jsonbin.baseUrl;
        this.binId = CONFIG.jsonbin.binId;
        this.accessKey = CONFIG.jsonbin.accessKey;
    }

    /**
     * Busca todos os incidentes do servidor
     */
    async buscarTodosIncidentes() {
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                headers: {
                    'X-Master-Key': this.accessKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data.record.incidentes || [];
        } catch (error) {
            console.error('Erro ao buscar incidentes:', error);
            throw error;
        }
    }

    /**
     * Salva todos os incidentes no servidor
     */
    async salvarTodosIncidentes(incidentes) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'X-Master-Key': this.accessKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ incidentes: incidentes })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao salvar incidentes:', error);
            throw error;
        }
    }

    /**
     * Salva um incidente específico
     */
    async salvarIncidente(incidenteId, tipo, dados) {
        try {
            const todosIncidentes = await this.buscarTodosIncidentes();
            const incidenteExistente = todosIncidentes.find(inc => inc.incidente_id === incidenteId);

            if (incidenteExistente) {
                incidenteExistente.dados = dados;
                incidenteExistente.data_atualizacao = new Date().toISOString();
            } else {
                todosIncidentes.push({
                    incidente_id: incidenteId,
                    tipo: tipo,
                    dados: dados,
                    criado_por: this.getUsuario(),
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: new Date().toISOString()
                });
            }

            await this.salvarTodosIncidentes(todosIncidentes);
            return true;
        } catch (error) {
            console.error('Erro ao salvar incidente:', error);
            this.salvarLocalmente(incidenteId, tipo, dados);
            throw error;
        }
    }

    /**
     * Carrega um incidente específico
     */
    async carregarIncidente(incidenteId) {
        try {
            const todosIncidentes = await this.buscarTodosIncidentes();
            const incidente = todosIncidentes.find(inc => inc.incidente_id === incidenteId);

            if (!incidente) {
                throw new Error('Incidente não encontrado');
            }

            return incidente;
        } catch (error) {
            console.error('Erro ao carregar incidente:', error);
            return this.carregarLocalmente(incidenteId);
        }
    }

    /**
     * Lista todos os incidentes ativos
     */
    async listarIncidentesAtivos() {
        try {
            return await this.buscarTodosIncidentes();
        } catch (error) {
            console.error('Erro ao listar incidentes:', error);
            return this.listarLocalmente();
        }
    }

    /**
     * Exclui um incidente
     */
    async excluirIncidente(incidenteId) {
        try {
            const todosIncidentes = await this.buscarTodosIncidentes();
            const novosIncidentes = todosIncidentes.filter(inc => inc.incidente_id !== incidenteId);
            await this.salvarTodosIncidentes(novosIncidentes);
            return true;
        } catch (error) {
            console.error('Erro ao excluir incidente:', error);
            this.excluirLocalmente(incidenteId);
            throw error;
        }
    }

    /**
     * Limpa incidentes expirados (encerrados > 3h, inativos > 24h)
     */
    async limparIncidentesExpirados() {
        try {
            const todosIncidentes = await this.buscarTodosIncidentes();
            const agora = new Date();
            let incidentesAtualizados = [];

            todosIncidentes.forEach(incidente => {
                const dataAtualizacao = new Date(incidente.data_atualizacao || incidente.data_criacao);
                const diferencaHoras = (agora - dataAtualizacao) / (1000 * 60 * 60);

                // Verificar se é um incidente encerrado
                const isEncerrado = incidente.dados && (
                    (incidente.dados.statusEncerrado === true) ||
                    (incidente.ultimoStatus === 'encerramento')
                );

                if (isEncerrado) {
                    // Incidentes encerrados: excluir após 3 horas
                    if (diferencaHoras < CONFIG.cleanup.hoursEncerrado) {
                        incidentesAtualizados.push(incidente);
                    } else {
                        console.log(`Incidente ${incidente.incidente_id} encerrado há mais de ${CONFIG.cleanup.hoursEncerrado}h - excluído`);
                    }
                } else {
                    // Incidentes não encerrados: excluir após 24 horas
                    if (diferencaHoras < CONFIG.cleanup.hoursInativo) {
                        incidentesAtualizados.push(incidente);
                    } else {
                        console.log(`Incidente ${incidente.incidente_id} sem atualização há mais de ${CONFIG.cleanup.hoursInativo}h - excluído`);
                    }
                }
            });

            // Se houve mudanças, salvar
            if (incidentesAtualizados.length !== todosIncidentes.length) {
                await this.salvarTodosIncidentes(incidentesAtualizados);
                console.log(`Limpeza automática: ${todosIncidentes.length - incidentesAtualizados.length} incidente(s) excluído(s)`);
            }
        } catch (error) {
            console.error('Erro na limpeza automática:', error);
        }
    }

    // ===== MÉTODOS DE ARMAZENAMENTO LOCAL =====

    /**
     * Salva incidente no localStorage
     */
    salvarLocalmente(incidenteId, tipo, dados) {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_locais') || '{}');
        incidentes[incidenteId] = {
            tipo,
            dados,
            dataCriacao: new Date().toISOString()
        };
        localStorage.setItem('incidentes_locais', JSON.stringify(incidentes));
    }

    /**
     * Carrega incidente do localStorage
     */
    carregarLocalmente(incidenteId) {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_locais') || '{}');
        if (incidentes[incidenteId]) {
            return {
                incidente_id: incidenteId,
                ...incidentes[incidenteId]
            };
        }
        throw new Error('Incidente não encontrado localmente');
    }

    /**
     * Lista incidentes do localStorage
     */
    listarLocalmente() {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_locais') || '{}');
        return Object.keys(incidentes).map(id => ({
            incidente_id: id,
            ...incidentes[id]
        }));
    }

    /**
     * Exclui incidente do localStorage
     */
    excluirLocalmente(incidenteId) {
        const incidentes = JSON.parse(localStorage.getItem('incidentes_locais') || '{}');
        delete incidentes[incidenteId];
        localStorage.setItem('incidentes_locais', JSON.stringify(incidentes));
    }

    /**
     * Obtém ou solicita nome do usuário
     */
    getUsuario() {
        let usuario = localStorage.getItem('usuario_incidentes');

        if (!usuario) {
            while (true) {
                usuario = prompt('Digite seu nome para identificar seus incidentes:');

                // Verificar se o usuário cancelou
                if (usuario === null) {
                    alert('O nome é obrigatório para salvar o incidente!');
                    continue;
                }

                // Validar nome
                const validacao = Validators.validarNomeUsuario(usuario);

                if (!validacao.valido) {
                    alert(validacao.mensagem);
                    continue;
                }

                // Nome válido
                usuario = validacao.nome;
                break;
            }

            localStorage.setItem('usuario_incidentes', usuario);
        }

        return usuario;
    }
}

// Exportar serviço
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONBinService;
}

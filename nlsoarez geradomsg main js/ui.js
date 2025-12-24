/**
 * Lógica da interface do usuário
 */

// Inicializar serviço de API
const jsonBinService = new JSONBinService();

// Variáveis globais
let incidenteAtual = null;

// ===== FUNÇÕES DE GERENCIAMENTO DE INCIDENTES =====

/**
 * Salva um incidente
 */
async function salvarIncidente() {
    const tipoMensagem = document.getElementById('tipoMensagem').value;
    if (!tipoMensagem) {
        alert('Por favor, selecione um tipo de mensagem primeiro');
        return false;
    }

    let incidenteId = document.getElementById('incidenteId').value.trim();
    if (!incidenteId) {
        incidenteId = prompt('Insira o número do incidente:');
        if (!incidenteId) return false;
        document.getElementById('incidenteId').value = incidenteId;
    }

    // Solicitar nome do usuário com validação
    let nomeUsuario = localStorage.getItem('nomeUsuario') || '';
    while (true) {
        nomeUsuario = prompt('Insira seu nome (mínimo 4 caracteres, sem números):', nomeUsuario);
        if (!nomeUsuario) return false;

        // Validação: mínimo 4 caracteres, sem números
        if (nomeUsuario.length < 4) {
            alert('❌ O nome deve ter no mínimo 4 caracteres.');
            continue;
        }
        if (/\d/.test(nomeUsuario)) {
            alert('❌ O nome não pode conter números.');
            continue;
        }
        // Nome válido
        localStorage.setItem('nomeUsuario', nomeUsuario);
        break;
    }

    const dados = coletarDadosFormulario(tipoMensagem);
    if (!dados) return false;

    try {
        await jsonBinService.salvarIncidente(incidenteId, tipoMensagem, dados);
        incidenteAtual = incidenteId;
        // Marcar que o incidente foi salvo
        window.incidenteSalvo = true;
        await atualizarListaIncidentes();
        alert('✅ Incidente ' + incidenteId + ' salvo e COMPARTILHADO com todos os usuários!');

        // Carregar automaticamente o incidente que acabou de ser salvo (modo silencioso)
        await carregarIncidentePorId(incidenteId, true);
        return true;
    } catch (error) {
        alert('⚠️ Incidente salvo localmente (sem compartilhamento)');
        window.incidenteSalvo = true;
        return true;
    }
}

/**
 * Carrega um incidente pelo ID do campo de input
 */
async function carregarIncidente() {
    const incidenteId = document.getElementById('incidenteId').value.trim();
    if (!incidenteId) {
        alert('Insira o número do incidente!');
        return;
    }
    await carregarIncidentePorId(incidenteId);
}

/**
 * Carrega um incidente específico por ID
 */
async function carregarIncidentePorId(incidenteId, silencioso = false) {
    try {
        const incidente = await jsonBinService.carregarIncidente(incidenteId);
        document.getElementById('incidenteId').value = incidente.incidente_id;
        document.getElementById('tipoMensagem').value = incidente.tipo;
        mostrarFormulario();

        if (incidente.tipo === 'rompimento') {
            carregarDadosRompimento(incidente.dados);
        } else if (incidente.tipo === 'manobra') {
            carregarDadosManobra(incidente.dados);
        }

        incidenteAtual = incidente.incidente_id;
        await atualizarListaIncidentes();

        // Só mostrar alerta se não for chamada silenciosa
        if (!silencioso) {
            alert('✅ Incidente carregado do servidor compartilhado!');
        }
    } catch (error) {
        alert('❌ Erro ao carregar incidente: ' + error.message);
    }
}

/**
 * Carrega dados de rompimento no formulário
 */
function carregarDadosRompimento(dados) {
    document.getElementById('topologia').value = dados.topologia || '';
    document.getElementById('incidente').value = dados.incidente || '';
    document.getElementById('cidade').value = dados.cidade || '';
    document.getElementById('distrito').value = dados.distrito || '';
    document.getElementById('impacto').value = dados.impacto || '';
    document.getElementById('base').value = dados.base || '';
    document.getElementById('rec').value = dados.rec || '';
    document.getElementById('ral').value = dados.ral || '';
    document.getElementById('abertura').value = dados.abertura || '';
    document.getElementById('previsao').value = dados.previsao || '';
    document.getElementById('acionamento').value = dados.acionamento || '';
}

/**
 * Carrega dados de manobra no formulário
 */
function carregarDadosManobra(dados) {
    document.getElementById('topologiaManobra').value = dados.topologiaManobra || '';
    document.getElementById('ticketManobra').value = dados.ticketManobra || '';
    document.getElementById('incidenteManobra').value = dados.incidenteManobra || '';
    document.getElementById('cidadeManobra').value = dados.cidadeManobra || '';
    document.getElementById('distritoManobra').value = dados.distritoManobra || '';
    document.getElementById('impactoManobra').value = dados.impactoManobra || '';
    document.getElementById('baseManobra').value = dados.baseManobra || '';
    document.getElementById('responsavelManobra').value = dados.responsavelManobra || '';
    document.getElementById('executorManobra').value = dados.executorManobra || '';
    document.getElementById('enderecoManobra').value = dados.enderecoManobra || '';
    document.getElementById('propostoManobra').value = dados.propostoManobra || '';
}

/**
 * Exclui um incidente
 */
async function excluirIncidente(incidenteId) {
    if (confirm('Tem certeza que deseja excluir o incidente ' + incidenteId + '?')) {
        try {
            await jsonBinService.excluirIncidente(incidenteId);
            if (incidenteAtual === incidenteId) {
                incidenteAtual = null;
                document.getElementById('incidenteId').value = '';
                limparFormularios();
            }
            await atualizarListaIncidentes();
            alert('✅ Incidente excluído com sucesso!');
        } catch (error) {
            alert('⚠️ Incidente excluído apenas localmente');
        }
    }
}

/**
 * Atualiza a lista de incidentes
 */
async function atualizarListaIncidentes() {
    const incidentList = document.getElementById('incidentList');
    incidentList.innerHTML = '<div class="no-incidents">Carregando incidentes...</div>';

    try {
        // Executar limpeza automática primeiro
        await jsonBinService.limparIncidentesExpirados();

        const incidentesRemotos = await jsonBinService.listarIncidentesAtivos();

        if (incidentesRemotos.length === 0) {
            incidentList.innerHTML = '<div class="no-incidents">Nenhum incidente ativo</div>';
            return;
        }

        incidentList.innerHTML = '';
        incidentesRemotos.forEach(incidente => {
            const item = criarElementoIncidente(incidente);
            incidentList.appendChild(item);
        });
    } catch (error) {
        incidentList.innerHTML = '<div class="no-incidents">Erro ao carregar incidentes</div>';
    }
}

/**
 * Cria elemento HTML para um incidente (versão compacta - 2 linhas)
 */
function criarElementoIncidente(incidente) {
    const item = document.createElement('div');
    item.className = `incident-item ${incidenteAtual === incidente.incidente_id ? 'active' : ''}`;

    // Verificar se é encerrado
    const isEncerrado = incidente.dados && (
        (incidente.dados.statusEncerrado === true) ||
        (incidente.ultimoStatus === 'encerramento')
    );
    const statusTag = isEncerrado ? ' <span style="color: #f44336; font-weight: bold;">[ENCERRADO]</span>' : '';

    item.innerHTML = `
        <div>
            <div class="incident-id">${incidente.incidente_id}${statusTag}
                <small style="color: #666;">(por ${incidente.criado_por})</small>
            </div>
            <div class="incident-info" style="font-size: 11px;">
                Atualizado: ${new Date(incidente.data_atualizacao || incidente.dataCriacao).toLocaleString()}
            </div>
        </div>
        <button class="delete-incident" onclick="excluirIncidente('${incidente.incidente_id}')">
            <i class="fas fa-trash"></i>
        </button>
    `;

    item.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-incident')) {
            carregarIncidentePorId(incidente.incidente_id);
        }
    });

    return item;
}

/**
 * Toggle accordion open/closed
 */
function toggleAccordion(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
        card.classList.toggle('accordion-closed');
    }
}

// ===== FUNÇÕES DE FORMULÁRIO =====

/**
 * Mostra o formulário apropriado baseado no tipo selecionado
 */
function mostrarFormulario() {
    const tipo = document.getElementById('tipoMensagem').value;
    document.getElementById('formRompimento').classList.add('hidden');
    document.getElementById('formManobra').classList.add('hidden');
    document.getElementById('outputContainer').classList.add('hidden');

    if (tipo === 'rompimento') {
        document.getElementById('formRompimento').classList.remove('hidden');
    } else if (tipo === 'manobra') {
        document.getElementById('formManobra').classList.remove('hidden');
    }
}

/**
 * Coleta dados do formulário baseado no tipo
 */
function coletarDadosFormulario(tipo) {
    if (tipo === 'rompimento') {
        return {
            topologia: document.getElementById('topologia').value,
            incidente: document.getElementById('incidente').value,
            cidade: document.getElementById('cidade').value,
            distrito: document.getElementById('distrito').value,
            impacto: document.getElementById('impacto').value,
            base: document.getElementById('base').value,
            rec: document.getElementById('rec').value,
            ral: document.getElementById('ral').value,
            abertura: document.getElementById('abertura').value,
            previsao: document.getElementById('previsao').value,
            acionamento: document.getElementById('acionamento').value
        };
    } else if (tipo === 'manobra') {
        return {
            topologiaManobra: document.getElementById('topologiaManobra').value,
            ticketManobra: document.getElementById('ticketManobra').value,
            incidenteManobra: document.getElementById('incidenteManobra').value,
            cidadeManobra: document.getElementById('cidadeManobra').value,
            distritoManobra: document.getElementById('distritoManobra').value,
            impactoManobra: document.getElementById('impactoManobra').value,
            baseManobra: document.getElementById('baseManobra').value,
            responsavelManobra: document.getElementById('responsavelManobra').value,
            executorManobra: document.getElementById('executorManobra').value,
            enderecoManobra: document.getElementById('enderecoManobra').value,
            propostoManobra: document.getElementById('propostoManobra').value
        };
    }
    return null;
}

/**
 * Limpa todos os formulários
 */
function limparFormularios() {
    // Resetar flag de incidente salvo
    window.incidenteSalvo = false;

    // Formulário de Rompimento
    document.getElementById('topologia').value = '';
    document.getElementById('incidente').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('distrito').value = '';
    document.getElementById('impacto').value = '';
    document.getElementById('base').value = '';
    document.getElementById('rec').value = '';
    document.getElementById('ral').value = '';
    document.getElementById('abertura').value = '';
    document.getElementById('previsao').value = '';
    document.getElementById('acionamento').value = '';
    document.getElementById('status').value = '';
    document.getElementById('statusCampos').innerHTML = '';

    // Formulário de Manobra
    document.getElementById('topologiaManobra').value = '';
    document.getElementById('ticketManobra').value = '';
    document.getElementById('incidenteManobra').value = '';
    document.getElementById('cidadeManobra').value = '';
    document.getElementById('distritoManobra').value = '';
    document.getElementById('impactoManobra').value = '';
    document.getElementById('baseManobra').value = '';
    document.getElementById('responsavelManobra').value = '';
    document.getElementById('executorManobra').value = '';
    document.getElementById('enderecoManobra').value = '';
    document.getElementById('propostoManobra').value = '';
    document.getElementById('statusManobra').value = '';
    document.getElementById('statusCamposManobra').innerHTML = '';
}

// ===== FUNÇÕES DE STATUS =====

/**
 * Atualiza campos dinâmicos baseado no status (Rompimento)
 */
function atualizarCamposStatus() {
    const tipo = document.getElementById('status').value;
    const statusCampos = document.getElementById('statusCampos');
    statusCampos.innerHTML = '';

    if (tipo === 'inicial') {
        statusCampos.innerHTML = getHtmlStatusInicial();
    } else if (tipo === 'atualizacao') {
        statusCampos.innerHTML = getHtmlStatusAtualizacao();
    } else if (tipo === 'encerramento') {
        statusCampos.innerHTML = getHtmlStatusEncerramento();
    }
}

/**
 * Atualiza campos dinâmicos baseado no status (Manobra)
 */
function atualizarCamposStatusManobra() {
    const tipo = document.getElementById('statusManobra').value;
    const statusCampos = document.getElementById('statusCamposManobra');
    statusCampos.innerHTML = '';

    if (tipo === 'inicial') {
        statusCampos.innerHTML = getHtmlStatusInicialManobra();
    } else if (tipo === 'atualizacao') {
        statusCampos.innerHTML = getHtmlStatusAtualizacaoManobra();
    } else if (tipo === 'estouroManobra') {
        statusCampos.innerHTML = getHtmlStatusEstouroManobra();
    } else if (tipo === 'encerramento') {
        statusCampos.innerHTML = getHtmlStatusEncerramentoManobra();
    }
}

// ===== TEMPLATES HTML PARA STATUS =====

function getHtmlStatusInicial() {
    return `
        <div class="form-group-inline">
            <label>Incidente acionado:</label>
            <div class="radio-group inline">
                <div class="radio-option">
                    <input type="radio" id="acionado_sim" name="acionado" value="sim" onchange="mostrarCampoAcionado()">
                    <label for="acionado_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="acionado_nao" name="acionado" value="nao" onchange="mostrarCampoAcionado()">
                    <label for="acionado_nao">Não</label>
                </div>
            </div>
        </div>
        <div id="campoMotivoAcionado" class="motivo-field hidden">
            <label for="motivoNaoAcionado">Informe o motivo:</label>
            <input type="text" id="motivoNaoAcionado">
        </div>

        <div class="form-group-inline">
            <label>Scan realizado:</label>
            <div class="radio-group inline">
                <div class="radio-option">
                    <input type="radio" id="scan_sim" name="scan" value="sim" onchange="mostrarCampoScan()">
                    <label for="scan_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="scan_nao" name="scan" value="nao" onchange="mostrarCampoScan()">
                    <label for="scan_nao">Não</label>
                </div>
            </div>
        </div>
        <div id="campoScan" class="motivo-field hidden"></div>

        <div class="form-group-inline">
            <label>Incidente reagendado:</label>
            <div class="radio-group inline">
                <div class="radio-option">
                    <input type="radio" id="equipe_sim" name="equipe" value="sim" onchange="mostrarCampoEquipe()">
                    <label for="equipe_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="equipe_nao" name="equipe" value="nao" onchange="mostrarCampoEquipe()">
                    <label for="equipe_nao">Não</label>
                </div>
            </div>
        </div>
        <div id="campoEquipe" class="motivo-field hidden"></div>

        <div class="form-group">
            <label>Escalonamento:</label>
            <div class="checkbox-group inline">
                <div class="escalonamento-container">
                    <div class="checkbox-option">
                        <input type="checkbox" id="esc_ponto_focal" onchange="toggleEscalonamentoInput('ponto_focal')">
                        <label for="esc_ponto_focal">Ponto focal</label>
                    </div>
                    <input type="text" id="esc_ponto_focal_nome" class="escalonamento-input hidden" placeholder="Inserir nome" oninput="this.value = this.value.replace(/[0-9]/g, '')">
                </div>

                <div class="escalonamento-container">
                    <div class="checkbox-option">
                        <input type="checkbox" id="esc_supervisor" onchange="toggleEscalonamentoInput('supervisor')">
                        <label for="esc_supervisor">Supervisor</label>
                    </div>
                    <input type="text" id="esc_supervisor_nome" class="escalonamento-input hidden" placeholder="Inserir nome" oninput="this.value = this.value.replace(/[0-9]/g, '')">
                </div>

                <div class="escalonamento-container">
                    <div class="checkbox-option">
                        <input type="checkbox" id="esc_coordenador" onchange="toggleEscalonamentoInput('coordenador')">
                        <label for="esc_coordenador">Coordenador</label>
                    </div>
                    <input type="text" id="esc_coordenador_nome" class="escalonamento-input hidden" placeholder="Inserir nome" oninput="this.value = this.value.replace(/[0-9]/g, '')">
                </div>

                <div class="escalonamento-container">
                    <div class="checkbox-option">
                        <input type="checkbox" id="esc_gerente" onchange="toggleEscalonamentoInput('gerente')">
                        <label for="esc_gerente">Gerente</label>
                    </div>
                    <input type="text" id="esc_gerente_nome" class="escalonamento-input hidden" placeholder="Inserir nome" oninput="this.value = this.value.replace(/[0-9]/g, '')">
                </div>

                <div class="escalonamento-container">
                    <div class="checkbox-option">
                        <input type="checkbox" id="esc_nao_escalonado" onchange="toggleNaoEscalonado()">
                        <label for="esc_nao_escalonado">Não escalonado</label>
                    </div>
                </div>
            </div>
        </div>

        <div class="form-group">
            <label for="outrasObservacoes">Outras observações:</label>
            <textarea id="outrasObservacoes" rows="3"></textarea>
        </div>
    `;
}

function getHtmlStatusAtualizacao() {
    return `
        <div class="form-group">
            <div class="checkbox-option">
                <input type="checkbox" id="novaAtualizacaoCheck" onchange="toggleNovaAtualizacao()">
                <label for="novaAtualizacaoCheck"><strong>Nova atualização</strong></label>
            </div>
        </div>
        <div id="campoNovaAtualizacao" class="hidden">
            <div class="form-group">
                <label for="novaAtualizacao">Nova atualização:</label>
                <textarea id="novaAtualizacao" rows="4" placeholder="Digite aqui informações adicionais sobre a atualização..."></textarea>
            </div>
        </div>
        <div id="camposAtualizacaoNormal">
            <div class="form-group">
                <label for="enderecoDano">Endereço do dano:</label>
                <input type="text" id="enderecoDano">
            </div>
            <div class="form-group">
                <label for="causaDano">Causa do dano:</label>
                <input type="text" id="causaDano">
            </div>
            <div class="form-group">
                <label for="cabosAfetados">Cabos afetados:</label>
                <input type="text" id="cabosAfetados">
            </div>
            <div class="form-group-inline">
                <label>Equipe percorrendo rota:</label>
                <div class="radio-group inline">
                    <div class="radio-option">
                        <input type="radio" id="percorrendo_sim" name="percorrendo" value="sim">
                        <label for="percorrendo_sim">Sim</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="percorrendo_nao" name="percorrendo" value="nao">
                        <label for="percorrendo_nao">Não</label>
                    </div>
                </div>
            </div>
            <div class="form-group-inline">
                <label>Equipe avaliando infra:</label>
                <div class="radio-group inline">
                    <div class="radio-option">
                        <input type="radio" id="avaliando_sim" name="avaliando" value="sim">
                        <label for="avaliando_sim">Sim</label>
                    </div>
                    <div class="radio-option">
                        <input type="radio" id="avaliando_nao" name="avaliando" value="nao">
                        <label for="avaliando_nao">Não</label>
                    </div>
                </div>
            </div>
            <div class="form-row-two">
                <div class="form-group">
                    <label for="validado">Percentual de nodes normalizados (%):</label>
                    <input type="text" id="validado">
                </div>
                <div class="form-group"></div>
            </div>
        </div>
    `;
}

function getHtmlStatusEncerramento() {
    return `
        <div class="form-group">
            <label for="encerramento">Data e hora de encerramento:</label>
            <input type="text" id="encerramento" placeholder="dd/mm/aaaa hh:mm">
            <div class="date-format">Formato obrigatório: dd/mm/aaaa hh:mm</div>
            <div class="error-message" id="encerramento-error">Formato incorreto. Use: dd/mm/aaaa hh:mm</div>
        </div>
        <div class="form-row-fca">
            <div class="form-group-half">
                <div class="form-group">
                    <label for="fato">Fato:</label>
                    <textarea id="fato" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label for="causa">Causa:</label>
                    <textarea id="causa" rows="2"></textarea>
                </div>
            </div>
            <div class="form-group">
                <label for="acao">Ação:</label>
                <textarea id="acao" rows="5"></textarea>
            </div>
        </div>
    `;
}

function getHtmlStatusInicialManobra() {
    return `
        <div class="form-group-inline">
            <label>Manobra iniciada:</label>
            <div class="radio-group inline">
                <div class="radio-option">
                    <input type="radio" id="manobra_iniciada_sim" name="manobra_iniciada" value="sim" onchange="mostrarCampoManobraIniciada()">
                    <label for="manobra_iniciada_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="manobra_iniciada_nao" name="manobra_iniciada" value="nao" onchange="mostrarCampoManobraIniciada()">
                    <label for="manobra_iniciada_nao">Não</label>
                </div>
            </div>
        </div>
        <div id="campoMotivoManobra" class="motivo-field hidden">
            <label for="motivoManobraNaoIniciada">Informe o motivo:</label>
            <input type="text" id="motivoManobraNaoIniciada">
        </div>
    `;
}

function getHtmlStatusAtualizacaoManobra() {
    return `
        <div class="form-row-two">
            <div class="form-group">
                <label for="validadoManobra">Percentual de nodes normalizados (%):</label>
                <input type="text" id="validadoManobra">
            </div>
            <div class="form-group"></div>
        </div>
        <div class="form-group">
            <label for="atualizacaoManobra">Atualização:</label>
            <textarea id="atualizacaoManobra" rows="3"></textarea>
        </div>
    `;
}

function getHtmlStatusEncerramentoManobra() {
    return `
        <div class="form-row-two">
            <div class="form-group">
                <label for="encerramentoManobra">Data e hora de encerramento:</label>
                <input type="text" id="encerramentoManobra" placeholder="dd/mm/aaaa hh:mm">
                <div class="date-format">Formato obrigatório: dd/mm/aaaa hh:mm</div>
                <div class="error-message" id="encerramentoManobra-error">Formato incorreto. Use: dd/mm/aaaa hh:mm</div>
            </div>
            <div class="form-group"></div>
        </div>
        <div class="form-row-fca">
            <div class="form-group-half">
                <div class="form-group">
                    <label for="fatoManobra">Fato:</label>
                    <textarea id="fatoManobra" rows="2"></textarea>
                </div>
                <div class="form-group">
                    <label for="causaManobra">Causa:</label>
                    <textarea id="causaManobra" rows="2"></textarea>
                </div>
            </div>
            <div class="form-group">
                <label for="acaoManobra">Ação:</label>
                <textarea id="acaoManobra" rows="5"></textarea>
            </div>
        </div>
    `;
}

// ===== FUNÇÕES AUXILIARES DE STATUS =====

function toggleEscalonamentoInput(tipo) {
    const checkbox = document.getElementById(`esc_${tipo}`);
    const input = document.getElementById(`esc_${tipo}_nome`);

    if (checkbox.checked) {
        input.classList.remove('hidden');
        // Desmarcar "Não escalonado" se algum escalonamento for marcado
        const naoEscalonado = document.getElementById('esc_nao_escalonado');
        if (naoEscalonado) {
            naoEscalonado.checked = false;
        }
    } else {
        input.classList.add('hidden');
        input.value = '';
    }
}

function toggleNaoEscalonado() {
    const naoEscalonado = document.getElementById('esc_nao_escalonado');
    if (naoEscalonado && naoEscalonado.checked) {
        // Desmarcar todas as outras opções de escalonamento
        const tipos = ['ponto_focal', 'supervisor', 'coordenador', 'gerente'];
        tipos.forEach(tipo => {
            const checkbox = document.getElementById(`esc_${tipo}`);
            const input = document.getElementById(`esc_${tipo}_nome`);
            if (checkbox) {
                checkbox.checked = false;
            }
            if (input) {
                input.classList.add('hidden');
                input.value = '';
            }
        });
    }
}

function mostrarCampoScan() {
    const campoScan = document.getElementById('campoScan');
    const scanSim = document.getElementById('scan_sim');

    if (scanSim && scanSim.checked) {
        campoScan.innerHTML = `
            <div class="form-group">
                <label for="metragemScan">Metragem do Scan:</label>
                <input type="text" id="metragemScan" placeholder="Ex: 1500M">
            </div>
        `;
        campoScan.classList.remove('hidden');
    } else {
        campoScan.classList.add('hidden');
    }
}

function mostrarCampoEquipe() {
    const campoEquipe = document.getElementById('campoEquipe');
    const equipeSim = document.getElementById('equipe_sim');

    if (equipeSim && equipeSim.checked) {
        campoEquipe.innerHTML = `
            <div class="form-group">
                <label for="motivoEquipe">Motivo:</label>
                <select id="motivoEquipe" onchange="mostrarCampoOutrosMotivo()">
                    <option value="">-- Selecione --</option>
                    <option value="ÁREA DE RISCO">Área de risco</option>
                    <option value="INDISPONIBILIDADE TÉCNICA">Indisponibilidade técnica</option>
                    <option value="SEM ACESSO">Sem acesso</option>
                    <option value="OUTROS">Outros</option>
                </select>
            </div>
            <div id="campoOutrosMotivo" class="hidden" style="margin-top: 12px;">
                <label for="outrosMotivoTexto">Informe o motivo:</label>
                <input type="text" id="outrosMotivoTexto">
            </div>
        `;
        campoEquipe.classList.remove('hidden');
    } else {
        campoEquipe.classList.add('hidden');
    }
}

function mostrarCampoOutrosMotivo() {
    const selectMotivo = document.getElementById('motivoEquipe');
    const campoOutros = document.getElementById('campoOutrosMotivo');

    if (selectMotivo && campoOutros) {
        if (selectMotivo.value === 'OUTROS') {
            campoOutros.classList.remove('hidden');
        } else {
            campoOutros.classList.add('hidden');
        }
    }
}

function mostrarCampoAcionado() {
    const campoMotivo = document.getElementById('campoMotivoAcionado');
    const acionadoNao = document.getElementById('acionado_nao');

    if (acionadoNao && acionadoNao.checked) {
        campoMotivo.classList.remove('hidden');
    } else {
        campoMotivo.classList.add('hidden');
    }
}

function mostrarCampoManobraIniciada() {
    const campoMotivo = document.getElementById('campoMotivoManobra');
    const manobraNao = document.getElementById('manobra_iniciada_nao');

    if (manobraNao && manobraNao.checked) {
        campoMotivo.classList.remove('hidden');
    } else {
        campoMotivo.classList.add('hidden');
    }
}

function toggleNovaAtualizacao() {
    const checkbox = document.getElementById('novaAtualizacaoCheck');
    const camposNormais = document.getElementById('camposAtualizacaoNormal');
    const campoNovaAtualizacao = document.getElementById('campoNovaAtualizacao');

    if (checkbox && camposNormais && campoNovaAtualizacao) {
        if (checkbox.checked) {
            // Mostrar campo de nova atualização e esconder campos normais
            campoNovaAtualizacao.classList.remove('hidden');
            camposNormais.classList.add('hidden');
        } else {
            // Mostrar campos normais e esconder campo de nova atualização
            campoNovaAtualizacao.classList.add('hidden');
            camposNormais.classList.remove('hidden');
        }
    }
}

function getHtmlStatusEstouroManobra() {
    return `
        <div class="form-row-two">
            <div class="form-group">
                <label for="motivoEstouro">Motivo:</label>
                <input type="text" id="motivoEstouro">
            </div>
            <div class="form-group">
                <label for="horarioInicioEstouro">Data/hora de início:</label>
                <input type="text" id="horarioInicioEstouro">
            </div>
        </div>
        <div class="form-row-two">
            <div class="form-group">
                <label for="ticketEstouro">Ticket (Manobra):</label>
                <input type="text" id="ticketEstouro">
            </div>
            <div class="form-group">
                <label for="incidenteEstouro">Incidente (Outage):</label>
                <input type="text" id="incidenteEstouro">
            </div>
        </div>
        <div class="form-row-two">
            <div class="form-group">
                <label for="cidadeEstouro">Cidade:</label>
                <input type="text" id="cidadeEstouro">
            </div>
            <div class="form-group">
                <label for="distritoEstouro">Distrito / Rota ou Anel:</label>
                <input type="text" id="distritoEstouro">
            </div>
        </div>
        <div class="form-row-two">
            <div class="form-group">
                <label for="impactoEstouro">Impacto:</label>
                <input type="text" id="impactoEstouro">
            </div>
            <div class="form-group">
                <label for="baseEstouro">Base impactada:</label>
                <input type="text" id="baseEstouro" oninput="this.value = this.value.replace(/[^0-9]/g, '')">
            </div>
        </div>
        <div class="form-row-two">
            <div class="form-group">
                <label for="enderecoEstouro">Endereço:</label>
                <textarea id="enderecoEstouro" class="adjustable" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label for="statusEstouro">Status:</label>
                <textarea id="statusEstouro" class="adjustable" rows="2"></textarea>
            </div>
        </div>
        <div class="form-row-two">
            <div class="form-group">
                <label for="horarioFechamentoEstouro">Data/hora de fechamento:</label>
                <input type="text" id="horarioFechamentoEstouro">
            </div>
            <div class="form-group"></div>
        </div>
    `;
}

// ===== CONTINUA NO PRÓXIMO ARQUIVO =====

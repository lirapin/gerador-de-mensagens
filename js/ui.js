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
        return;
    }

    let incidenteId = document.getElementById('incidenteId').value.trim();
    if (!incidenteId) {
        incidenteId = prompt('Insira o número do incidente:');
        if (!incidenteId) return;
        document.getElementById('incidenteId').value = incidenteId;
    }

    const dados = coletarDadosFormulario(tipoMensagem);
    if (!dados) return;

    try {
        await jsonBinService.salvarIncidente(incidenteId, tipoMensagem, dados);
        incidenteAtual = incidenteId;
        await atualizarListaIncidentes();
        alert('✅ Incidente ' + incidenteId + ' salvo e COMPARTILHADO com todos os usuários!');

        // Carregar automaticamente o incidente que acabou de ser salvo (modo silencioso)
        await carregarIncidentePorId(incidenteId, true);
    } catch (error) {
        alert('⚠️ Incidente salvo localmente (sem compartilhamento)');
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
 * Cria elemento HTML para um incidente
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
            <div class="incident-info">${incidente.tipo} - ${incidente.dados.incidente || incidente.dados.incidenteManobra || 'Sem nome'}</div>
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
    } else if (tipo === 'encerramento') {
        statusCampos.innerHTML = getHtmlStatusEncerramentoManobra();
    }
}

// ===== TEMPLATES HTML PARA STATUS =====

function getHtmlStatusInicial() {
    return `
        <div class="form-group">
            <label>Incidente acionado?</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="acionado_sim" name="acionado" value="sim">
                    <label for="acionado_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="acionado_nao" name="acionado" value="nao">
                    <label for="acionado_nao">Não</label>
                </div>
            </div>
        </div>

        <div class="form-group">
            <label>Escalonamento?</label>
            <div class="checkbox-group">
                <div class="checkbox-option">
                    <input type="checkbox" id="esc_ponto_focal" onchange="toggleEscalonamentoInput('ponto_focal')">
                    <label for="esc_ponto_focal">Ponto Focal</label>
                </div>
                <input type="text" id="esc_ponto_focal_nome" class="escalonamento-input hidden" placeholder="Nome do Ponto Focal">

                <div class="checkbox-option">
                    <input type="checkbox" id="esc_supervisor" onchange="toggleEscalonamentoInput('supervisor')">
                    <label for="esc_supervisor">Supervisor</label>
                </div>
                <input type="text" id="esc_supervisor_nome" class="escalonamento-input hidden" placeholder="Nome do Supervisor">

                <div class="checkbox-option">
                    <input type="checkbox" id="esc_coordenador" onchange="toggleEscalonamentoInput('coordenador')">
                    <label for="esc_coordenador">Coordenador</label>
                </div>
                <input type="text" id="esc_coordenador_nome" class="escalonamento-input hidden" placeholder="Nome do Coordenador">

                <div class="checkbox-option">
                    <input type="checkbox" id="esc_gerente" onchange="toggleEscalonamentoInput('gerente')">
                    <label for="esc_gerente">Gerente</label>
                </div>
                <input type="text" id="esc_gerente_nome" class="escalonamento-input hidden" placeholder="Nome do Gerente">
            </div>
        </div>

        <div class="form-group">
            <label>Scan realizado?</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="scan_sim" name="scan" value="sim" onchange="mostrarCampoScan()">
                    <label for="scan_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="scan_nao" name="scan" value="nao" onchange="mostrarCampoScan()">
                    <label for="scan_nao">Não</label>
                </div>
            </div>
            <div id="campoScan" class="conditional-field hidden"></div>
        </div>

        <div class="form-group">
            <label>Incidente ficará com equipe da manhã?</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="equipe_sim" name="equipe" value="sim" onchange="mostrarCampoEquipe()">
                    <label for="equipe_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="equipe_nao" name="equipe" value="nao" onchange="mostrarCampoEquipe()">
                    <label for="equipe_nao">Não</label>
                </div>
            </div>
            <div id="campoEquipe" class="conditional-field hidden"></div>
        </div>
    `;
}

function getHtmlStatusAtualizacao() {
    return `
        <div class="form-group">
            <label for="enderecoDano">Endereço do Dano:</label>
            <input type="text" id="enderecoDano">
        </div>
        <div class="form-group">
            <label for="causaDano">Causa do Dano:</label>
            <input type="text" id="causaDano">
        </div>
        <div class="form-group">
            <label for="cabosAfetados">Cabos Afetados:</label>
            <input type="text" id="cabosAfetados">
        </div>
        <div class="form-group">
            <label>Equipe percorrendo rota?</label>
            <div class="radio-group">
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
        <div class="form-group">
            <label>Equipe avaliando infra?</label>
            <div class="radio-group">
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
        <div class="form-group">
            <label for="validado">Percentual de Nodes Normalizados (%):</label>
            <input type="text" id="validado">
        </div>
    `;
}

function getHtmlStatusEncerramento() {
    return `
        <div class="form-group">
            <label for="encerramento">Data e Hora de Encerramento:</label>
            <input type="text" id="encerramento" placeholder="dd/mm/aaaa hh:mm">
            <div class="date-format">Formato obrigatório: dd/mm/aaaa hh:mm</div>
            <div class="error-message" id="encerramento-error">Formato incorreto. Use: dd/mm/aaaa hh:mm</div>
        </div>
        <div class="form-group">
            <label for="fato">FATO:</label>
            <textarea id="fato" rows="2"></textarea>
        </div>
        <div class="form-group">
            <label for="causa">CAUSA:</label>
            <textarea id="causa" rows="2"></textarea>
        </div>
        <div class="form-group">
            <label for="acao">AÇÃO:</label>
            <textarea id="acao" rows="3"></textarea>
        </div>
    `;
}

function getHtmlStatusInicialManobra() {
    return `
        <div class="form-group">
            <label>Manobra iniciada?</label>
            <div class="radio-group">
                <div class="radio-option">
                    <input type="radio" id="manobra_iniciada_sim" name="manobra_iniciada" value="sim">
                    <label for="manobra_iniciada_sim">Sim</label>
                </div>
                <div class="radio-option">
                    <input type="radio" id="manobra_iniciada_nao" name="manobra_iniciada" value="nao">
                    <label for="manobra_iniciada_nao">Não</label>
                </div>
            </div>
        </div>
    `;
}

function getHtmlStatusAtualizacaoManobra() {
    return `
        <div class="form-group">
            <label for="validadoManobra">Percentual de Nodes Normalizados (%):</label>
            <input type="text" id="validadoManobra">
        </div>
        <div class="form-group">
            <label for="atualizacaoManobra">Atualização:</label>
            <textarea id="atualizacaoManobra" rows="3"></textarea>
        </div>
    `;
}

function getHtmlStatusEncerramentoManobra() {
    return `
        <div class="form-group">
            <label for="encerramentoManobra">Data e Hora de Encerramento:</label>
            <input type="text" id="encerramentoManobra" placeholder="dd/mm/aaaa hh:mm">
            <div class="date-format">Formato obrigatório: dd/mm/aaaa hh:mm</div>
            <div class="error-message" id="encerramentoManobra-error">Formato incorreto. Use: dd/mm/aaaa hh:mm</div>
        </div>
        <div class="form-group">
            <label for="fatoManobra">FATO:</label>
            <textarea id="fatoManobra" rows="2"></textarea>
        </div>
        <div class="form-group">
            <label for="causaManobra">CAUSA:</label>
            <textarea id="causaManobra" rows="2"></textarea>
        </div>
        <div class="form-group">
            <label for="acaoManobra">AÇÃO:</label>
            <textarea id="acaoManobra" rows="3"></textarea>
        </div>
    `;
}

// ===== FUNÇÕES AUXILIARES DE STATUS =====

function toggleEscalonamentoInput(tipo) {
    const checkbox = document.getElementById(`esc_${tipo}`);
    const input = document.getElementById(`esc_${tipo}_nome`);

    if (checkbox.checked) {
        input.classList.remove('hidden');
    } else {
        input.classList.add('hidden');
        input.value = '';
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
                <select id="motivoEquipe">
                    <option value="">-- Selecione --</option>
                    <option value="ÁREA DE RISCO">Área de risco</option>
                    <option value="INDISPONIBILIDADE TÉCNICA">Indisponibilidade técnica</option>
                    <option value="SEM ACESSO">Sem acesso</option>
                </select>
            </div>
        `;
        campoEquipe.classList.remove('hidden');
    } else {
        campoEquipe.classList.add('hidden');
    }
}

// ===== CONTINUA NO PRÓXIMO ARQUIVO =====

/**
 * Funções de geração de mensagens
 */

// Variável para controlar última mensagem gerada
let ultimaMensagemGerada = null;
let timestampUltimaMensagem = 0;

/**
 * Remove pontos duplicados da mensagem
 */
function removerPontosDuplicados(mensagem) {
    // Remove dois ou mais pontos consecutivos, mantendo apenas um
    return mensagem.replace(/\.{2,}/g, '.').replace(/\.\s+\./g, '.').replace(/:\s*:/g, ':');
}

function removerPontoFinal(texto) {
    return texto.trim().replace(/\.+$/g, '').trim();
}

function removerTelefones(texto) {
    // Remove preposições comuns + a palavra telefone (ex: 'no telefone:', 'pelo telefone -', 'do telefone')
    let semPalavraTelefone = texto.replace(/\b(?:no|do|pelo|ao)\s+telefone\b[\s:.-]*/gi, '');
    
    // Fallback para se sobrar a palavra 'telefone' sozinha
    semPalavraTelefone = semPalavraTelefone.replace(/\btelefone\b[\s:.-]*/gi, '');
    
    // Remove os números de telefone
    let semNumeros = semPalavraTelefone.replace(/\+?\(?\d[\d\s().-]{6,}\d\)?/g, '');
    
    // Remove espaços múltiplos e limpa pontuações órfãs resultantes
    return semNumeros.replace(/\s+/g, ' ').replace(/\s+[:.-]\s+/g, ' ').replace(/[ \t]+$/gm, '').trim();
}

function simplificarNome(nomes, nomesRepetidos) {
    const conectores = ['DE', 'DA', 'DAS', 'DO', 'DOS'];
    const partes = nomes.filter(nome => nome && !conectores.includes(nome));

    if (partes.length === 0) return '';
    if (nomesRepetidos.has(partes[0]) && partes.length > 1) {
        return `${partes[0]} ${partes[1]}`;
    }

    return partes[0];
}

function extrairEscalonamentoSemSucesso(linha) {
    let cargo = '';

    if (/\b(SUP|SUP\.|SUPERVISOR|SUPERVISORA)\b/.test(linha)) {
        cargo = 'SUPERVISOR';
    } else if (/\b(COORD|COORD\.|COORDENADOR|COORDENADORA)\b/.test(linha)) {
        cargo = 'COORDENADOR';
    } else if (/\b(GER|GER\.|GERENTE)\b/.test(linha)) {
        cargo = 'GERENTE';
    } else {
        return null;
    }

    const palavrasIgnoradas = [
        'SUP', 'SUPERVISOR', 'SUPERVISORA', 'COORD', 'COORDENADOR', 'COORDENADORA',
        'GER', 'GERENTE', 'TECNICO', 'TÉCNICO', 'PLANTAO', 'PLANTÃO', 'FIBRA',
        'GERAL', 'REDE', 'MASSIVO', 'DE', 'DA', 'DAS', 'DO', 'DOS'
    ];
    const nomes = removerTelefones(linha)
        .replace(/[.:;,\-–—]/g, ' ')
        .split(/\s+/)
        .map(parte => parte.trim())
        .filter(parte => /^[A-ZÀ-Ý]{2,}$/.test(parte) && !palavrasIgnoradas.includes(parte));

    return { cargo, nomes };
}

function lapidarObservacoesEscalonamento(texto) {
    const textoSemTelefones = removerTelefones(texto.toUpperCase());
    return removerPontoFinal(textoSemTelefones);

}

/**
 * Verifica se a mensagem pode ser gerada (evita duplicação em menos de 1 minuto)
 */
function verificarDuplicacaoMensagem(mensagem) {
    const agora = Date.now();
    const umMinuto = 60 * 1000;

    // Normalizar mensagem para comparação (remover espaços extras)
    const mensagemNormalizada = mensagem.trim().replace(/\s+/g, ' ');

    if (ultimaMensagemGerada === mensagemNormalizada && (agora - timestampUltimaMensagem) < umMinuto) {
        const tempoRestante = Math.ceil((umMinuto - (agora - timestampUltimaMensagem)) / 1000);
        return {
            duplicada: true,
            tempoRestante: tempoRestante
        };
    }

    return { duplicada: false };
}

/**
 * Registra a última mensagem gerada
 */
function registrarMensagemGerada(mensagem) {
    ultimaMensagemGerada = mensagem.trim().replace(/\s+/g, ' ');
    timestampUltimaMensagem = Date.now();
}

// ===== GERAÇÃO DE MENSAGENS - ROMPIMENTO =====

async function gerarMensagem() {
    console.log('🚀 FUNÇÃO gerarMensagem() INICIADA');

    // Verificar se o incidente foi salvo
    if (!window.incidenteSalvo) {
        alert('❌ É obrigatório SALVAR o incidente antes de gerar a mensagem.\nClique em "Salvar Incidente" primeiro.');
        return;
    }

    const topologia = document.getElementById('topologia').value;
    if (!topologia) {
        alert('Por favor, selecione o tipo de topologia');
        return;
    }

    const tipoStatus = document.getElementById('status').value;
    if (!tipoStatus) {
        alert('Por favor, selecione o tipo de status');
        return;
    }

    const tipoImpactoElement = document.querySelector('input[name="tipoImpacto"]:checked');
    if (!tipoImpactoElement) {
        alert('Por favor, selecione se o incidente tem impacto ou não');
        return;
    }

    const impactoValor = document.getElementById('impacto').value;
    Validators.verificarEscalonamento(topologia, impactoValor, tipoStatus);

    // Validar campos de data/hora
    const camposDataHora = ['abertura', 'previsao', 'acionamento'];
    if (tipoStatus === 'encerramento') {
        camposDataHora.push('encerramento');
    }

    if (!Validators.validarCamposDataHora(camposDataHora)) {
        alert('Por favor, corrija os campos de data/hora no formato dd/mm/aaaa hh:mm');
        return;
    }

    const get = id => document.getElementById(id)?.value.toUpperCase() || '';
    const tipoImpactoTexto = tipoImpactoElement.value === 'com' ? 'COM IMPACTO' : 'SEM IMPACTO';
    const alertaImpacto = Validators.verificarAlertaImpacto(topologia, impactoValor);

    let msg = `## COP REDE INFORMA: INCIDENTE ${tipoImpactoTexto}
## ROMPIMENTO DE FIBRA RESIDENCIAL\n`;
    msg += `## TOPOLOGIA: ${get('topologia')}\n`;
    msg += `## INCIDENTE: ${get('incidente')}\n`;
    msg += `## CIDADE/CLUSTER: ${get('cidade')}\n`;
    msg += `## ÁREA/DISTRITO: ${get('distrito')}\n`;
    msg += `## IMPACTO: ${get('impacto')}${alertaImpacto}\n`;
    msg += `## BASE AFETADA: ${get('base')}\n`;

    const recValue = parseInt(get('rec'));
    const ralValue = parseInt(get('ral'));
    if (!isNaN(recValue) && recValue >= 1) {
        msg += `## REC: ${recValue}\n`;
    }
    if (!isNaN(ralValue) && ralValue >= 1) {
        msg += `## RAL: ${ralValue}\n`;
    }

    msg += `## DATA E HORA DE ABERTURA: ${get('abertura')}\n`;
    msg += `## PREVISÃO DO OUTAGE: ${get('previsao')}\n`;
    msg += `## DATA E HORA DE ACIONAMENTO: ${get('acionamento') || 'AGUARDANDO DISPONIBILIDADE TÉCNICA'}\n`;
    msg += `## TIPO DE STATUS: ${document.getElementById('status').options[document.getElementById('status').selectedIndex].text.toUpperCase()}\n`;

    if (tipoStatus === 'inicial') {
        msg += gerarConteudoStatusInicial();
    } else if (tipoStatus === 'atualizacao') {
        msg += gerarConteudoStatusAtualizacao();
    } else if (tipoStatus === 'encerramento') {
        msg += gerarConteudoStatusEncerramento();
    }

    // Remover pontos duplicados da mensagem
    msg = removerPontosDuplicados(msg);

    // Verificar se a mensagem é duplicada (menos de 1 minuto)
    const verificacao = verificarDuplicacaoMensagem(msg);
    if (verificacao.duplicada) {
        alert(`❌ Esta mensagem já foi gerada há menos de 1 minuto.\nAguarde ${verificacao.tempoRestante} segundos para gerar novamente.`);
        return;
    }

    // Registrar mensagem gerada
    registrarMensagemGerada(msg);

    document.getElementById('output').textContent = msg;
    document.getElementById('outputContainer').classList.remove('hidden');

    // ENVIO DA MENSAGEM COMPLETA PARA O GRUPO (sempre)
    await smsService.sendFullMessageToGroup(msg);

    // ENVIO DE ALERTAS INDIVIDUAIS (apenas quando impacto alto)
    const dadosSMS = coletarDadosFormulario('rompimento');
    const shouldAutoSend = verificarEnvioAutomaticoSMS(topologia, impactoValor, tipoStatus);

    if (shouldAutoSend) {
        const resultSMS = await sendSMSNotification('rompimento', dadosSMS);
        if (resultSMS) {
            showSMSFeedback(resultSMS);
        }
    }

    // SALVAMENTO AUTOMÁTICO (exceto no status inicial)
    await salvarAutomaticamente('rompimento', tipoStatus);

    // MOSTRAR POPUP DE CONFIRMAÇÃO
    console.log('📢 CHAMANDO mostrarPopupMensagem()...');
    mostrarPopupMensagem();
    console.log('📢 mostrarPopupMensagem() FOI CHAMADA');
}

function gerarConteudoStatusInicial() {
    const acionado = document.querySelector('input[name="acionado"]:checked');
    const scan = document.querySelector('input[name="scan"]:checked');
    const equipe = document.querySelector('input[name="equipe"]:checked');

    let statusInfo = [];

    // Verificar se foi acionado ou não
    if (acionado) {
        if (acionado.value === 'sim') {
            statusInfo.push('EQUIPE FO ACIONADA');
        } else {
            const motivoNaoAcionado = document.getElementById('motivoNaoAcionado')?.value.toUpperCase() || '';
            if (motivoNaoAcionado) {
                statusInfo.push(`EQUIPE FO NÃO ACIONADA. MOTIVO: ${motivoNaoAcionado}`);
            } else {
                statusInfo.push('EQUIPE FO NÃO ACIONADA');
            }
        }
    }

    // Verificar scan
    if (scan && scan.value === 'sim') {
        const metragem = document.getElementById('metragemScan')?.value.toUpperCase() || '';
        statusInfo.push(`EFETUADO SCAN: ${metragem}`);
    }

    // Verificar "Não escalonado" - se marcado, não gera nada na mensagem
    const naoEscalonado = document.getElementById('esc_nao_escalonado');
    if (!naoEscalonado || !naoEscalonado.checked) {
        // Verificar escalonamentos individuais (apenas se "Não escalonado" não estiver marcado)
        const escalonamentos = [];
        if (document.getElementById('esc_ponto_focal')?.checked) {
            const nome = document.getElementById('esc_ponto_focal_nome')?.value.toUpperCase() || '';
            escalonamentos.push(nome ? `PONTO FOCAL ${nome}` : 'PONTO FOCAL');
        }
        if (document.getElementById('esc_supervisor')?.checked) {
            const nome = document.getElementById('esc_supervisor_nome')?.value.toUpperCase() || '';
            escalonamentos.push(nome ? `SUPERVISOR ${nome}` : 'SUPERVISOR');
        }
        if (document.getElementById('esc_coordenador')?.checked) {
            const nome = document.getElementById('esc_coordenador_nome')?.value.toUpperCase() || '';
            escalonamentos.push(nome ? `COORDENADOR ${nome}` : 'COORDENADOR');
        }
        if (document.getElementById('esc_gerente')?.checked) {
            const nome = document.getElementById('esc_gerente_nome')?.value.toUpperCase() || '';
            escalonamentos.push(nome ? `GERENTE ${nome}` : 'GERENTE');
        }

        if (escalonamentos.length > 0) {
            statusInfo.push(`ESCALONADO: ${escalonamentos.join(', ')}`);
        }
    }

    // Verificar reagendamento
    if (equipe && equipe.value === 'sim') {
        let motivo = document.getElementById('motivoEquipe')?.value || '';
        if (motivo === 'OUTROS') {
            const outroMotivo = document.getElementById('outrosMotivoTexto')?.value.toUpperCase() || '';
            motivo = outroMotivo || 'OUTROS';
        }
        statusInfo.push(`INCIDENTE REAGENDADO. MOTIVO: ${motivo}`);
    }

    // Outras observações
    const outrasObservacoes = document.getElementById('outrasObservacoes')?.value.trim() || '';
    if (outrasObservacoes) {
        statusInfo.push(lapidarObservacoesEscalonamento(outrasObservacoes));
    }

    if (statusInfo.length > 0) {
        return statusInfo.join('. ') + '.\n';
    }

    return '';
}

function gerarConteudoStatusAtualizacao() {
    const percorrendo = document.querySelector('input[name="percorrendo"]:checked');
    const avaliando = document.querySelector('input[name="avaliando"]:checked');
    const endereco = document.getElementById('enderecoDano')?.value.toUpperCase() || '';
    const causa = document.getElementById('causaDano')?.value.toUpperCase() || '';
    const cabos = document.getElementById('cabosAfetados')?.value.toUpperCase() || '';
    const percentual = document.getElementById('validado')?.value || '';
    const novaAtualizacao = document.getElementById('novaAtualizacao')?.value.trim() || '';

    let statusInfo = [];

    if (endereco && causa && cabos) {
        statusInfo.push(`LOCALIZADO DANO EM ${endereco}, OCASIONADO POR ${causa}, AFETANDO CABOS DE ${cabos}`);
    }

    if (percorrendo && percorrendo.value === 'sim') {
        statusInfo.push('EQUIPE SEGUE PERCORRENDO ROTA');
    }

    if (avaliando && avaliando.value === 'sim') {
        statusInfo.push('EQUIPE SEGUE AVALIANDO INFRAESTRUTURA NO LOCAL');
    }

    if (percentual && parseInt(percentual) > 0) {
        statusInfo.push(`PERCENTUAL DE NODES NORMALIZADOS: ${percentual}%`);
    }

    // Adicionar nova atualização (texto livre)
    if (novaAtualizacao) {
        statusInfo.push(lapidarObservacoesEscalonamento(novaAtualizacao));
    }

    if (statusInfo.length > 0) {
        return statusInfo.join('. ') + '.\n';
    }

    return '';
}

function gerarConteudoStatusEncerramento() {
    const encerramento = document.getElementById('encerramento')?.value.toUpperCase() || '';
    const fato = removerPontoFinal(document.getElementById('fato')?.value.toUpperCase() || '');
    const causa = removerPontoFinal(document.getElementById('causa')?.value.toUpperCase() || '');
    const acao = removerPontoFinal(document.getElementById('acao')?.value.toUpperCase() || '');

    let msg = `## DATA E HORA DE ENCERRAMENTO: ${encerramento}\n`;
    msg += `FATO: ${fato}. CAUSA: ${causa}. AÇÃO: ${acao}.\n`;
    msg += `\n✅ SITUAÇÃO NORMALIZADA - SERVIÇO CONCLUÍDO COM SUCESSO`;

    return msg;
}

// ===== GERAÇÃO DE MENSAGENS - MANOBRA =====

async function gerarMensagemManobra() {
    console.log('🚀 FUNÇÃO gerarMensagemManobra() INICIADA');

    // Verificar se o incidente foi salvo
    if (!window.incidenteSalvo) {
        alert('❌ É obrigatório SALVAR o incidente antes de gerar a mensagem.\nClique em "Salvar Incidente" primeiro.');
        return;
    }

    const topologiaManobra = document.getElementById('topologiaManobra').value;
    if (!topologiaManobra) {
        alert('Por favor, selecione o tipo de topologia');
        return;
    }

    const tipoStatus = document.getElementById('statusManobra').value;
    if (!tipoStatus) {
        alert('Por favor, selecione o tipo de status');
        return;
    }

    const tipoImpactoElement = document.querySelector('input[name="tipoImpactoManobra"]:checked');
    if (!tipoImpactoElement) {
        alert('Por favor, selecione se o incidente tem impacto ou não');
        return;
    }

    // Validar campos de data/hora
    const camposDataHora = [];
    if (tipoStatus === 'encerramento') {
        camposDataHora.push('encerramentoManobra');
    }

    if (!Validators.validarCamposDataHora(camposDataHora)) {
        alert('Por favor, corrija os campos de data/hora no formato dd/mm/aaaa hh:mm');
        return;
    }

    const get = id => document.getElementById(id)?.value.toUpperCase() || '';
    const tipoImpactoTexto = tipoImpactoElement.value === 'com' ? 'COM IMPACTO' : 'SEM IMPACTO';
    const impactoManobraValor = document.getElementById('impactoManobra').value;
    const alertaImpactoManobra = Validators.verificarAlertaImpacto(topologiaManobra, impactoManobraValor);

    let msg = `## COP REDE INFORMA: INCIDENTE ${tipoImpactoTexto}
## MANOBRA DE FIBRA RESIDENCIAL\n`;
    msg += `## TOPOLOGIA: ${get('topologiaManobra')}\n`;
    msg += `## TICKET DA MANOBRA: ${get('ticketManobra')}\n`;
    msg += `## INCIDENTE: ${get('incidenteManobra')}\n`;
    msg += `## CIDADE/CLUSTER: ${get('cidadeManobra')}\n`;
    msg += `## ÁREA/DISTRITO: ${get('distritoManobra')}\n`;
    msg += `## IMPACTO: ${get('impactoManobra')}${alertaImpactoManobra}\n`;
    msg += `## BASE AFETADA: ${get('baseManobra')}\n`;
    msg += `## DATA E HORA DE INÍCIO: ${get('horarioInicioManobra') || 'N/A'}\n`;
    msg += `## RESPONSÁVEL: ${get('responsavelManobra')}\n`;
    msg += `## EXECUTOR: ${get('executorManobra')}\n`;
    msg += `## ENDEREÇO: ${get('enderecoManobra')}\n`;
    msg += `## PROPOSTO: ${get('propostoManobra')}\n`;
    msg += `## TIPO DE STATUS: ${document.getElementById('statusManobra').options[document.getElementById('statusManobra').selectedIndex].text.toUpperCase()}\n`;

    if (tipoStatus === 'inicial') {
        const manobraIniciada = document.querySelector('input[name="manobra_iniciada"]:checked');

        if (manobraIniciada) {
            if (manobraIniciada.value === 'sim') {
                msg += `MANOBRA INICIADA.\n`;
            } else {
                const motivoNaoIniciada = document.getElementById('motivoManobraNaoIniciada')?.value.toUpperCase() || '';
                if (motivoNaoIniciada) {
                    msg += `MANOBRA NÃO INICIADA. MOTIVO: ${motivoNaoIniciada}.\n`;
                } else {
                    msg += `MANOBRA NÃO INICIADA.\n`;
                }
            }
        }
    } else if (tipoStatus === 'atualizacao') {
        const percentual = get('validadoManobra');
        const atualizacao = get('atualizacaoManobra');

        if (percentual && parseInt(percentual) > 0) {
            msg += `PERCENTUAL DE NODES NORMALIZADOS: ${percentual}%\n`;
        }

        if (atualizacao) {
            msg += `${atualizacao}\n`;
        }
    } else if (tipoStatus === 'estouroManobra') {
        // Gerar mensagem de Estouro de Manobra com formato específico
        const statusEstouroValue = document.getElementById('statusEstouroManobra')?.value || '';
        const statusEstouroTexto = statusEstouroValue === 'atualizacao' ? 'ATUALIZAÇÃO' : (statusEstouroValue === 'encerramento' ? 'ENCERRAMENTO' : '');

        msg = `## COP REDE INFORMA: INCIDENTE ${tipoImpactoTexto}\n`;
        msg += `## MANOBRA DE FIBRA RESIDENCIAL: ESTOURO DE MANOBRA\n`;
        msg += `## MOTIVO: ${get('motivoEstouro')}\n`;
        msg += `## TICKET (MANOBRA): ${get('ticketEstouro')}\n`;
        msg += `## INCIDENTE (OUTAGE): ${get('incidenteEstouro')}\n`;
        msg += `## DATA/HORA DE INÍCIO: ${get('horarioInicioEstouro')}\n`;
        msg += `## CIDADE/CLUSTER: ${get('cidadeEstouro')}\n`;
        msg += `## DISTRITO/ROTA: ${get('distritoEstouro')}\n`;
        msg += `## IMPACTO: ${get('impactoEstouro')}\n`;
        msg += `## BASE IMPACTADA: ${get('baseEstouro')}\n`;
        msg += `## ENDEREÇO: ${get('enderecoEstouro')}\n`;
        msg += `## TIPO DE STATUS: ${statusEstouroTexto}\n`;

        if (statusEstouroValue === 'atualizacao') {
            msg += `## STATUS DE ATUALIZAÇÃO: ${get('statusAtualizacaoEstouro')}\n`;
        } else if (statusEstouroValue === 'encerramento') {
            msg += `## DATA/HORA DE ENCERRAMENTO: ${get('horarioFechamentoEstouro')}\n`;
            msg += `FATO: ${get('fatoEstouro')}\n`;
            msg += `CAUSA: ${get('causaEstouro')}\n`;
            msg += `AÇÃO: ${get('acaoEstouro')}\n`;
            msg += `\n✅ SITUAÇÃO NORMALIZADA - SERVIÇO CONCLUÍDO COM SUCESSO`;
        }
    } else if (tipoStatus === 'encerramento') {
        msg += `## DATA E HORA DE ENCERRAMENTO: ${get('encerramentoManobra')}\n`;
        msg += `FATO: ${get('fatoManobra')}\n`;
        msg += `CAUSA: ${get('causaManobra')}\n`;
        msg += `AÇÃO: ${get('acaoManobra')}\n`;
        msg += `\n✅ SITUAÇÃO NORMALIZADA - SERVIÇO CONCLUÍDO COM SUCESSO`;
    }

    // Remover pontos duplicados da mensagem
    msg = removerPontosDuplicados(msg);

    // Verificar se a mensagem é duplicada (menos de 1 minuto)
    const verificacaoManobra = verificarDuplicacaoMensagem(msg);
    if (verificacaoManobra.duplicada) {
        alert(`❌ Esta mensagem já foi gerada há menos de 1 minuto.\nAguarde ${verificacaoManobra.tempoRestante} segundos para gerar novamente.`);
        return;
    }

    // Registrar mensagem gerada
    registrarMensagemGerada(msg);

    document.getElementById('output').textContent = msg;
    document.getElementById('outputContainer').classList.remove('hidden');

    // ENVIO DA MENSAGEM COMPLETA PARA O GRUPO (sempre)
    await smsService.sendFullMessageToGroup(msg);

    // ENVIO DE ALERTAS INDIVIDUAIS (apenas quando impacto alto)
    const dadosSMS = coletarDadosFormulario('manobra');
    const shouldAutoSend = verificarEnvioAutomaticoSMS(topologiaManobra, impactoManobraValor, tipoStatus);

    if (shouldAutoSend) {
        const resultSMS = await sendSMSNotification('manobra', dadosSMS);
        if (resultSMS) {
            showSMSFeedback(resultSMS);
        }
    }

    // SALVAMENTO AUTOMÁTICO (exceto no status inicial)
    await salvarAutomaticamente('manobra', tipoStatus);

    // MOSTRAR POPUP DE CONFIRMAÇÃO
    console.log('📢 CHAMANDO mostrarPopupMensagem() [MANOBRA]...');
    mostrarPopupMensagem();
    console.log('📢 mostrarPopupMensagem() FOI CHAMADA [MANOBRA]');
}

// ===== VERIFICAÇÃO DE ENVIO AUTOMÁTICO =====

/**
 * Verifica se deve enviar SMS automaticamente baseado no impacto e status
 */
function verificarEnvioAutomaticoSMS(topologia, impacto, tipoStatus) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICANDO CONDIÇÕES PARA ALERTA INDIVIDUAL:');
    console.log(`   📍 Topologia: "${topologia}"`);
    console.log(`   📊 Impacto: "${impacto}"`);
    console.log(`   📋 Status: "${tipoStatus}"`);

    // Se configuração autoSendOnHighImpact não estiver ativa, retorna false
    if (!CONFIG.notification.autoSendOnHighImpact) {
        console.log('❌ RESULTADO: autoSendOnHighImpact desativado');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
    }

    // REGRA: Só envia notificação se o status for "inicial"
    if (tipoStatus !== 'inicial') {
        console.log(`❌ RESULTADO: Status "${tipoStatus}" ≠ "inicial" → NÃO ENVIA`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
    }

    const numero = parseInt(impacto);
    if (isNaN(numero)) {
        console.log('❌ RESULTADO: Impacto inválido (não é número)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return false;
    }

    const limites = CONFIG.escalonamento;
    console.log(`   🎯 Limites configurados: HFC ≥ ${limites.HFC}, GPON ≥ ${limites.GPON}`);

    // Verifica se atinge os limites de escalonamento
    if (topologia === 'HFC') {
        if (numero >= limites.HFC) {
            console.log(`✅ RESULTADO: HFC ${numero} ≥ ${limites.HFC} + Status inicial → ENVIA ALERTA INDIVIDUAL`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return true;
        } else {
            console.log(`❌ RESULTADO: HFC ${numero} < ${limites.HFC} → NÃO ENVIA`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return false;
        }
    } else if (topologia === 'GPON') {
        if (numero >= limites.GPON) {
            console.log(`✅ RESULTADO: GPON ${numero} ≥ ${limites.GPON} + Status inicial → ENVIA ALERTA INDIVIDUAL`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return true;
        } else {
            console.log(`❌ RESULTADO: GPON ${numero} < ${limites.GPON} → NÃO ENVIA`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return false;
        }
    }

    console.log(`❌ RESULTADO: Topologia "${topologia}" não reconhecida → NÃO ENVIA`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
}

// ===== SALVAMENTO AUTOMÁTICO =====

async function salvarAutomaticamente(tipo, tipoStatus) {
    // Só salvar automaticamente em atualização ou encerramento
    if (tipoStatus === 'inicial') return;

    const incidenteId = document.getElementById('incidenteId').value.trim();
    if (!incidenteId) return;

    const dados = coletarDadosFormulario(tipo);
    dados.statusEncerrado = (tipoStatus === 'encerramento');

    try {
        const todosIncidentes = await jsonBinService.buscarTodosIncidentes();
        const incidenteExistente = todosIncidentes.find(inc => inc.incidente_id === incidenteId);

        if (incidenteExistente) {
            incidenteExistente.dados = dados;
            incidenteExistente.data_atualizacao = new Date().toISOString();
            incidenteExistente.ultimoStatus = tipoStatus;

            await jsonBinService.salvarTodosIncidentes(todosIncidentes);
            console.log(`✅ Incidente ${incidenteId} salvo automaticamente (${tipoStatus})`);
        }
    } catch (error) {
        console.error('Erro ao salvar automaticamente:', error);
    }
}

// ===== FUNÇÕES DE OUTPUT =====

/**
 * Copia a mensagem gerada usando a API moderna do Clipboard
 */
async function copiarMensagem() {
    const output = document.getElementById('output');
    const texto = output.textContent;

    try {
        // Usar a API moderna do Clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(texto);
            mostrarFeedbackCopia(true);
        } else {
            // Fallback para navegadores antigos
            copiarMensagemFallback(texto);
        }
    } catch (error) {
        console.error('Erro ao copiar:', error);
        copiarMensagemFallback(texto);
    }
}

/**
 * Fallback para copiar usando o método antigo (para compatibilidade)
 */
function copiarMensagemFallback(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        mostrarFeedbackCopia(true);
    } catch (error) {
        console.error('Erro ao copiar (fallback):', error);
        mostrarFeedbackCopia(false);
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * Mostra feedback visual ao copiar
 */
function mostrarFeedbackCopia(sucesso) {
    const btn = document.querySelector('.btn-copy');
    const originalText = btn.innerHTML;

    if (sucesso) {
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    } else {
        btn.innerHTML = '<i class="fas fa-times"></i> Erro ao copiar';
    }

    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

/**
 * Limpa a mensagem gerada
 */
function limparMensagem() {
    document.getElementById('output').textContent = '';
    document.getElementById('outputContainer').classList.add('hidden');
}

// ===== FUNÇÃO AUXILIAR =====

/**
 * Expande/recolhe a lista de incidentes
 */
function toggleExpandirLista() {
    const incidentList = document.getElementById('incidentList');
    const expandIcon = document.getElementById('expandIcon');

    if (incidentList.classList.contains('expanded')) {
        incidentList.classList.remove('expanded');
        expandIcon.className = 'fas fa-expand-alt';
    } else {
        incidentList.classList.add('expanded');
        expandIcon.className = 'fas fa-compress-alt';
    }
}

// ===== POPUP DE CONFIRMAÇÃO =====

/**
 * Mostra o popup de mensagem gerada
 */
function mostrarPopupMensagem() {
    try {
        console.log('🎉 INICIANDO mostrarPopupMensagem()...');

        const popup = document.getElementById('mensagemPopup');
        console.log('Elemento popup:', popup);

        if (!popup) {
            console.error('❌ ERRO: Elemento popup não encontrado!');
            alert('Erro: Popup não encontrado no DOM');
            return;
        }

        console.log('Classes atuais:', popup.className);
        popup.classList.remove('hidden');
        console.log('Classes após remover hidden:', popup.className);
        console.log('Display style:', window.getComputedStyle(popup).display);

        // Garantir que está visível forçando o estilo
        popup.style.display = 'flex';
        console.log('✅ Popup AGORA ESTÁ VISÍVEL!');

        // Fechar automaticamente após 3 segundos
        setTimeout(() => {
            console.log('⏰ Fechando popup automaticamente após 3s...');
            fecharPopupMensagem();
        }, 3000);
    } catch (error) {
        console.error('❌ ERRO CRÍTICO no mostrarPopupMensagem:', error);
        alert('Erro ao mostrar popup: ' + error.message);
    }
}

/**
 * Fecha o popup de mensagem gerada
 */
function fecharPopupMensagem() {
    try {
        console.log('🔒 FECHANDO popup...');
        const popup = document.getElementById('mensagemPopup');

        if (!popup) {
            console.error('❌ Elemento popup não encontrado ao fechar!');
            return;
        }

        popup.classList.add('hidden');
        popup.style.display = 'none';
        console.log('✅ Popup fechado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao fechar popup:', error);
    }
}

// ===== INICIALIZAÇÃO =====

// Inicializar flag de incidente salvo
window.incidenteSalvo = false;
if (typeof atualizarBotoesGerarMensagem === 'function') {
    atualizarBotoesGerarMensagem();
}

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar flag de incidente salvo
    window.incidenteSalvo = false;
    if (typeof atualizarBotoesGerarMensagem === 'function') {
        atualizarBotoesGerarMensagem();
    }

    // Atualizar lista de incidentes ao carregar
    atualizarListaIncidentes();

    // Converter inputs para maiúsculas e remover pontos duplicados
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.addEventListener('input', function() {
                this.value = this.value.toUpperCase();
                this.value = this.value.replace(/\.{2,}/g, '.');
            });
        }
    });

    // Verificar se popup existe e configurar event listener
    const popupElement = document.getElementById('mensagemPopup');
    if (popupElement) {
        console.log('✅ Popup encontrado no carregamento da página');

        // Fechar popup ao clicar fora do card
        popupElement.addEventListener('click', function(e) {
            if (e.target === this) {
                fecharPopupMensagem();
            }
        });
    } else {
        console.error('❌ Popup NÃO encontrado no carregamento da página!');
    }
});

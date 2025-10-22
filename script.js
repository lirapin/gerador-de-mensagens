<script>
  function gerarMensagemManobra() {
    const get = id => document.getElementById(id).value.toUpperCase() || '';

    let msg = `## MANOBRA DE FIBRA RESIDENCIAL\n`;
    msg += `## TOPOLOGIA: ${get('topologiaManobra')}\n`;
    msg += `## TICKET: ${get('ticket')}\n`;
    msg += `## INCIDENTE: ${get('incidenteManobra')}\n`;
    msg += `## CIDADE: ${get('cidadeManobra')}\n`;
    msg += `## DISTRITO: ${get('distritoManobra')}\n`;
    msg += `## IMPACTO: ${get('impactoManobra')}\n`;
    msg += `## BASE AFETADA: ${get('baseManobra')}\n`;
    msg += `## EXECUTOR: ${get('executor')}\n`;
    msg += `## RESPONSÁVEL: ${get('responsavel')}\n`;
    msg += `## ENDEREÇO: ${get('enderecoManobra')}\n`;
    msg += `## HORÁRIO DE INÍCIO: ${get('inicio')}\n`;
    msg += `## PROPOSTO: ${get('proposto')}\n`;
    msg += `## STATUS: ${get('statusManobra')}\n`;
    msg += `## ⚠️`;

    document.getElementById('output').innerText = msg;
  }
</script>
// Armazena todos os incidentes ativos
let incidentesAtivos = JSON.parse(localStorage.getItem('incidentesAtivos')) || {};
let incidenteAtual = null;  // Incidente sendo trabalhado no momento

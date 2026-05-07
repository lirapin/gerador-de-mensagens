/**
 * Interface de notificação (mantido para compatibilidade)
 * As notificações são enviadas automaticamente quando HFC ≥ 10 ou GPON ≥ 300
 */

/**
 * Envia notificação ao gerar mensagem (integração)
 */
async function sendSMSNotification(tipo, dados) {
    if (!smsService.isEnabled()) {
        console.log('⚠️ Notificação não configurada. Configure o bot Telegram em js/config-inline.js');
        return null;
    }

    try {
        const result = await smsService.sendNotification(tipo, dados);
        return result;
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return null;
    }
}

/**
 * Mostra feedback da notificação na UI
 */
function showSMSFeedback(result) {
    if (!result) return;

    const outputContainer = document.getElementById('outputContainer');

    // Criar elemento de feedback
    const feedback = document.createElement('div');
    if (result.success) {
        feedback.className = 'sms-feedback success';
        feedback.innerHTML = `
            <strong><i class="fas fa-check-circle"></i> Notificação enviada via Telegram!</strong><br>
            ${result.message}
        `;
    } else {
        feedback.className = 'sms-feedback error';
        feedback.innerHTML = `
            <strong><i class="fas fa-exclamation-circle"></i> Erro ao enviar notificação</strong><br>
            ${result.message}
        `;
    }

    // Remover feedback anterior se existir
    const oldFeedback = outputContainer.querySelector('.sms-feedback');
    if (oldFeedback) {
        oldFeedback.remove();
    }

    outputContainer.appendChild(feedback);

    // Remover após 10 segundos
    setTimeout(() => {
        feedback.style.transition = 'opacity 0.5s';
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 500);
    }, 10000);
}

/**
 * Serviço de notificação via Telegram
 */

class NotificationService {
    constructor() {
        this.config = CONFIG.notification;
        this.enabled = this.config.enabled;
    }

    /**
     * Verifica se o serviço de notificação está habilitado
     */
    isEnabled() {
        return this.enabled &&
               this.config.telegram.botToken &&
               this.config.telegram.chatIds &&
               this.config.telegram.chatIds.length > 0;
    }

    /**
     * Ativa ou desativa o envio de notificações
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('notification_enabled', enabled ? 'true' : 'false');
        console.log(`Notificação ${enabled ? 'ativada' : 'desativada'}`);
    }

    /**
     * Carrega estado do localStorage
     */
    loadState() {
        const savedState = localStorage.getItem('notification_enabled');
        if (savedState !== null) {
            this.enabled = savedState === 'true';
        }
    }

    /**
     * Constrói a mensagem baseada nos dados do incidente
     */
    buildMessage(tipo, dados) {
        const prefix = this.config.template.prefix;

        let outage = '';
        let cidade = '';
        let impacto = '';

        if (tipo === 'rompimento') {
            outage = dados.incidente || 'N/A';
            cidade = dados.cidade || 'N/A';
            impacto = dados.impacto || '0';
        } else if (tipo === 'manobra') {
            outage = dados.incidenteManobra || 'N/A';
            cidade = dados.cidadeManobra || 'N/A';
            impacto = dados.impactoManobra || '0';
        }

        // Construir mensagem formatada para Telegram (suporta Markdown)
        const message = `${prefix}

📋 *Outage:* ${outage}
📍 *Cidade:* ${cidade}
⚠️ *Impacto:* ${impacto}`;

        return message;
    }

    /**
     * Envia mensagem via Telegram Bot API para um chat específico
     */
    async sendViaTelegram(chatId, message) {
        const { botToken, workerUrl } = this.config.telegram;

        // Validar configurações
        if (!botToken || botToken.trim() === '') {
            throw new Error('Token do bot Telegram não configurado. Veja instruções em TELEGRAM_SETUP.md');
        }

        if (!chatId || chatId.trim() === '') {
            throw new Error('Chat ID não configurado. Veja instruções em TELEGRAM_SETUP.md');
        }

        // Escolher entre Worker (proxy) ou API direta
        const useWorker = workerUrl && workerUrl.trim() !== '';
        const url = useWorker ? workerUrl : `https://api.telegram.org/bot${botToken}/sendMessage`;

        // Preparar dados
        const data = useWorker ? {
            // Formato para o Worker
            botToken: botToken,
            chatId: chatId,
            text: message,
            parseMode: 'Markdown'
        } : {
            // Formato para API direta
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        };

        console.log(`📱 Enviando notificação via ${useWorker ? 'Cloudflare Worker' : 'API direta'} para chat ${chatId}...`);
        if (useWorker) {
            console.log(`🔧 Worker URL: ${workerUrl}`);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.description || 'Erro ao enviar mensagem no Telegram');
            }

            const result = await response.json();

            if (!result.ok) {
                throw new Error(result.description || 'Erro desconhecido');
            }

            console.log('✅ Mensagem enviada com sucesso!', result);

            return {
                success: true,
                message_id: result.result.message_id,
                chat_id: result.result.chat.id
            };
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem Telegram:', error);
            throw error;
        }
    }

    /**
     * Envia notificação para todos os destinatários configurados
     */
    async sendNotification(tipo, dados) {
        if (!this.isEnabled()) {
            console.log('Notificação desabilitada ou não configurada');
            return {
                success: false,
                message: 'Notificação desabilitada ou não configurada'
            };
        }

        const message = this.buildMessage(tipo, dados);
        const { chatIds } = this.config.telegram;
        const results = [];
        let successCount = 0;
        let errorCount = 0;

        try {
            if (this.config.provider === 'telegram') {
                // Enviar para todos os chat IDs configurados
                for (const chatId of chatIds) {
                    try {
                        const result = await this.sendViaTelegram(chatId, message);
                        results.push({
                            chatId,
                            success: true,
                            result
                        });
                        successCount++;
                        console.log(`✅ Mensagem enviada para chat ${chatId}`);
                    } catch (error) {
                        results.push({
                            chatId,
                            success: false,
                            error: error.message
                        });
                        errorCount++;
                        console.error(`❌ Erro ao enviar para chat ${chatId}:`, error.message);
                    }
                }

                this.updateStats(successCount > 0);

                return {
                    success: successCount > 0,
                    message: `${successCount} enviada(s), ${errorCount} erro(s)`,
                    successCount,
                    errorCount,
                    results
                };
            } else {
                throw new Error(`Provedor ${this.config.provider} não implementado`);
            }
        } catch (error) {
            this.updateStats(false);
            console.error('Erro ao enviar notificação:', error);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Envia mensagem COMPLETA para o grupo do Telegram
     * @param {string} fullMessage - Mensagem completa formatada
     * @returns {Promise<Object>} Resultado do envio
     */
    async sendFullMessageToGroup(fullMessage) {
        const { groupChatId, botToken } = this.config.telegram;

        // Verificar se grupo está configurado
        if (!groupChatId || groupChatId.trim() === '') {
            console.log('⚠️ Grupo não configurado. Mensagem não enviada ao grupo.');
            return {
                success: false,
                message: 'Grupo não configurado'
            };
        }

        if (!botToken || botToken.trim() === '') {
            console.error('❌ Token do bot não configurado');
            return {
                success: false,
                message: 'Token do bot não configurado'
            };
        }

        console.log('📢 Enviando mensagem completa para o grupo...');

        try {
            const result = await this.sendViaTelegram(groupChatId, fullMessage);
            console.log(`✅ Mensagem completa enviada para o grupo ${groupChatId}`);

            return {
                success: true,
                message: 'Mensagem enviada ao grupo',
                result: result
            };
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para o grupo:`, error.message);
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Testa o envio de notificação
     */
    async testNotification() {
        const testData = {
            incidente: 'INC-TEST-001',
            cidade: 'RIO DE JANEIRO - RJO',
            impacto: '50'
        };

        return await this.sendNotification('rompimento', testData);
    }

    /**
     * Obtém estatísticas de notificações
     */
    getStats() {
        const sent = parseInt(localStorage.getItem('notification_sent_count') || '0');
        const errors = parseInt(localStorage.getItem('notification_error_count') || '0');
        const lastSent = localStorage.getItem('notification_last_sent');

        return {
            sent,
            errors,
            lastSent: lastSent ? new Date(lastSent).toLocaleString() : 'Nunca'
        };
    }

    /**
     * Atualiza estatísticas após envio
     */
    updateStats(success) {
        if (success) {
            const sent = parseInt(localStorage.getItem('notification_sent_count') || '0');
            localStorage.setItem('notification_sent_count', (sent + 1).toString());
            localStorage.setItem('notification_last_sent', new Date().toISOString());
        } else {
            const errors = parseInt(localStorage.getItem('notification_error_count') || '0');
            localStorage.setItem('notification_error_count', (errors + 1).toString());
        }
    }
}

// Instanciar serviço (mantém nome 'smsService' para compatibilidade)
const smsService = new NotificationService();

// Carregar estado salvo
document.addEventListener('DOMContentLoaded', function() {
    smsService.loadState();
});

// Exportar serviço
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}

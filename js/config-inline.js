/**
 * Configuração da aplicação
 * Este arquivo deve estar presente para a aplicação funcionar
 */

// Configuração padrão (será sobrescrita se config.js existir)
window.CONFIG = window.CONFIG || {
    // Configuração do JSONBin.io
    jsonbin: {
        binId: '690480d2ae596e708f39dcad',
        accessKey: '$2a$10$iCHPT/M2gqtqeGsBZ/AdCeE.Y/yihLCb5IKZbACZrafL8/.fIuRAW',
        baseUrl: 'https://api.jsonbin.io/v3/b'
    },

    // Configurações de limpeza automática
    cleanup: {
        hoursEncerrado: 3,
        hoursInativo: 24
    },

    // Limites de escalonamento
    escalonamento: {
        HFC: 10,
        GPON: 300
    },

    // Configurações de notificação automática via Telegram
    notification: {
        enabled: true,
        provider: 'telegram',
        autoSendOnHighImpact: true,

        telegram: {
            botToken: '8266961280:AAEqEiuefaJy9UzGNuXYJm1ClIsqrVk-Y2k',

            // URL do Cloudflare Worker (proxy para resolver CORS)
            workerUrl: 'https://telegram-proxy.nelson-soares.workers.dev',

            // Lista de Chat IDs que receberão ALERTAS CURTOS (quando impacto alto)
            chatIds: [
                '1834260126',  // Nelson Soares
                '5963809768'   // Kelly Lira
            ],

            // Chat ID do grupo que receberá MENSAGEM COMPLETA (sempre)
            groupChatId: '-1003350697831'  // Grupo: Cop Rede
        },

        template: {
            prefix: '🚨 COP REDE'
        }
    }
};

// Tornar CONFIG acessível globalmente para todos os scripts
var CONFIG = window.CONFIG;

// Log de carregamento
console.log('✅ Configuração carregada com sucesso!');
console.log('📱 Notificação Telegram:', CONFIG.notification.enabled ? 'ATIVA' : 'INATIVA');

// Alertas individuais
if (CONFIG.notification.telegram.chatIds && CONFIG.notification.telegram.chatIds.length > 0) {
    console.log(`👤 Alertas individuais: ${CONFIG.notification.telegram.chatIds.length} destinatário(s)`);
    CONFIG.notification.telegram.chatIds.forEach((id, index) => {
        console.log(`  ${index + 1}. Chat ID: ${id}`);
    });
} else {
    console.warn('⚠️ Nenhum destinatário individual configurado');
}

// Grupo
if (CONFIG.notification.telegram.groupChatId) {
    console.log(`👥 Grupo configurado: ${CONFIG.notification.telegram.groupChatId}`);
} else {
    console.warn('⚠️ Grupo não configurado');
}

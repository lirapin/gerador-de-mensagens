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

    // Configurações de notificação automática
    notification: {
        enabled: true,
        provider: 'whatsapp',  // 'whatsapp' ou 'telegram'
        autoSendOnHighImpact: true,

        // Configurações do WhatsApp via Evolution API
        whatsapp: {
            // URL da Evolution API (Railway)
            apiUrl: 'https://evolution-api-production-b976.up.railway.app',

            // Chave de API da Evolution
            apiKey: 'coprede2026',

            // Nome da instância conectada
            instance: 'Cop Rede',

            // URL do Cloudflare Worker (proxy para resolver CORS)
            workerUrl: 'https://bitter-feather-847dwhatsapp-proxy.nelson-soares.workers.dev',

            // Lista de números que receberão ALERTAS CURTOS (quando impacto alto)
            // Formato: código do país + DDD + número (sem +, espaços ou traços)
            numbers: [
                '5521994579435',  // Kelly
                '5521974696943',  // Nelson
                '5521993576090',  // Pralon
                '5521993571609',  // Marcos
                '5521997594878',  // Bruno
                '5521994724277'   // Marley
            ],

            // ID do grupo que receberá MENSAGEM COMPLETA (sempre)
            // Formato: ID do grupo com sufixo @g.us
            groupId: '120363405983079974@g.us'  // Grupo: COP Rede
        },

        // Configurações do Telegram (mantido para fallback)
        telegram: {
            botToken: '8266961280:AAEqEiuefaJy9UzGNuXYJm1ClIsqrVk-Y2k',
            workerUrl: 'https://telegram-proxy.nelson-soares.workers.dev',
            chatIds: [
                '1834260126',  // Nelson Soares
                '5963809768'   // Kelly Lira
            ],
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
console.log(`📱 Notificação: ${CONFIG.notification.enabled ? 'ATIVA' : 'INATIVA'} (${CONFIG.notification.provider.toUpperCase()})`);

// Mostrar configuração baseada no provider
if (CONFIG.notification.provider === 'whatsapp') {
    // WhatsApp via Evolution API
    console.log(`🟢 WhatsApp API: ${CONFIG.notification.whatsapp.apiUrl}`);
    console.log(`📦 Instância: ${CONFIG.notification.whatsapp.instance}`);

    if (CONFIG.notification.whatsapp.numbers && CONFIG.notification.whatsapp.numbers.length > 0) {
        console.log(`👤 Alertas individuais: ${CONFIG.notification.whatsapp.numbers.length} destinatário(s)`);
        CONFIG.notification.whatsapp.numbers.forEach((num, index) => {
            console.log(`  ${index + 1}. Número: ${num}`);
        });
    } else {
        console.warn('⚠️ Nenhum destinatário individual configurado');
    }

    if (CONFIG.notification.whatsapp.groupId) {
        console.log(`👥 Grupo configurado: ${CONFIG.notification.whatsapp.groupId}`);
    } else {
        console.warn('⚠️ Grupo não configurado');
    }
} else {
    // Telegram
    if (CONFIG.notification.telegram.chatIds && CONFIG.notification.telegram.chatIds.length > 0) {
        console.log(`👤 Alertas individuais: ${CONFIG.notification.telegram.chatIds.length} destinatário(s)`);
        CONFIG.notification.telegram.chatIds.forEach((id, index) => {
            console.log(`  ${index + 1}. Chat ID: ${id}`);
        });
    } else {
        console.warn('⚠️ Nenhum destinatário individual configurado');
    }

    if (CONFIG.notification.telegram.groupChatId) {
        console.log(`👥 Grupo configurado: ${CONFIG.notification.telegram.groupChatId}`);
    } else {
        console.warn('⚠️ Grupo não configurado');
    }
}

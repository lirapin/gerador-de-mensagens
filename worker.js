/**
 * Cloudflare Worker - Proxy para Telegram Bot API
 *
 * Este worker atua como proxy entre o navegador e a API do Telegram,
 * resolvendo problemas de CORS.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Configurar CORS para permitir requisições do GitHub Pages
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  // Responder a requisições OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  // Apenas aceitar requisições POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Método não permitido. Use POST.'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // Obter dados da requisição
    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.botToken || !data.chatId || !data.text) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Parâmetros obrigatórios: botToken, chatId, text'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Construir URL da API do Telegram
    const telegramUrl = `https://api.telegram.org/bot${data.botToken}/sendMessage`

    // Preparar payload para o Telegram
    const telegramPayload = {
      chat_id: data.chatId,
      text: data.text,
      parse_mode: data.parseMode || 'Markdown'
    }

    // Fazer requisição para o Telegram
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(telegramPayload)
    })

    // Obter resposta do Telegram
    const telegramData = await telegramResponse.json()

    // Retornar resposta com CORS headers
    return new Response(JSON.stringify(telegramData), {
      status: telegramResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}

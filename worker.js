/**
 * Cloudflare Worker - Proxy para WhatsApp (Evolution API) e Telegram Bot API
 *
 * Este worker atua como proxy entre o navegador e as APIs de mensagens,
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
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

    // Detectar qual API usar baseado nos parâmetros
    if (data.apiUrl && data.apiKey && data.instance) {
      // Evolution API (WhatsApp)
      return await handleEvolutionAPI(data, corsHeaders)
    } else if (data.botToken && data.chatId) {
      // Telegram Bot API
      return await handleTelegramAPI(data, corsHeaders)
    } else {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Parâmetros inválidos. Use Evolution API (apiUrl, apiKey, instance, number, text) ou Telegram (botToken, chatId, text)'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }
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

/**
 * Processa requisições para Evolution API (WhatsApp)
 */
async function handleEvolutionAPI(data, corsHeaders) {
  // Validar dados obrigatórios
  if (!data.number || !data.text) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Parâmetros obrigatórios para Evolution API: apiUrl, apiKey, instance, number, text'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }

  // Construir URL da Evolution API
  const evolutionUrl = `${data.apiUrl}/message/sendText/${data.instance}`

  // Preparar payload para Evolution API
  const evolutionPayload = {
    number: data.number,
    options: {
      delay: 1200,
      presence: 'composing'
    },
    textMessage: {
      text: data.text
    }
  }

  console.log(`Enviando para Evolution API: ${evolutionUrl}`)

  // Fazer requisição para a Evolution API
  const evolutionResponse = await fetch(evolutionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': data.apiKey
    },
    body: JSON.stringify(evolutionPayload)
  })

  // Obter resposta da Evolution API
  const evolutionData = await evolutionResponse.json()

  // Formatar resposta no padrão esperado
  const response = {
    ok: evolutionResponse.ok && !evolutionData.error,
    result: evolutionData,
    provider: 'whatsapp'
  }

  if (evolutionData.error) {
    response.ok = false
    response.error = evolutionData.error
  }

  // Retornar resposta com CORS headers
  return new Response(JSON.stringify(response), {
    status: evolutionResponse.status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Processa requisições para Telegram Bot API
 */
async function handleTelegramAPI(data, corsHeaders) {
  // Validar dados obrigatórios
  if (!data.text) {
    return new Response(JSON.stringify({
      ok: false,
      error: 'Parâmetros obrigatórios para Telegram: botToken, chatId, text'
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

  // Adicionar info do provider
  telegramData.provider = 'telegram'

  // Retornar resposta com CORS headers
  return new Response(JSON.stringify(telegramData), {
    status: telegramResponse.status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

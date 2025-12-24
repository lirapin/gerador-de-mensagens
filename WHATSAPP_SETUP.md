# Configuração do WhatsApp via Evolution API

Este guia explica como configurar o envio de mensagens via WhatsApp usando a Evolution API.

## Pré-requisitos

- Conta no [Railway](https://railway.app) (oferece $5 de crédito gratuito)
- Número de WhatsApp disponível para conectar
- Conta no [Cloudflare](https://cloudflare.com) para o Worker (opcional, mas recomendado)

---

## Passo 1: Deploy da Evolution API no Railway

### 1.1 Criar conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub ou email
3. Você receberá $5 de crédito gratuito

### 1.2 Deploy com 1 clique

1. Acesse: **[Deploy Evolution API](https://railway.com/deploy/evolution-api-3)**
2. Clique em **"Deploy Now"**
3. Aguarde o deploy (cerca de 2-5 minutos)

### 1.3 Configurar variáveis de ambiente

Após o deploy, configure a variável obrigatória:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `AUTHENTICATION_API_KEY` | `sua-chave-secreta-aqui` | Chave para autenticar na API |

**Exemplo:** `AUTHENTICATION_API_KEY=minha-api-key-super-secreta-123`

### 1.4 Obter URL da API

Após o deploy, copie a URL gerada pelo Railway:
- Exemplo: `https://evolution-api-production-xxxx.up.railway.app`

---

## Passo 2: Conectar WhatsApp

### 2.1 Criar instância

Faça uma requisição POST para criar a instância:

```bash
curl -X POST "https://SUA-URL-RAILWAY/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "instanceName": "cop-rede",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 2.2 Obter QR Code

Faça uma requisição para obter o QR Code:

```bash
curl -X GET "https://SUA-URL-RAILWAY/instance/connect/cop-rede" \
  -H "apikey: SUA_API_KEY"
```

Ou acesse diretamente no navegador:
```
https://SUA-URL-RAILWAY/instance/connect/cop-rede?apikey=SUA_API_KEY
```

### 2.3 Escanear QR Code

1. Abra o WhatsApp no celular
2. Vá em **Configurações > Dispositivos conectados > Conectar dispositivo**
3. Escaneie o QR Code exibido
4. Aguarde a conexão ser estabelecida

---

## Passo 3: Obter IDs dos Contatos e Grupos

### 3.1 Listar grupos

```bash
curl -X GET "https://SUA-URL-RAILWAY/group/fetchAllGroups/cop-rede" \
  -H "apikey: SUA_API_KEY"
```

**Resposta exemplo:**
```json
[
  {
    "id": "120363123456789012@g.us",
    "subject": "Cop Rede",
    "size": 15
  }
]
```

O `id` é o que você usará como `groupId` na configuração.

### 3.2 Formato dos números

Para contatos individuais, use o formato:
- **Número:** `5521999999999` (código país + DDD + número, sem +, espaços ou traços)

---

## Passo 4: Configurar a Aplicação

### 4.1 Editar config-inline.js

Abra o arquivo `js/config-inline.js` e configure:

```javascript
notification: {
    enabled: true,
    provider: 'whatsapp',  // Usar WhatsApp
    autoSendOnHighImpact: true,

    whatsapp: {
        // URL da Evolution API no Railway
        apiUrl: 'https://evolution-api-production-xxxx.up.railway.app',

        // Sua API Key configurada no Railway
        apiKey: 'minha-api-key-super-secreta-123',

        // Nome da instância criada
        instance: 'cop-rede',

        // URL do Cloudflare Worker (proxy CORS)
        workerUrl: 'https://whatsapp-proxy.seu-usuario.workers.dev',

        // Números que receberão alertas individuais
        numbers: [
            '5521999999999',  // Nelson Soares
            '5521888888888'   // Kelly Lira
        ],

        // ID do grupo que receberá mensagens completas
        groupId: '120363123456789012@g.us'  // Grupo: Cop Rede
    }
}
```

---

## Passo 5: Atualizar Cloudflare Worker

### 5.1 Criar novo Worker

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em **Workers & Pages > Create Application > Create Worker**
3. Dê um nome: `whatsapp-proxy`
4. Cole o conteúdo do arquivo `worker.js` deste projeto
5. Clique em **Deploy**

### 5.2 Obter URL do Worker

Após o deploy, copie a URL:
- Exemplo: `https://whatsapp-proxy.seu-usuario.workers.dev`

### 5.3 Atualizar configuração

Adicione a URL do Worker no `config-inline.js`:
```javascript
workerUrl: 'https://whatsapp-proxy.seu-usuario.workers.dev'
```

---

## Testar Envio

### Teste via curl

```bash
curl -X POST "https://SUA-URL-RAILWAY/message/sendText/cop-rede" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "number": "5521999999999",
    "textMessage": {
      "text": "Teste de mensagem via Evolution API!"
    }
  }'
```

### Teste via aplicação

1. Abra a aplicação no navegador
2. Preencha um incidente de teste
3. Clique em "Gerar Mensagem"
4. Verifique no console (F12) se a mensagem foi enviada

---

## Troubleshooting

### Erro: "API Key não configurada"
- Verifique se a `apiKey` no `config-inline.js` está correta
- Certifique-se de que não está usando o placeholder `SUA_API_KEY_AQUI`

### Erro: "Instância não conectada"
- Verifique se o WhatsApp está conectado
- Tente reconectar escaneando o QR Code novamente

### Erro de CORS
- Certifique-se de que o Cloudflare Worker está configurado
- Verifique se a `workerUrl` está correta no `config-inline.js`

### Mensagem não chega no grupo
- Verifique se o `groupId` está no formato correto (`XXXXXXXX@g.us`)
- Certifique-se de que o número conectado está no grupo

---

## Custos

### Railway (Evolution API)
- **Gratuito:** $5 de crédito inicial
- **Após créditos:** ~$5-10/mês para uso básico

### Cloudflare Workers
- **Gratuito:** 100.000 requisições/dia
- Suficiente para uso corporativo normal

---

## Links Úteis

- [Evolution API - Documentação](https://doc.evolution-api.com)
- [Evolution API - GitHub](https://github.com/EvolutionAPI/evolution-api)
- [Railway - Deploy Template](https://railway.com/deploy/evolution-api-3)
- [Cloudflare Workers](https://workers.cloudflare.com)

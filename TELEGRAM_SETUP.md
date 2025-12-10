# Configuração do Telegram para Notificações Automáticas

## 🎯 Objetivo
Configurar um bot do Telegram para receber notificações automáticas quando o impacto atingir:
- **HFC ≥ 10 nós**
- **GPON ≥ 300 NAPs**

---

## 📱 Passo 1: Criar o Bot no Telegram

1. **Abra o Telegram** (app ou web.telegram.org)

2. **Procure por:** `@BotFather`
   - É o bot oficial do Telegram para criar outros bots
   - Tem o selo de verificação azul ✓

3. **Inicie uma conversa** com o BotFather clicando em **"Start"**

4. **Digite:** `/newbot`

5. **Escolha um nome** para o bot (exemplo: `COP Rede Notificações`)
   - Este é o nome que aparecerá nos contatos

6. **Escolha um username** (exemplo: `coprede_bot`)
   - Deve terminar com `bot` ou `_bot`
   - Deve ser único
   - Não pode ter espaços

7. **Copie o Token** que o BotFather fornece
   - Formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890`
   - ⚠️ **IMPORTANTE:** Guarde este token com segurança!

---

## 📲 Passo 2: Obter seu Chat ID

1. **Encontre seu bot** no Telegram
   - Procure pelo username que você criou (ex: `@coprede_bot`)

2. **Inicie uma conversa** com o bot
   - Clique em **"Start"** ou envie qualquer mensagem (ex: "Olá")

3. **Abra seu navegador** e acesse:
   ```
   https://api.telegram.org/bot<SEU_TOKEN>/getUpdates
   ```
   - Substitua `<SEU_TOKEN>` pelo token que você copiou
   - Exemplo completo:
     ```
     https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates
     ```

4. **Procure por `"chat"`** no resultado JSON
   - Você verá algo como:
     ```json
     {
       "chat": {
         "id": 123456789,
         "first_name": "Seu Nome",
         "type": "private"
       }
     }
     ```

5. **Copie o número do `id`** (exemplo: `123456789`)
   - Este é o seu **Chat ID**

---

## ⚙️ Passo 3: Configurar no Sistema

1. **Abra o arquivo:** `js/config-inline.js`

2. **Localize a seção `notification > telegram`:**
   ```javascript
   telegram: {
       botToken: '',  // Cole aqui o token do bot
       chatId: ''     // Cole aqui seu chat ID
   }
   ```

3. **Cole suas credenciais:**
   ```javascript
   telegram: {
       botToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890',
       chatId: '123456789'
   }
   ```

4. **Salve o arquivo**

---

## ✅ Passo 4: Testar

1. **Recarregue a página** do sistema (Ctrl+F5 ou Cmd+Shift+R)

2. **Abra o Console** do navegador (F12 → Console)
   - Você deve ver:
     ```
     ✅ Configuração carregada com sucesso!
     📱 Notificação Telegram: ATIVA
     💬 Chat ID configurado: 123456789
     ```

3. **Gere uma mensagem** com impacto alto:
   - HFC com impacto ≥ 10, OU
   - GPON com impacto ≥ 300

4. **Verifique no Telegram:**
   - Você deve receber uma mensagem do bot com:
     ```
     🚨 COP REDE

     📋 Outage: INC-123456
     📍 Cidade: RIO DE JANEIRO - RJO
     ⚠️ Impacto: 150
     ```

---

## 🔧 Solução de Problemas

### Erro: "Token do bot Telegram não configurado"
- Verifique se você colou o token corretamente em `config-inline.js`
- O token deve estar entre aspas: `'123456789:ABC...'`

### Erro: "Chat ID não configurado"
- Verifique se você colou o chat ID corretamente
- O chat ID deve ser um número: `'123456789'`

### Não recebe mensagem no Telegram
1. Verifique se iniciou conversa com o bot clicando em "Start"
2. Certifique-se que o token está correto
3. Certifique-se que o chat ID está correto
4. Abra o Console do navegador e veja se há erros

### Mensagem "Unauthorized" ou "Bad Request"
- Token inválido - crie um novo bot com o BotFather
- Chat ID errado - obtenha novamente usando `/getUpdates`

---

## 🎉 Pronto!

Agora suas notificações serão enviadas automaticamente via Telegram quando o impacto for alto!

**Vantagens do Telegram:**
- ✅ 100% gratuito
- ✅ Sem limites de mensagens
- ✅ Sem CORS ou restrições
- ✅ Funciona em qualquer dispositivo
- ✅ Histórico completo de notificações
- ✅ Sem necessidade de verificação de número

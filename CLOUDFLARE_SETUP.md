# Configuração do Cloudflare Worker (Proxy Telegram)

## 🎯 Objetivo
Criar um proxy serverless para resolver problemas de CORS ao enviar mensagens via Telegram Bot API.

---

## 📋 Passo a Passo

### 1️⃣ Criar conta no Cloudflare (Gratuito)

1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie uma conta gratuita
3. Confirme seu email

---

### 2️⃣ Criar o Worker

1. **Faça login** em: https://dash.cloudflare.com
2. No menu lateral, clique em **"Workers & Pages"**
3. Clique em **"Create application"**
4. Clique em **"Create Worker"**
5. Nome do worker: `telegram-proxy` (ou qualquer nome)
6. Clique em **"Deploy"**

---

### 3️⃣ Adicionar o código do Worker

1. Após o deploy, clique em **"Edit code"**
2. **Apague todo o código** que está lá
3. **Copie todo o conteúdo** do arquivo `worker.js` (na raiz do projeto)
4. **Cole no editor** do Cloudflare
5. Clique em **"Deploy"** (ou Ctrl+S / Cmd+S)

---

### 4️⃣ Copiar a URL do Worker

1. Após o deploy, você verá a URL do worker
2. Será algo como: `https://telegram-proxy.SEU-USUARIO.workers.dev`
3. **Copie esta URL completa**

**Exemplo:**
```
https://telegram-proxy.joaosilva123.workers.dev
```

---

### 5️⃣ Configurar no sistema

1. **Me envie a URL** que você copiou
2. Eu vou atualizar o `config-inline.js` com a URL
3. Farei push das mudanças
4. **Pronto!** O sistema vai funcionar em qualquer rede

---

## ✅ Teste

Depois de configurado, teste:

1. **No computador da empresa**, gere uma mensagem
2. Verifique se:
   - ✅ Mensagem completa vai para o grupo
   - ✅ Alertas vão para Nelson e Kelly (se impacto alto)
   - ✅ Sem erros de CORS no Console

---

## 🔒 Segurança

**O Worker é seguro?**
- ✅ Sim! Roda no edge da Cloudflare
- ✅ Não armazena dados
- ✅ Apenas repassa requisições
- ✅ Token nunca é exposto no código do browser

**Quem pode usar?**
- Apenas quem tiver acesso ao seu GitHub Pages
- Você pode restringir por domínio se quiser

---

## 💰 Custo

**Plano Gratuito:**
- ✅ 100.000 requisições/dia
- ✅ Suficiente para seu caso de uso
- ✅ Sem custo adicional

**Se ultrapassar:**
- US$ 0.50 por milhão de requisições adicionais
- (improvável no seu caso)

---

## 🆘 Problemas Comuns

### Worker não funciona
- Verifique se fez deploy após colar o código
- Teste a URL no navegador (deve retornar erro JSON)

### Ainda dá erro de CORS
- Certifique-se que a URL está correta em config-inline.js
- Limpe o cache do navegador (Ctrl+Shift+R)

### "Exceeded plan limits"
- Improvável, mas se acontecer, entre em contato comigo

---

## 📞 Próximo Passo

**Me envie a URL do seu Worker!**

Exemplo: `https://telegram-proxy.seunome.workers.dev`

Assim que você me enviar, eu configuro o sistema automaticamente!

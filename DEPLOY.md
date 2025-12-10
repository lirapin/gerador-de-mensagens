# 🚀 Guia de Deploy

## ⚠️ IMPORTANTE: Configuração Automática

O sistema está **100% configurado** e pronto para funcionar. Todas as credenciais já estão no arquivo `js/config.js` (local).

### 📱 Como Funciona

✅ **SMS Automático Ativo**
- Quando gerar mensagem com HFC ≥ 10 ou GPON ≥ 300
- Envia automaticamente para: **+5521991212107**
- **Sem precisar configurar nada!**

### 🌐 Deploy no GitHub Pages (ou Similar)

Como o `config.js` **não está no Git** (por segurança), você precisa:

#### **Opção 1: Copiar config.js para o servidor** (Recomendado)

1. Após fazer deploy, acesse seu servidor/hosting
2. Copie o arquivo `js/config.js` para lá
3. Pronto! Sistema funcionará automaticamente

#### **Opção 2: GitHub Pages com Actions** (Automático)

Se usar GitHub Pages, o arquivo `config.js` pode ser copiado via GitHub Actions ou manualmente.

#### **Opção 3: Usar arquivo local** (Desenvolvimento)

1. Clone o repositório
2. O `config.js` já está configurado
3. Abra `index.html` no navegador
4. Funciona imediatamente!

---

## 📋 Configuração

O arquivo `js/config.js` já contém **todas as credenciais necessárias**:

✅ **JSONBin.io** (sincronização de dados)
✅ **Twilio** (envio de SMS)
✅ **Número destino** configurado
✅ **Envio automático** ativado

**Regras de envio:**
- HFC ≥ 10 nodes → SMS automático
- GPON ≥ 300 naps → SMS automático

---

## 🎯 Teste Local

```bash
# Abra direto no navegador
open index.html

# Ou use servidor local
python -m http.server 8000
# Acesse: http://localhost:8000
```

**Gere uma mensagem com impacto alto e o SMS será enviado automaticamente!**

---

## 🔒 Segurança

- ✅ `config.js` está no `.gitignore`
- ✅ Credenciais **não vão** para o GitHub
- ✅ Apenas você tem acesso ao arquivo local
- ✅ Para deploy, copie manualmente ou use CI/CD

---

## ✨ Está Pronto!

**Não precisa configurar nada. Apenas:**
1. Abra a aplicação
2. Gere uma mensagem com impacto ≥ 10 (HFC) ou ≥ 300 (GPON)
3. SMS enviado automaticamente! 📱

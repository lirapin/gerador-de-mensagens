# Gerador de Mensagens - Fibra Óptica

Sistema de gerenciamento e geração de mensagens para incidentes de fibra óptica residencial.

## Funcionalidades

### Gerenciamento de incidentes
- Rompimento de fibra (HFC/GPON)
- Manobra de fibra residencial
- Estouro de manobra
- Status: inicial, atualização, encerramento

### Armazenamento de dados
- Sincronização em nuvem via JSONBin.io
- Fallback local com localStorage
- Compartilhamento entre múltiplos usuários

### Geração de mensagens
- Templates padronizados
- Validação automática de formatos
- Alertas de escalonamento

### Limpeza automática
- Remove incidentes encerrados após 3 horas
- Remove incidentes inativos após 24 horas

### Notificação via WhatsApp (Evolution API)
- Envio automático ao gerar mensagem
- Mensagem para grupo do WhatsApp
- Alertas individuais quando impacto alto (HFC ≥ 10 ou GPON ≥ 300)
- Integração com Evolution API via Cloudflare Worker

## Estrutura do projeto

```
geradomsg/
├── index.html              # Estrutura HTML principal
├── css/
│   └── styles.css          # Estilos da aplicação
├── js/
│   ├── config-inline.js    # Configurações (WhatsApp, JSONBin)
│   ├── api.js              # Serviço JSONBin.io
│   ├── sms.js              # Serviço de notificação (WhatsApp/Telegram)
│   ├── validators.js       # Funções de validação
│   ├── ui.js               # Lógica da interface
│   ├── ui-messages.js      # Geração de mensagens
│   └── ui-sms.js           # Interface de notificações
├── worker.js               # Cloudflare Worker (proxy CORS)
├── WHATSAPP_SETUP.md       # Documentação Evolution API
├── CLOUDFLARE_SETUP.md     # Documentação Cloudflare Worker
├── .gitignore              # Arquivos ignorados pelo Git
└── README.md               # Este arquivo
```

## Configuração

### 1. JSONBin.io (armazenamento)

1. Acesse [JSONBin.io](https://jsonbin.io/)
2. Crie uma conta gratuita
3. Crie um novo Bin
4. Copie o **Bin ID** e **Access Key**
5. Configure em `js/config-inline.js`

### 2. Evolution API (WhatsApp)

Consulte o arquivo `WHATSAPP_SETUP.md` para instruções detalhadas sobre:
- Deploy da Evolution API no Railway
- Configuração do Cloudflare Worker
- Conexão via QR Code ou Pairing Code

### 3. Cloudflare Worker

Consulte o arquivo `CLOUDFLARE_SETUP.md` para criar o proxy CORS necessário para envio de mensagens.

## Uso

### Criar um incidente

1. Selecione o tipo de incidente (Rompimento ou Manobra)
2. Preencha os campos obrigatórios
3. Clique em "Salvar incidente"
4. O incidente será compartilhado com todos os usuários

### Gerar mensagem

1. É obrigatório salvar o incidente antes de gerar a mensagem
2. Selecione o tipo de status (Inicial, Atualização, Encerramento)
3. Preencha os campos específicos do status
4. Clique em "Gerar mensagem"
5. Mensagem enviada automaticamente via WhatsApp (se configurado)

### Carregar incidente

1. Digite o número do incidente no campo de busca
2. Clique no ícone de busca
3. Ou clique em um incidente da lista

## Validações

- **Data/Hora**: Formato `dd/mm/aaaa hh:mm`
- **Campos numéricos**: Apenas números
- **Nome do usuário**: Mínimo 4 caracteres, sem números
- **Escalonamento automático**:
  - HFC: Impacto ≥ 10
  - GPON: Impacto ≥ 300

## Tipos de status

### Rompimento de fibra
- **Inicial**: Incidente acionado, scan realizado, escalonamento, reagendamento
- **Atualização**: Endereço do dano, causa, cabos afetados, percentual normalizado
- **Encerramento**: Fato, causa, ação

### Manobra de fibra
- **Inicial**: Manobra iniciada (sim/não com motivo)
- **Atualização**: Percentual normalizado, observações
- **Estouro de manobra**: Campos específicos para estouro
- **Encerramento**: Fato, causa, ação

## Tecnologias utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Armazenamento**: JSONBin.io (cloud), localStorage (fallback)
- **Notificações**: Evolution API (WhatsApp), Telegram Bot API
- **Proxy CORS**: Cloudflare Workers
- **Hospedagem**: GitHub Pages

## Desenvolvido por

N6105010 & N5923221

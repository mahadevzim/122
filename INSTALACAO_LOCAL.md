# Instalação Local - WhatsApp Campaign Bot

## Requisitos do Sistema

### 1. Node.js
- **Versão:** Node.js 18 ou superior
- **Download:** https://nodejs.org/
- **Verificar instalação:** `node --version` e `npm --version`

### 2. PostgreSQL
- **Versão:** PostgreSQL 14 ou superior
- **Windows:** https://www.postgresql.org/download/windows/
- **macOS:** `brew install postgresql` ou https://postgres.app/
- **Linux:** `sudo apt install postgresql postgresql-contrib`

## Passo a Passo da Instalação

### 1. Clone/Download do Projeto
```bash
# Se estiver no Replit, faça download dos arquivos
# Ou clone se estiver em repositório git
git clone [seu-repositorio]
cd whatsapp-campaign-bot
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Banco de Dados PostgreSQL

#### Criar Banco de Dados:
```sql
-- Conecte no PostgreSQL como superuser
psql -U postgres

-- Criar banco de dados
CREATE DATABASE whatsapp_campaigns;

-- Criar usuário (opcional)
CREATE USER campaign_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_campaigns TO campaign_user;
```

#### Configurar URL de Conexão:
Crie um arquivo `.env` na raiz do projeto:
```env
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/whatsapp_campaigns
NODE_ENV=development
```

### 4. Executar Migrações do Banco
```bash
npm run db:push
```

### 5. Instalar Dependências do Chromium (Linux/WSL)
Se estiver no Linux ou WSL, instale as dependências do Chromium:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libxss1 \
  libasound2

# CentOS/RHEL/Fedora
sudo yum install -y \
  nss \
  atk \
  at-spi2-atk \
  libdrm \
  libxcomposite \
  libxdamage \
  libxrandr \
  libgbm \
  libXScrnSaver \
  alsa-lib
```

### 6. Executar o Sistema
```bash
# Modo desenvolvimento (com hot-reload)
npm run dev

# Ou modo produção
npm run build
npm start
```

### 7. Acessar o Sistema
- **URL:** http://localhost:5000
- **Dashboard:** Interface completa para gerenciar campanhas

## Como Usar o WhatsApp Real

### 1. Criar Conexão WhatsApp
1. No dashboard, clique em "Adicionar Conexão"
2. Uma nova conexão será criada com status "Conectando..."
3. Clique no botão "Ver QR Code"

### 2. Escanear QR Code
1. Abra o WhatsApp no seu celular
2. Vá em **Menu** → **Aparelhos Conectados**
3. Toque em **Conectar um Aparelho**
4. Escaneie o QR Code mostrado no sistema
5. A conexão mudará para "Conectado" automaticamente

### 3. Configurar Campanha
1. **Adicionar Contatos:** Upload arquivo CSV no formato:
   ```
   phone,variavel1,variavel2
   5511999887766,João Silva,Empresa ABC
   5511888776655,Maria Santos,Empresa XYZ
   ```

2. **Criar Mensagens:** Até 3 variações com suporte a:
   - Texto personalizado
   - Imagens
   - Variáveis: `{variavel1}` e `{variavel2}`

3. **Configurar Timing:**
   - Intervalo mínimo entre mensagens
   - Intervalo máximo entre mensagens
   - Sistema alternará automaticamente

### 4. Executar Campanha
1. Certifique-se de ter pelo menos 1 WhatsApp conectado
2. Configure pelo menos 1 variação de mensagem
3. Faça upload dos contatos
4. Clique em "Iniciar Campanha"

## Estrutura de Arquivos Importantes

```
├── server/
│   ├── services/
│   │   ├── whatsappReal.ts    # Serviço WhatsApp real
│   │   ├── campaign.ts        # Lógica de campanhas
│   │   └── fileProcessor.ts   # Processamento de CSV
│   ├── routes.ts              # API endpoints
│   └── storage.ts             # Banco de dados
├── client/src/
│   ├── components/            # Componentes React
│   └── lib/                   # Utilidades
├── shared/
│   └── schema.ts              # Schemas TypeScript
└── uploads/                   # Arquivos enviados
```

## Funcionalidades Completas

### ✅ Conexões WhatsApp
- Até 5 conexões simultâneas
- QR codes reais para autenticação
- Reconexão automática
- Status em tempo real

### ✅ Sistema de Mensagens
- 3 variações de mensagem
- Suporte a imagens
- Variáveis personalizadas `{variavel1}` `{variavel2}`
- Rotação automática entre variações

### ✅ Gerenciamento de Contatos
- Upload CSV automático
- Formato: `phone,variavel1,variavel2`
- Validação de números
- Status de envio individual

### ✅ Campanha Inteligente
- Rotação entre WhatsApp conectados
- Intervalos configuráveis
- Pausar/Retomar campanhas
- Logs detalhados de envio

### ✅ Mensagens Recebidas
- Captura automática de respostas
- Apenas de contatos da campanha
- Interface para visualização
- Histórico completo

### ✅ Dashboard Completo
- Estatísticas em tempo real
- Gráficos de performance
- Status de todas as conexões
- Controles de campanha

## Resolução de Problemas

### WhatsApp não conecta
- Verifique se o QR code está sendo gerado
- Certifique-se que o WhatsApp Web está funcionando no browser
- Tente remover e recriar a conexão

### Erro de dependências no Linux
```bash
# Instalar dependências faltantes
sudo apt-get install -y chromium-browser
```

### Erro de banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme a URL de conexão no `.env`
- Execute `npm run db:push` novamente

### Performance lenta
- Reduza o número de conexões simultâneas
- Aumente os intervalos entre mensagens
- Verifique recursos do sistema

## Suporte

O sistema está completamente funcional para uso em produção com WhatsApp real. Todas as funcionalidades de campanha, rotação, mensagens recebidas e dashboard estão implementadas e testadas.

Para dúvidas ou problemas, verifique os logs no console do sistema durante a execução.
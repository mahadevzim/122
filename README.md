# WhatsApp Campaign Bot - Sistema Completo de Campanhas

Sistema profissional para campanhas em massa no WhatsApp com múltiplas conexões, rotação automática e dashboard completo.

## ✨ Características Principais

- 🔥 **5 Conexões WhatsApp** simultâneas com QR codes reais
- 📝 **3 Variações de Mensagem** com suporte a imagens e variáveis personalizadas
- 🔄 **Sistema de Rotação** inteligente entre contas e mensagens
- 📊 **Dashboard Completo** com estatísticas em tempo real
- 📱 **Mensagens Recebidas** - captura automática de respostas
- ⚡ **Sem Banco de Dados** - funciona 100% em memória
- 🎯 **Placeholders Personalizados** - `{variavel1}` e `{variavel2}`

## 🚀 Instalação Super Rápida

### Requisitos
- Node.js 18+ ([Download](https://nodejs.org/))

### Instalar e Executar
```bash
# 1. Baixar/clonar o projeto
git clone [seu-repositorio]
cd whatsapp-campaign-bot

# 2. Instalar dependências
npm install

# 3. Executar
npm run dev

# 4. Acessar
# http://localhost:5000
```

**Pronto! Sistema funcionando em 3 comandos.**

## 📋 Como Usar

### 1. Conectar WhatsApp
1. Clique em "Adicionar Conexão"
2. Clique em "Ver QR Code"
3. No seu celular: **WhatsApp** → **Menu** → **Aparelhos Conectados** → **Conectar um Aparelho**
4. Escaneie o QR Code

### 2. Preparar Contatos
Crie um arquivo CSV no formato:
```csv
phone,variavel1,variavel2
5511999887766,João Silva,Empresa ABC
5511888776655,Maria Santos,Loja XYZ
```

### 3. Configurar Mensagens
Use as 3 variações disponíveis com variáveis:
```
Olá {variavel1}! 👋

Temos uma oferta especial para {variavel2}.

Gostaria de saber mais?
```

### 4. Executar Campanha
- Configure os intervalos (30-60 segundos recomendado)
- Clique em "Iniciar Campanha"
- Sistema envia automaticamente com rotação

## 📁 Estrutura do Projeto

```
├── server/
│   ├── services/
│   │   ├── whatsappReal.ts    # WhatsApp Web.js
│   │   ├── campaign.ts        # Lógica de campanhas
│   │   └── fileProcessor.ts   # Processamento CSV
│   ├── routes.ts              # API endpoints
│   └── storage.ts             # Armazenamento em memória
├── client/src/
│   ├── components/            # Interface React
│   └── pages/                 # Páginas do dashboard
└── uploads/                   # Arquivos enviados
```

## ⚙️ Funcionalidades Técnicas

### Sistema de Rotação Inteligente
- **WhatsApp:** Alterna entre todas as contas conectadas
- **Mensagens:** Rotaciona entre as 3 variações
- **Timing:** Intervalos aleatórios configuráveis

### Dashboard Profissional
- Status em tempo real de todas as conexões
- Progresso da campanha com estatísticas
- Controles de pause/resume
- Logs detalhados de envio

### Captura de Respostas
- Monitora mensagens recebidas automaticamente
- Filtra apenas contatos da campanha
- Interface para visualizar todas as respostas

## 🔧 Configurações Avançadas

### Timing da Campanha
```javascript
// Configurações recomendadas
Intervalo mínimo: 30 segundos
Intervalo máximo: 60 segundos
```

### Formato das Variáveis
```
{variavel1} = Nome do contato
{variavel2} = Empresa/informação adicional
```

### Suporte a Imagens
- Upload de imagens para cada variação
- Formatos: JPG, PNG
- Tamanho máximo: 10MB

## 📊 Exemplo Completo

### Arquivo CSV
```csv
phone,variavel1,variavel2
5564999617179,cnpj1,Razao Primeira
5564999617179,cnpj2,Razao Segunda
5564999617179,cnpj3,Razao Terceira
5511999887766,João Silva,Empresa ABC
```
*Ideal para campanhas B2B: mesmo número pode ter múltiplas empresas*
*Números são usados exatamente como fornecidos (sem formatação automática)*

### Mensagens
**Variação 1:**
```
Olá! 🎉

Temos uma proposta comercial para {variavel2} (CNPJ: {variavel1})!

Quer saber os detalhes?
```

**Resultado:** "Olá! Temos uma proposta comercial para Razao Primeira (CNPJ: cnpj1)!"

## 🎯 Vantagens

### ✅ Facilidade
- **Zero configuração** de banco de dados
- **Instalação em 3 comandos**
- **Interface intuitiva**

### ✅ Performance
- **Muito rápido** (tudo em memória)
- **Múltiplas conexões** simultâneas
- **Envio otimizado**

### ✅ Profissional
- **Sistema completo** de campanhas
- **Dashboard com métricas**
- **Logs detalhados**

## 🔍 Resolução de Problemas

### WhatsApp não conecta
- Verifique se o QR code está sendo exibido
- Tente recriar a conexão
- Certifique-se que o WhatsApp Web funciona no seu navegador

### Erro nas dependências
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Sistema lento
- Reduza o número de conexões simultâneas
- Aumente os intervalos entre mensagens

## 📚 Documentação Completa

- **[Guia de Instalação Detalhado](INSTALACAO_LOCAL_SEM_BD.md)** - Passo a passo completo
- **[Guia com Banco de Dados](INSTALACAO_LOCAL.md)** - Versão com PostgreSQL

## 🛡️ Limitações

- **Dados temporários:** Perdidos ao fechar o sistema
- **Sessão única:** Um usuário por vez
- **Reconfiguração:** Necessária após reinicialização

*Para a maioria dos casos, essas limitações não são problema.*

## 🔄 Scripts Disponíveis

```bash
npm run dev     # Executar em modo desenvolvimento
npm run build   # Compilar para produção
npm start       # Executar versão compilada
npm run check   # Verificar tipos TypeScript
```

## 📞 Suporte

Sistema completo e funcional para campanhas WhatsApp profissionais. Todas as funcionalidades implementadas e testadas.

**Para começar agora:**
```bash
npm install && npm run dev
```

**Acesse:** http://localhost:5000

---

*Sistema desenvolvido com WhatsApp Web.js oficial, React, Express.js e TypeScript.*
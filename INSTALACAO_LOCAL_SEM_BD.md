# Instalação Local Simplificada - WhatsApp Campaign Bot
## ✅ SEM BANCO DE DADOS - APENAS NODE.JS

Esta versão funciona completamente em memória, **não precisa de PostgreSQL** ou qualquer configuração de banco de dados!

## Requisitos Mínimos

### Apenas Node.js
- **Versão:** Node.js 18 ou superior
- **Download:** https://nodejs.org/
- **Verificar:** `node --version` e `npm --version`

## Instalação Super Simples

### 1. Baixar o Projeto
```bash
# Faça download de todos os arquivos do Replit
# Ou clone se estiver em repositório
git clone [seu-repositorio]
cd whatsapp-campaign-bot
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Executar o Sistema
```bash
# Iniciar diretamente
npm run dev
```

**Pronto! Sistema rodando em:** http://localhost:5000

## Como Funciona

### 🔥 Armazenamento em Memória
- Todos os dados ficam na memória (RAM)
- **Vantagem:** Zero configuração, funciona imediatamente
- **Nota:** Dados são perdidos quando você para o sistema

### ✅ Funcionalidades Completas
- **5 Conexões WhatsApp** - QR codes reais
- **3 Variações de Mensagem** - Com imagens e variáveis
- **Upload de Contatos** - CSV com phone,variavel1,variavel2
- **Sistema de Rotação** - Alterna contas e mensagens
- **Mensagens Recebidas** - Captura respostas
- **Dashboard Completo** - Interface web

## Usar o WhatsApp Real

### 1. Conectar WhatsApp
1. Acesse http://localhost:5000
2. Clique em "Adicionar Conexão"
3. Clique em "Ver QR Code"
4. Escaneie com seu WhatsApp:
   - **WhatsApp** → **Menu** → **Aparelhos Conectados**
   - **Conectar um Aparelho** → Escanear QR Code

### 2. Configurar Campanha

#### Criar Arquivo de Contatos (CSV):
```csv
phone,variavel1,variavel2
5564999617179,cnpj1,Razao Primeira
5564999617179,cnpj2,Razao Segunda
5564999617179,cnpj3,Razao Terceira
5564999617179,cnpj4,Razao Quarta
5511999887766,João Silva,Empresa ABC
5511888776655,Maria Santos,Loja XYZ
```

**Notas Importantes:**
- O mesmo número pode aparecer várias vezes com diferentes empresas (ideal para campanhas B2B)
- Os números são usados exatamente como fornecidos no CSV (sem formatação automática)
- Formato recomendado: 5564999617179 (código do país + DDD + número)

#### Upload de Contatos:
1. Vá em "Gerenciar Contatos"
2. Clique em "Upload CSV"
3. Selecione seu arquivo
4. Contatos aparecerão na lista

#### Criar Mensagens:
1. Vá em "Variações de Mensagem"
2. Edite as 3 variações disponíveis
3. Use variáveis: `{variavel1}` e `{variavel2}`
4. Adicione imagens se quiser

**Exemplo de Mensagem:**
```
Olá! 👋

Temos uma proposta especial para a empresa {variavel2} (CNPJ: {variavel1}).

Gostaria de saber mais detalhes?
```

### 3. Executar Campanha
1. **Configurações de Timing:**
   - Intervalo mínimo: 30 segundos
   - Intervalo máximo: 60 segundos
   
2. **Iniciar:**
   - Clique em "Iniciar Campanha"
   - Sistema enviará automaticamente
   - Alterna entre WhatsApps e mensagens

### 4. Monitorar Resultados
- **Dashboard:** Estatísticas em tempo real
- **Logs:** Histórico de envios
- **Mensagens Recebidas:** Respostas dos contatos

## Estrutura dos Arquivos

```
whatsapp-campaign-bot/
├── package.json              # Dependências
├── server/
│   ├── index.ts               # Servidor principal
│   ├── routes.ts              # API endpoints
│   ├── storage.ts             # Armazenamento em memória
│   └── services/
│       ├── whatsappReal.ts    # WhatsApp real
│       ├── campaign.ts        # Lógica de campanha
│       └── fileProcessor.ts   # Processar CSV
├── client/src/                # Interface React
└── uploads/                   # Arquivos enviados
```

## Funcionalidades Técnicas

### 🔄 Sistema de Rotação
- **WhatsApp:** Alterna entre contas conectadas
- **Mensagens:** Roda entre as 3 variações
- **Timing:** Intervalos aleatórios configuráveis

### 📊 Dashboard Completo
- Status de todas as conexões
- Progresso da campanha em tempo real
- Estatísticas de envio/erro
- Controles pause/play

### 📱 WhatsApp Web Real
- Usa WhatsApp Web.js oficial
- QR codes autênticos
- Sessão persistente
- Reconexão automática

### 📨 Captura de Respostas
- Monitora mensagens recebidas
- Apenas de contatos da campanha
- Interface para visualizar respostas

## Exemplo de Uso Completo

### 1. Preparar Contatos
```csv
phone,variavel1,variavel2
5564999617179,cnpj1,Razao Primeira
5564999617179,cnpj2,Razao Segunda
5564999617179,cnpj3,Razao Terceira
5511999887766,João Silva,Empresa ABC
```

### 2. Mensagens de Exemplo
**Variação 1:**
```
Olá! 

Temos novidades incríveis para {variavel2} (CNPJ: {variavel1})! 🎉

Quer saber mais?
```

**Variação 2:**
```
Boa tarde!

A empresa {variavel2} pode se beneficiar da nossa promoção especial.

Interessado em conhecer?
```

**Variação 3:**
```
Oi! 👋

Preparamos uma proposta comercial especial para {variavel2}.

Vamos conversar?
```

### 3. Resultado
O sistema enviará automaticamente:
- Para 5564999617179: "Olá! Temos novidades incríveis para Razao Primeira (CNPJ: cnpj1)!"
- Para 5564999617179: "Boa tarde! A empresa Razao Segunda pode se beneficiar..."
- Para 5564999617179: "Oi! Preparamos uma proposta comercial especial para Razao Terceira..."
- E assim por diante, alternando as variações...

## Vantagens desta Versão

### ✅ Simplicidade Total
- **Zero configuração de banco**
- **Apenas npm install + npm run dev**
- **Funciona imediatamente**

### ✅ Performance
- **Muito rápido** (tudo em memória)
- **Sem latência de banco**
- **Ideal para testes e uso diário**

### ✅ Portabilidade
- **Roda em qualquer PC**
- **Windows, Mac, Linux**
- **Não depende de serviços externos**

## Limitações (Apenas Informativa)

- **Dados temporários:** Perdidos ao fechar o sistema
- **Uma sessão:** Não suporta múltiplos usuários simultâneos
- **Reinicialização:** Configurações precisam ser refeitas

**Para a maioria dos casos de uso, essas limitações não são problema!**

## Resolução de Problemas

### WhatsApp não conecta
```bash
# Verificar se o sistema está rodando
# Acessar http://localhost:5000
# Tentar recriar a conexão
```

### Erro ao instalar dependências
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules
npm install
```

### Sistema lento no Windows
```bash
# Desabilitar antivírus temporariamente
# Ou adicionar pasta à lista de exceções
```

## Conclusão

Esta versão **sem banco de dados** é perfeita para:
- ✅ **Testes rápidos**
- ✅ **Uso pessoal/pequenas empresas**
- ✅ **Desenvolvimento e customização**
- ✅ **Demonstrações**

O sistema está **100% funcional** com todas as features de campanha, rotação, mensagens personalizadas e dashboard completo!

**Comando único para começar:**
```bash
npm install && npm run dev
```

**Acesse:** http://localhost:5000 e comece a usar!
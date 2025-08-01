# Sistema CMMS - Controle de Manutenção para Mineração

Sistema completo de gerenciamento de manutenção (CMMS) desenvolvido especificamente para operações de mineração, com interface moderna em HTML/CSS vanilla e backend robusto em Flask.

## 🚀 Características Principais

### ✅ Sistema de Autenticação Completo
- Login seguro com JWT
- 5 níveis de acesso hierárquicos:
  - **ADM**: Acesso total ao sistema
  - **Supervisor**: Gerenciamento de equipamentos e equipe
  - **PCM**: Planejamento e controle de manutenção
  - **Almoxarife**: Controle de estoque e materiais
  - **Mecânico**: Execução de ordens de serviço

### 📊 Dashboard Inteligente
- KPIs em tempo real
- Gráficos interativos com Chart.js
- Evolução mensal de ordens de serviço
- Distribuição por status e tipo
- Ranking de equipamentos

### 🚛 Gestão de Equipamentos
- Cadastro completo com horímetro
- Controle de status (ativo, manutenção, inativo)
- Histórico de manutenções
- Localização e dados técnicos

### 🔧 Ordens de Serviço
- Criação e acompanhamento de OS
- Tipos: Preventiva e Corretiva
- Níveis de prioridade
- Controle de custos (mão de obra + peças)
- Atribuição de mecânicos

### 👷 Gestão de Mecânicos
- Cadastro completo da equipe
- Especialidades e níveis de experiência
- Controle de disponibilidade
- Histórico de serviços

### 📦 Controle de Estoque
- Gestão completa de peças e materiais
- Alertas de baixo estoque
- Controle de fornecedores
- Movimentações de entrada/saída

### 🛞 Sistema de Pneus (Tipo Gestran)
- Controle específico para pneus
- Rastreamento por equipamento e posição
- Controle de vida útil e quilometragem
- Status: estoque, em uso, recapagem, descarte

### 👥 Gerenciamento de Usuários
- Criação e edição de usuários
- Controle de permissões por nível
- Histórico de acessos

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask**: Framework web Python
- **SQLAlchemy**: ORM para banco de dados
- **PostgreSQL**: Banco de dados principal (Railway)
- **SQLite**: Fallback para desenvolvimento local
- **JWT**: Autenticação segura
- **Flask-CORS**: Suporte a requisições cross-origin

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno e responsivo
- **JavaScript Vanilla**: Funcionalidades interativas
- **Chart.js**: Gráficos e visualizações
- **Google Fonts**: Tipografia (Inter)

## 📁 Estrutura do Projeto

```
cmms_sistema/
├── src/
│   ├── static/                 # Frontend
│   │   ├── index.html         # Interface principal
│   │   ├── styles.css         # Estilos CSS
│   │   └── app.js             # JavaScript
│   ├── models/                # Modelos de dados
│   │   ├── usuario.py
│   │   ├── equipamento.py
│   │   ├── ordem_servico.py
│   │   ├── mecanico.py
│   │   ├── peca.py
│   │   └── pneu.py
│   ├── routes/                # Rotas da API
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── equipamentos.py
│   │   ├── ordens_servico.py
│   │   ├── mecanicos.py
│   │   ├── estoque.py
│   │   ├── pneus.py
│   │   └── usuarios.py
│   ├── utils/                 # Utilitários
│   │   └── auth.py           # Decoradores de autenticação
│   └── main.py               # Aplicação principal
├── init_db.py                # Script de inicialização
├── requirements.txt          # Dependências Python
└── README.md                # Esta documentação
```

## 🚀 Instalação e Configuração

### 1. Preparação do Ambiente

```bash
# Clone ou extraia o projeto
cd cmms_sistema

# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt
```

### 2. Configuração do Banco de Dados

#### Para PostgreSQL (Produção - Railway)
```bash
# Configure a variável de ambiente
export DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

#### Para SQLite (Desenvolvimento Local)
```bash
# Não é necessária configuração adicional
# O sistema criará automaticamente o banco SQLite
```

### 3. Inicialização do Sistema

```bash
# Execute o script de inicialização
python init_db.py
```

Este script irá:
- Criar todas as tabelas necessárias
- Popular o banco com dados de exemplo
- Criar usuários padrão para teste

### 4. Execução da Aplicação

```bash
# Inicie o servidor
python src/main.py
```

O sistema estará disponível em: `http://localhost:5000`

## 👤 Usuários Padrão

O sistema vem com usuários pré-configurados para teste:

| Nível | Email | Senha | Descrição |
|-------|-------|-------|-----------|
| ADM | admin@mineracao.com | admin123 | Administrador completo |
| Supervisor | supervisor@mineracao.com | super123 | Supervisor de manutenção |
| PCM | pcm@mineracao.com | pcm123 | Planejador de manutenção |
| Almoxarife | almoxarife@mineracao.com | almox123 | Controle de estoque |
| Mecânico | mecanico@mineracao.com | mec123 | Execução de serviços |

## 🌐 Deploy no Railway

### 1. Configuração do Backend

1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`: URL do PostgreSQL
   - `JWT_SECRET_KEY`: Chave secreta para JWT
   - `PORT`: Porta da aplicação (padrão: 5000)

### 2. Configuração do Frontend

O frontend está integrado ao backend e será servido automaticamente.

### 3. Inicialização

Após o deploy, execute uma vez:
```bash
python init_db.py
```

## 📱 Interface Responsiva

O sistema foi desenvolvido com design responsivo, funcionando perfeitamente em:
- 💻 Desktop (1024px+)
- 📱 Tablet (768px - 1024px)
- 📱 Mobile (até 768px)

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros com expiração
- **Controle de Acesso**: Permissões baseadas em níveis
- **Validação de Dados**: Sanitização de entradas
- **CORS Configurado**: Suporte a requisições cross-origin
- **Senhas Criptografadas**: Hash seguro com Werkzeug

## 📊 Funcionalidades por Nível de Acesso

### ADM (Administrador)
- ✅ Acesso total a todos os módulos
- ✅ Gerenciamento de usuários
- ✅ Configurações do sistema
- ✅ Relatórios completos

### Supervisor
- ✅ Gestão de equipamentos
- ✅ Gestão de mecânicos
- ✅ Aprovação de ordens de serviço
- ✅ Relatórios operacionais

### PCM (Planejamento e Controle de Manutenção)
- ✅ Criação de ordens de serviço
- ✅ Planejamento de manutenções
- ✅ Acompanhamento de execução
- ✅ Relatórios de manutenção

### Almoxarife
- ✅ Controle total do estoque
- ✅ Gestão de pneus
- ✅ Movimentações de materiais
- ✅ Relatórios de estoque

### Mecânico
- ✅ Visualização de ordens atribuídas
- ✅ Atualização de status de execução
- ✅ Consulta de equipamentos
- ✅ Registro de atividades

## 🔧 Manutenção e Suporte

### Logs do Sistema
Os logs são exibidos no console durante a execução. Para produção, configure um sistema de logging adequado.

### Backup do Banco de Dados
- **PostgreSQL**: Use ferramentas como `pg_dump`
- **SQLite**: Copie o arquivo `app.db`

### Atualizações
1. Faça backup do banco de dados
2. Atualize o código
3. Execute migrações se necessário
4. Reinicie a aplicação

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- 📧 Email: suporte@mineracao.com
- 📱 Telefone: (11) 99999-9999
- 🌐 Portal: https://suporte.mineracao.com

## 📄 Licença

Este sistema foi desenvolvido especificamente para operações de mineração.
Todos os direitos reservados.

---

**Sistema CMMS - Mineração v1.0**  
*Desenvolvido com ❤️ para otimizar suas operações de manutenção*


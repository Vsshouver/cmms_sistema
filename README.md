# CMMS - Sistema de Manutenção para Mineração

Sistema completo de gerenciamento de manutenção (CMMS) desenvolvido especificamente para operações de mineração, com funcionalidades avançadas para controle de equipamentos, ordens de serviço, estoque de peças e gestão de pneus.

## 🚀 Funcionalidades Principais

### ✅ Funcionalidades Implementadas

- **Dashboard Interativo**: Estatísticas em tempo real, alertas e atividades recentes
- **Gestão de Equipamentos**: Cadastro completo com tipos, modelos e histórico
- **Ordens de Serviço**: Criação, acompanhamento e conclusão com alocação de peças
- **Controle de Estoque**: Gestão completa de peças com movimentações e inventário
- **Gestão de Pneus**: Controle específico com tratativas e medição de sulcos
- **Sistema de Usuários**: Controle de acesso por níveis (ADM, Supervisor, PCM, etc.), com lógica centralizada em `src/models/usuario.py` e `src/routes/usuarios.py`
- **Importação de Dados**: Upload de peças via CSV/Excel
- **Relatórios em PDF**: Impressão de ordens de serviço
- **Análise de Óleo**: Controle de análises laboratoriais
- **Sistema de Alertas**: Notificações para mecânicos e supervisores

### 🔧 Tecnologias Utilizadas

**Backend:**
- Python 3.11
- Flask (Framework web)
- SQLAlchemy (ORM)
- PostgreSQL (Produção) / SQLite (Desenvolvimento)
- JWT (Autenticação)
- Pandas (Importação de dados)
- ReportLab (Geração de PDFs)

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Design responsivo
- Componentes reutilizáveis
- Sistema de navegação SPA

## 📋 Pré-requisitos

- Python 3.11+
- PostgreSQL (para produção)
- Git

## 🛠️ Instalação Local

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd cmms_sistema
```

2. **Crie um ambiente virtual:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

3. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. **Inicialize o banco de dados:**
```bash
python create_db.py
```

6. **Execute a aplicação:**
```bash
python src/main.py
```

A aplicação estará disponível em `http://localhost:5000`

## 🚂 Deploy no Railway

### Configuração Automática

1. **Conecte seu repositório ao Railway**
2. **Configure as variáveis de ambiente no Railway:**
   - `DATABASE_URL`: String de conexão PostgreSQL (fornecida automaticamente)
   - **Atenção**: a aplicação não inicia se `DATABASE_URL` não estiver definida. Configure com a URL do seu PostgreSQL.
   - `SECRET_KEY`: Chave secreta para sessões
   - `FLASK_ENV`: `production`

3. **Deploy automático**: O Railway detectará automaticamente a configuração

### Configuração Manual

Se necessário, você pode configurar manualmente:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar novo projeto
railway new

# Adicionar PostgreSQL
railway add postgresql

# Deploy
railway up
```

## 👥 Usuários Padrão

O sistema cria automaticamente os seguintes usuários para teste (utilize o e-mail para login):

| E-mail | Senha | Nível |
|--------|-------|-------|
| admin@mineracao.com | admin123 | Administrador |
| supervisor@mineracao.com | super123 | Supervisor |
| pcm@mineracao.com | pcm123 | PCM |
| almoxarife@mineracao.com | almox123 | Almoxarife |
| mecanico@mineracao.com | mec123 | Mecânico |

## 📊 Estrutura do Banco de Dados

### Tabelas Principais:
- `usuarios` - Controle de acesso
- `equipamentos` - Cadastro de equipamentos
- `tipos_equipamento` - Categorização de equipamentos
- `ordens_servico` - Ordens de manutenção
- `tipos_manutencao` - Tipos de manutenção
- `pecas` - Estoque de peças
- `grupos_item` - Categorização de peças
- `movimentacoes_estoque` - Histórico de movimentações
- `pneus` - Gestão específica de pneus
- `mecanicos` - Cadastro de mecânicos
- `analises_oleo` - Análises laboratoriais
- `os_pecas` - Peças utilizadas em OS

## 🔐 Níveis de Acesso

- **ADM**: Acesso total ao sistema
- **Supervisor**: Gestão de equipes e aprovações
- **PCM**: Planejamento e controle de manutenção
- **Almoxarife**: Gestão de estoque
- **Mecânico**: Execução de ordens de serviço

## 📱 Recursos Mobile

- Interface totalmente responsiva
- Navegação otimizada para tablets
- Formulários adaptados para touch

## 🔄 API REST

O sistema expõe uma API REST completa em `/api/` com endpoints para:

- Autenticação (`/api/auth/`)
- Dashboard (`/api/dashboard/`)
- Equipamentos (`/api/equipamentos/`)
- Ordens de Serviço (`/api/ordens-servico/`)
- Estoque (`/api/estoque/`)
- Pneus (`/api/pneus/`)
- E muito mais...

## 📈 Monitoramento

- Health check endpoint: `/api/health`
- Logs estruturados
- Métricas de performance

## 🛡️ Segurança

- Autenticação JWT
- Controle de acesso por níveis
- Validação de dados
- Proteção CORS configurável

## 🔧 Manutenção

### Backup do Banco
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup.sql

# SQLite (desenvolvimento)
cp cmms.db backup_cmms.db
```

### Logs
```bash
# Ver logs no Railway
railway logs

# Logs locais
tail -f logs/app.log
```

## 📞 Suporte

Para suporte técnico ou dúvidas sobre funcionalidades, consulte a documentação interna ou entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Sistema proprietário desenvolvido para operações de mineração.

---

**Versão:** 4.0  
**Última atualização:** Janeiro 2025  
**Desenvolvido para:** Operações de Mineração


# Guia de Instalação - Sistema CMMS v2.0

## 📋 Pré-requisitos

- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)
- Git (opcional, para clonagem)

## 🚀 Instalação

### 1. Preparação do Ambiente

```bash
# Clone ou extraia o projeto
cd cmms_sistema

# Crie um ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Instalação de Dependências

```bash
# Instale as dependências
pip install -r requirements.txt
```

### 3. Configuração do Banco de Dados

```bash
# Crie o banco de dados
python create_db.py

# Inicialize com dados de exemplo
python init_db.py
```

### 4. Execução da Aplicação

A aplicação exige a variável de ambiente `JWT_SECRET_KEY` para geração de tokens JWT.

```bash
# Configure as variáveis de ambiente
export JWT_SECRET_KEY='sua_chave_secreta'  # Obrigatório
export DATABASE_URL='sqlite:///cmms.db'    # Opcional

# Execute a aplicação
python src/main.py
```

A aplicação estará disponível em: `http://localhost:5000`

## 👤 Credenciais de Acesso

### Usuários Padrão

| Perfil | Email | Senha | Permissões |
|--------|-------|-------|------------|
| Administrador | admin@mineracao.com | admin123 | Todas |
| Supervisor | supervisor@mineracao.com | super123 | Supervisão |
| PCM | pcm@mineracao.com | pcm123 | Planejamento |
| Almoxarife | almoxarife@mineracao.com | almox123 | Estoque |
| Mecânico | mecanico@mineracao.com | mec123 | Execução |

## 🆕 Novos Módulos

### Planos de Preventiva
- **URL**: `/preventivas.html`
- **Funcionalidade**: Programação de manutenções preventivas
- **Acesso**: Menu Manutenção → Preventivas

### Controle de Backlog
- **URL**: `/backlog.html`
- **Funcionalidade**: Gestão de backlog de manutenção
- **Acesso**: Menu Manutenção → Backlog

## 🔧 Configurações Avançadas

### Banco de Dados PostgreSQL (Produção)

```bash
# Configure a variável de ambiente
export DATABASE_URL='postgresql://usuario:senha@host:porta/database'

# Execute as migrações
python create_db.py
python init_db.py
```

### Configurações de Email (Futuro)

```python
# Em src/config.py
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 587
MAIL_USE_TLS = True
MAIL_USERNAME = 'seu-email@gmail.com'
MAIL_PASSWORD = 'sua-senha'
```

## 📁 Estrutura do Projeto

```
cmms_sistema/
├── src/
│   ├── models/          # Modelos de dados
│   │   ├── usuario.py             # Modelo de Usuario
│   │   ├── plano_preventiva.py    # NOVO
│   │   └── backlog_item.py        # NOVO
│   ├── routes/          # APIs REST
│   │   ├── planos_preventiva.py   # NOVO
│   │   └── backlog.py             # NOVO
│   ├── static/          # Frontend
│   │   ├── preventivas.html       # NOVO
│   │   ├── backlog.html           # NOVO
│   │   ├── css/
│   │   │   ├── preventivas.css    # NOVO
│   │   │   └── backlog.css        # NOVO
│   │   └── js/pages/
│   │       ├── preventivas.js     # NOVO
│   │       └── backlog.js         # NOVO
│   └── main.py          # Aplicação principal
├── create_db.py         # Criação do banco
├── init_db.py          # Dados iniciais
├── requirements.txt     # Dependências
├── CHANGELOG.md        # Histórico de mudanças
└── INSTALACAO.md       # Este arquivo
```

## 🐛 Solução de Problemas

### Erro de Importação
```bash
# Certifique-se de estar no diretório correto
cd cmms_sistema

# Ative o ambiente virtual
source venv/bin/activate

# Reinstale as dependências
pip install -r requirements.txt
```

### Erro de Banco de Dados
```bash
# Remova o banco existente e recrie
rm -f cmms.db
python create_db.py
python init_db.py
```

### Porta em Uso
```bash
# Verifique processos na porta 5000
lsof -i :5000

# Mate o processo se necessário
kill -9 <PID>
```

## 📊 Monitoramento

### Logs da Aplicação
- Logs são exibidos no terminal durante execução
- Para produção, configure logging em arquivo

### Backup do Banco
```bash
# SQLite
cp cmms.db backup_$(date +%Y%m%d).db

# PostgreSQL
pg_dump database_name > backup_$(date +%Y%m%d).sql
```

## 🔄 Atualizações

### Aplicar Nova Versão
1. Faça backup do banco de dados
2. Substitua os arquivos da aplicação
3. Execute migrações se necessário
4. Reinicie a aplicação

### Migrações de Banco
```bash
# Se houver mudanças no modelo
python create_db.py  # Cria novas tabelas
# Dados existentes são preservados
```

## 📞 Suporte

### Problemas Comuns
- Verifique se o Python 3.11+ está instalado
- Confirme que todas as dependências foram instaladas
- Certifique-se de que a porta 5000 está livre

### Contato
- Email: suporte@cmms.com
- Documentação: Consulte CHANGELOG.md
- Issues: Reporte problemas no repositório

---

**Versão**: 2.0.0  
**Data**: 04/08/2025  
**Compatibilidade**: Python 3.11+, Flask 2.0+


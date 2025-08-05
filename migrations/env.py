import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool
from alembic import context

# Alembic config
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tornar src importável
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Importar modelos
from src.db import db  # noqa: E402
from src.models.equipamento import Equipamento  # noqa: F401,E402
from src.models.mecanico import Mecanico  # noqa: F401,E402
from src.models.ordem_servico import OrdemServico  # noqa: F401,E402
from src.models.peca import Peca  # noqa: F401,E402
from src.models.pneu import Pneu  # noqa: F401,E402
from src.models.tipo_equipamento import TipoEquipamento  # noqa: F401,E402
from src.models.tipo_manutencao import TipoManutencao  # noqa: F401,E402
from src.models.usuario import Usuario  # noqa: F401,E402
from src.models.item import Item  # ✅ biblioteca de itens

target_metadata = db.metadata

def run_migrations_offline():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise Exception("A variável de ambiente DATABASE_URL não está definida.")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True,
        dialect_opts={"paramstyle": "named"}
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise Exception("A variável de ambiente DATABASE_URL não está definida.")
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

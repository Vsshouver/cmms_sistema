import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Ensure the application modules are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.db import db  # noqa: E402
from src.models.equipamento import Equipamento  # noqa: F401,E402
from src.models.mecanico import Mecanico  # noqa: F401,E402
from src.models.ordem_servico import OrdemServico  # noqa: F401,E402
from src.models.peca import Peca  # noqa: F401,E402
from src.models.pneu import Pneu  # noqa: F401,E402
from src.models.tipo_equipamento import TipoEquipamento  # noqa: F401,E402
from src.models.tipo_manutencao import TipoManutencao  # noqa: F401,E402
from src.models.grupo_item import GrupoItem  # noqa: F401,E402
from src.models.estoque_local import EstoqueLocal  # noqa: F401,E402
from src.models.movimentacao_estoque import MovimentacaoEstoque  # noqa: F401,E402
from src.models.os_peca import OS_Peca  # noqa: F401,E402
from src.models.analise_oleo import AnaliseOleo  # noqa: F401,E402
from src.models.usuario import Usuario  # noqa: F401,E402
from src.models.plano_preventiva import PlanoPreventiva  # noqa: F401,E402
from src.models.backlog_item import BacklogItem  # noqa: F401,E402

# Metadata for autogeneration support
target_metadata = db.metadata


def get_url() -> str:
    """Retrieve database URL from environment."""
    url = os.environ.get("DATABASE_URL")
    if url and url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://")
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

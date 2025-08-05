#!/usr/bin/env python3

import os
import sys

# Adicionar o diretório raiz ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask
from src.db import db

# Importar todos os modelos para que sejam registrados
from src.models.equipamento import Equipamento
from src.models.mecanico import Mecanico
from src.models.ordem_servico import OrdemServico
from src.models.peca import Peca
from src.models.pneu import Pneu
from src.models.tipo_equipamento import TipoEquipamento
from src.models.tipo_manutencao import TipoManutencao
from src.models.grupo_item import GrupoItem
from src.models.estoque_local import EstoqueLocal
from src.models.movimentacao_estoque import MovimentacaoEstoque
from src.models.os_peca import OS_Peca
from src.models.analise_oleo import AnaliseOleo
from src.models.usuario import Usuario
from src.models.plano_preventiva import PlanoPreventiva
from src.models.backlog_item import BacklogItem
from alembic import command
from alembic.config import Config
from alembic.util import CommandError
from sqlalchemy import text

def create_database():
    """Criar banco de dados com todas as tabelas."""
    
    # Criar aplicação Flask
    app = Flask(__name__)

    # Chave secreta configurável via variável de ambiente
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Configurar SQLite
    db_path = os.path.join(current_dir, 'cmms.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Inicializar banco
    db.init_app(app)

    # Expor a URL do banco para o Alembic
    os.environ['DATABASE_URL'] = app.config['SQLALCHEMY_DATABASE_URI']
    alembic_cfg = Config(os.path.join(current_dir, 'alembic.ini'))

    with app.app_context():
        print("🔧 Aplicando migrações...")
        try:
            command.upgrade(alembic_cfg, 'head')
        except CommandError as e:
            if "Can't locate revision identified by" in str(e):
                print(f"⚠️  Revisão inválida detectada ({e}). Resetando para base...")
                # Remover tabela de controle de versões antes de reconfigurar
                with db.engine.begin() as conn:
                    conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
                command.stamp(alembic_cfg, 'base')
                command.upgrade(alembic_cfg, 'head')
            else:
                raise
        print(f"✅ Banco de dados criado/atualizado: {db_path}")

        # Verificar tabelas existentes
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📊 Tabelas existentes: {len(tables)}")
        for table in sorted(tables):
            print(f"  - {table}")

if __name__ == '__main__':
    create_database()


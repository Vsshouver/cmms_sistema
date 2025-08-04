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
    
    with app.app_context():
        print("🔧 Criando tabelas...")
        db.create_all()
        print(f"✅ Banco de dados criado: {db_path}")
        
        # Verificar tabelas criadas
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"📊 Tabelas criadas: {len(tables)}")
        for table in sorted(tables):
            print(f"  - {table}")

if __name__ == '__main__':
    create_database()


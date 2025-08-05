#!/usr/bin/env python3
"""Importar itens de Example/itens.csv para a tabela pecas."""
import os
import sys
import pandas as pd
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.db import db
from src.models.peca import Peca
from src.models.grupo_item import GrupoItem
from src.models.estoque_local import EstoqueLocal

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_URL = os.environ.get('DATABASE_URL', f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'cmms_local.db')}")

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)


def import_csv(path='Example/itens.csv'):
    df = pd.read_csv(path, sep=',', engine='python', on_bad_lines='skip')
    with app.app_context():
        for _, row in df.iterrows():
            numero_item = str(row['numero_item']).strip()
            descricao_item = str(row['descricao_item']).strip()
            grupo_nome = str(row['grupo_itens']).strip()
            unidade = str(row.get('unidade_de_medida_de_estoque') or row.get('unidade_medida_estoque')).strip()

            grupo_item = GrupoItem.query.filter_by(nome=grupo_nome).first()
            if not grupo_item:
                grupo_item = GrupoItem(
                    nome=grupo_nome,
                    codigo=grupo_nome[:10].upper().replace(' ', '_'),
                    descricao='Grupo importado automaticamente'
                )
                db.session.add(grupo_item)
                db.session.flush()

            peca = Peca.query.filter_by(codigo=numero_item).first()
            if not peca:
                peca = Peca(
                    codigo=numero_item,
                    nome=descricao_item,
                    grupo_item_id=grupo_item.id,
                    unidade=unidade,
                    quantidade=0
                )
            else:
                peca.nome = descricao_item
                peca.grupo_item_id = grupo_item.id
                peca.unidade = unidade

            if pd.notna(row.get('ultimo_preco_compra')):
                peca.ultimo_preco_compra = float(row['ultimo_preco_compra'])
                peca.preco_unitario = float(row['ultimo_preco_compra'])
            if pd.notna(row.get('ultimo_preco_avaliacao')):
                peca.ultimo_preco_avaliacao = float(row['ultimo_preco_avaliacao'])
            if pd.notna(row.get('estoque_baixo')):
                peca.min_estoque = int(row['estoque_baixo'])
            if pd.notna(row.get('data_registro')):
                peca.data_registro = pd.to_datetime(row['data_registro'])

            db.session.add(peca)
        db.session.commit()


if __name__ == '__main__':
    import_csv()

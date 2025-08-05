
from src.db import db

class Item(db.Model):
    __tablename__ = "itens"

    id = db.Column(db.Integer, primary_key=True)
    numero_item = db.Column(db.String(50), unique=True, nullable=False)
    descricao_item = db.Column(db.Text, nullable=False)
    grupo_itens = db.Column(db.String(100))
    unidade_medida = db.Column(db.String(20))
    ultimo_preco_avaliacao = db.Column(db.Numeric(12, 2))
    ultimo_preco_compra = db.Column(db.Numeric(12, 2))
    estoque_baixo = db.Column(db.Boolean)
    data_registro = db.Column(db.TIMESTAMP, default=db.func.now())

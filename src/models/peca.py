from src.models.usuario import db
from datetime import datetime

class Peca(db.Model):
    __tablename__ = 'pecas'
    
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(50), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    unidade = db.Column(db.String(20), nullable=False)  # unidades, metros, litros, etc.
    quantidade = db.Column(db.Integer, default=0)
    min_estoque = db.Column(db.Integer, default=0)
    max_estoque = db.Column(db.Integer, default=100)
    preco_unitario = db.Column(db.Float, nullable=True)
    localizacao = db.Column(db.String(100), nullable=True)
    fornecedor = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'nome': self.nome,
            'categoria': self.categoria,
            'descricao': self.descricao,
            'unidade': self.unidade,
            'quantidade': self.quantidade,
            'min_estoque': self.min_estoque,
            'max_estoque': self.max_estoque,
            'preco_unitario': self.preco_unitario,
            'localizacao': self.localizacao,
            'fornecedor': self.fornecedor,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status_estoque': 'baixo' if self.quantidade <= self.min_estoque else 'normal'
        }


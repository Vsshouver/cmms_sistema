from src.db import db
from datetime import datetime

class EstoqueLocal(db.Model):
    __tablename__ = 'estoques_local'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(20), unique=True, nullable=False)
    localizacao = db.Column(db.String(200), nullable=False)
    prateleira = db.Column(db.String(50), nullable=True)
    coluna = db.Column(db.String(50), nullable=True)
    setor = db.Column(db.String(100), nullable=True)
    responsavel = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    pecas = db.relationship('Peca', backref='estoque_local_obj', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo': self.codigo,
            'localizacao': self.localizacao,
            'prateleira': self.prateleira,
            'coluna': self.coluna,
            'setor': self.setor,
            'responsavel': self.responsavel,
            'observacoes': self.observacoes,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


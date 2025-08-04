from src.db import db
from datetime import datetime

class TipoManutencao(db.Model):
    __tablename__ = 'tipos_manutencao'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(20), unique=True, nullable=False)  # PREV, CORR_MEC, CORR_ELE, CALD, INSP
    descricao = db.Column(db.Text, nullable=True)
    cor_identificacao = db.Column(db.String(7), nullable=True)  # Hex color para identificação visual
    ativo = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    ordens_servico = db.relationship('OrdemServico', backref='tipo_manutencao_obj', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo': self.codigo,
            'descricao': self.descricao,
            'cor_identificacao': self.cor_identificacao,
            'ativo': self.ativo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


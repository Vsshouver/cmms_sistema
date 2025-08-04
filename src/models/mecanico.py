from src.db import db
from datetime import datetime, date

class Mecanico(db.Model):
    __tablename__ = 'mecanicos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_completo = db.Column(db.String(100), nullable=False)
    cpf = db.Column(db.String(14), unique=True, nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    especialidade = db.Column(db.String(100), nullable=False)
    nivel_experiencia = db.Column(db.String(20), nullable=False)  # junior, pleno, senior
    salario = db.Column(db.Float, nullable=True)
    data_admissao = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ativo')  # ativo, inativo, ferias
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    ordens_servico = db.relationship('OrdemServico', backref='mecanico', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome_completo': self.nome_completo,
            'cpf': self.cpf,
            'telefone': self.telefone,
            'email': self.email,
            'especialidade': self.especialidade,
            'nivel_experiencia': self.nivel_experiencia,
            'salario': self.salario,
            'data_admissao': self.data_admissao.isoformat() if self.data_admissao else None,
            'status': self.status,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


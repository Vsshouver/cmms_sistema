from src.db import db
from datetime import datetime, date

class Equipamento(db.Model):
    __tablename__ = 'equipamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    codigo_interno = db.Column(db.String(50), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo_equipamento_id = db.Column(db.Integer, db.ForeignKey('tipos_equipamento.id'), nullable=True)
    tipo = db.Column(db.String(50), nullable=True)  # Manter para compatibilidade, será removido após migração
    modelo = db.Column(db.String(50), nullable=False)
    fabricante = db.Column(db.String(50), nullable=False)
    numero_serie = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='ativo')  # ativo, manutencao, inativo
    localizacao = db.Column(db.String(100), nullable=False)
    horimetro_atual = db.Column(db.Float, default=0.0)
    data_aquisicao = db.Column(db.Date, nullable=False)
    valor_aquisicao = db.Column(db.Float, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    ordens_servico = db.relationship('OrdemServico', backref='equipamento', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'codigo_interno': self.codigo_interno,
            'nome': self.nome,
            'tipo_equipamento_id': self.tipo_equipamento_id,
            'tipo': self.tipo,
            'tipo_equipamento': self.tipo_equipamento_obj.nome if self.tipo_equipamento_obj else None,
            'modelo': self.modelo,
            'fabricante': self.fabricante,
            'numero_serie': self.numero_serie,
            'status': self.status,
            'localizacao': self.localizacao,
            'horimetro_atual': self.horimetro_atual,
            'data_aquisicao': self.data_aquisicao.isoformat() if self.data_aquisicao else None,
            'valor_aquisicao': self.valor_aquisicao,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


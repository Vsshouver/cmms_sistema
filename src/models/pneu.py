from src.models.usuario import db
from datetime import datetime, date

class Pneu(db.Model):
    __tablename__ = 'pneus'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_serie = db.Column(db.String(50), unique=True, nullable=False)
    marca = db.Column(db.String(50), nullable=False)
    modelo = db.Column(db.String(50), nullable=False)
    medida = db.Column(db.String(30), nullable=False)  # Ex: 385/65R22.5
    tipo = db.Column(db.String(20), nullable=False)  # novo, recapado
    status = db.Column(db.String(20), nullable=False, default='estoque')  # estoque, em_uso, descarte, recapagem
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=True)
    posicao = db.Column(db.String(20), nullable=True)  # dianteiro_esquerdo, traseiro_direito, etc.
    data_compra = db.Column(db.Date, nullable=False)
    valor_compra = db.Column(db.Float, nullable=True)
    data_instalacao = db.Column(db.Date, nullable=True)
    km_instalacao = db.Column(db.Float, nullable=True)
    km_atual = db.Column(db.Float, nullable=True)
    pressao_recomendada = db.Column(db.Float, nullable=True)  # PSI
    vida_util_estimada = db.Column(db.Float, nullable=True)  # KM
    fornecedor = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        km_rodados = 0
        if self.km_atual and self.km_instalacao:
            km_rodados = self.km_atual - self.km_instalacao
            
        percentual_uso = 0
        if self.vida_util_estimada and km_rodados > 0:
            percentual_uso = (km_rodados / self.vida_util_estimada) * 100
            
        return {
            'id': self.id,
            'numero_serie': self.numero_serie,
            'marca': self.marca,
            'modelo': self.modelo,
            'medida': self.medida,
            'tipo': self.tipo,
            'status': self.status,
            'equipamento_id': self.equipamento_id,
            'posicao': self.posicao,
            'data_compra': self.data_compra.isoformat() if self.data_compra else None,
            'valor_compra': self.valor_compra,
            'data_instalacao': self.data_instalacao.isoformat() if self.data_instalacao else None,
            'km_instalacao': self.km_instalacao,
            'km_atual': self.km_atual,
            'km_rodados': km_rodados,
            'percentual_uso': round(percentual_uso, 2),
            'pressao_recomendada': self.pressao_recomendada,
            'vida_util_estimada': self.vida_util_estimada,
            'fornecedor': self.fornecedor,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


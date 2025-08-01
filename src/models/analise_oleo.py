from src.models.usuario import db
from datetime import datetime
import json

class AnaliseOleo(db.Model):
    __tablename__ = 'analises_oleo'
    
    id = db.Column(db.Integer, primary_key=True)
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=False)
    numero_amostra = db.Column(db.String(50), unique=True, nullable=False)
    data_coleta = db.Column(db.DateTime, nullable=False)
    horimetro_coleta = db.Column(db.Float, nullable=True)
    tipo_oleo = db.Column(db.String(100), nullable=False)
    laboratorio = db.Column(db.String(100), nullable=True)
    data_resultado_lab = db.Column(db.DateTime, nullable=True)
    
    # Parâmetros analisados (JSON)
    parametros_analisados = db.Column(db.Text, nullable=True)  # JSON string
    
    # Diagnóstico e tratativa
    diagnostico = db.Column(db.Text, nullable=True)
    tratativa_recomendada = db.Column(db.Text, nullable=True)
    tratativa_executada = db.Column(db.Text, nullable=True)
    
    status = db.Column(db.String(20), nullable=False, default='coletado')  # coletado, em_analise, concluido
    prioridade = db.Column(db.String(20), nullable=False, default='normal')  # baixa, normal, alta, critica
    
    # Responsáveis
    responsavel_coleta = db.Column(db.String(100), nullable=True)
    responsavel_analise = db.Column(db.String(100), nullable=True)
    
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    equipamento = db.relationship('Equipamento', backref='analises_oleo', lazy=True)
    
    def set_parametros(self, parametros_dict):
        """Converte dict para JSON string"""
        self.parametros_analisados = json.dumps(parametros_dict) if parametros_dict else None
    
    def get_parametros(self):
        """Converte JSON string para dict"""
        if self.parametros_analisados:
            try:
                return json.loads(self.parametros_analisados)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipamento_id': self.equipamento_id,
            'numero_amostra': self.numero_amostra,
            'data_coleta': self.data_coleta.isoformat() if self.data_coleta else None,
            'horimetro_coleta': self.horimetro_coleta,
            'tipo_oleo': self.tipo_oleo,
            'laboratorio': self.laboratorio,
            'data_resultado_lab': self.data_resultado_lab.isoformat() if self.data_resultado_lab else None,
            'parametros_analisados': self.get_parametros(),
            'diagnostico': self.diagnostico,
            'tratativa_recomendada': self.tratativa_recomendada,
            'tratativa_executada': self.tratativa_executada,
            'status': self.status,
            'prioridade': self.prioridade,
            'responsavel_coleta': self.responsavel_coleta,
            'responsavel_analise': self.responsavel_analise,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'equipamento': {
                'id': self.equipamento.id,
                'nome': self.equipamento.nome,
                'codigo_interno': self.equipamento.codigo_interno
            } if self.equipamento else None
        }


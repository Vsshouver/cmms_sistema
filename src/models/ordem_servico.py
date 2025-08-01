from src.models.usuario import db
from datetime import datetime

class OrdemServico(db.Model):
    __tablename__ = 'ordens_servico'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_os = db.Column(db.String(50), unique=True, nullable=False)
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=False)
    mecanico_id = db.Column(db.Integer, db.ForeignKey('mecanicos.id'), nullable=True)
    tipo = db.Column(db.String(20), nullable=False)  # preventiva, corretiva
    prioridade = db.Column(db.String(20), nullable=False)  # baixa, media, alta, critica
    status = db.Column(db.String(30), nullable=False, default='aberta')  # aberta, em_execucao, aguardando_pecas, concluida, cancelada
    descricao_problema = db.Column(db.Text, nullable=False)
    descricao_solucao = db.Column(db.Text, nullable=True)
    data_abertura = db.Column(db.DateTime, default=datetime.utcnow)
    data_inicio = db.Column(db.DateTime, nullable=True)
    data_prevista = db.Column(db.DateTime, nullable=True)
    data_encerramento = db.Column(db.DateTime, nullable=True)
    tempo_execucao_horas = db.Column(db.Float, nullable=True)
    custo_mao_obra = db.Column(db.Float, default=0.0)
    custo_pecas = db.Column(db.Float, default=0.0)
    custo_total = db.Column(db.Float, default=0.0)
    observacoes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero_os': self.numero_os,
            'equipamento_id': self.equipamento_id,
            'mecanico_id': self.mecanico_id,
            'tipo': self.tipo,
            'prioridade': self.prioridade,
            'status': self.status,
            'descricao_problema': self.descricao_problema,
            'descricao_solucao': self.descricao_solucao,
            'data_abertura': self.data_abertura.isoformat() if self.data_abertura else None,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_prevista': self.data_prevista.isoformat() if self.data_prevista else None,
            'data_encerramento': self.data_encerramento.isoformat() if self.data_encerramento else None,
            'tempo_execucao_horas': self.tempo_execucao_horas,
            'custo_mao_obra': self.custo_mao_obra,
            'custo_pecas': self.custo_pecas,
            'custo_total': self.custo_total,
            'observacoes': self.observacoes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


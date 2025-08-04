from src.db import db
from datetime import datetime

class OS_Peca(db.Model):
    __tablename__ = 'os_pecas'
    
    id = db.Column(db.Integer, primary_key=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id'), nullable=False)
    peca_id = db.Column(db.Integer, db.ForeignKey('pecas.id'), nullable=False)
    quantidade_utilizada = db.Column(db.Integer, nullable=False)
    custo_unitario_na_epoca = db.Column(db.Float, nullable=True)
    custo_total = db.Column(db.Float, nullable=True)
    data_utilizacao = db.Column(db.DateTime, default=datetime.utcnow)
    observacoes = db.Column(db.Text, nullable=True)
    
    # Relacionamentos
    ordem_servico = db.relationship('OrdemServico', backref='pecas_utilizadas', lazy=True)
    peca = db.relationship('Peca', backref='utilizacoes_os', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ordem_servico_id': self.ordem_servico_id,
            'peca_id': self.peca_id,
            'quantidade_utilizada': self.quantidade_utilizada,
            'custo_unitario_na_epoca': self.custo_unitario_na_epoca,
            'custo_total': self.custo_total,
            'data_utilizacao': self.data_utilizacao.isoformat() if self.data_utilizacao else None,
            'observacoes': self.observacoes,
            'peca': {
                'id': self.peca.id,
                'codigo': self.peca.codigo,
                'nome': self.peca.nome,
                'unidade': self.peca.unidade
            } if self.peca else None
        }


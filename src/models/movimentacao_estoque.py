from src.db import db
from datetime import datetime

class MovimentacaoEstoque(db.Model):
    __tablename__ = 'movimentacoes_estoque'
    
    id = db.Column(db.Integer, primary_key=True)
    peca_id = db.Column(db.Integer, db.ForeignKey('pecas.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo_movimentacao = db.Column(db.String(20), nullable=False)  # entrada, saida, transferencia
    quantidade = db.Column(db.Integer, nullable=False)
    motivo = db.Column(db.String(200), nullable=False)
    numero_nf = db.Column(db.String(50), nullable=True)  # Para entradas
    
    # Para saídas - apropriação
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=True)
    mecanico_id = db.Column(db.Integer, db.ForeignKey('mecanicos.id'), nullable=True)
    setor = db.Column(db.String(100), nullable=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id'), nullable=True)
    
    # Para transferências
    estoque_origem_id = db.Column(db.Integer, db.ForeignKey('estoques_local.id'), nullable=True)
    estoque_destino_id = db.Column(db.Integer, db.ForeignKey('estoques_local.id'), nullable=True)
    
    observacoes = db.Column(db.Text, nullable=True)
    data_movimentacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    peca = db.relationship('Peca', backref='movimentacoes', lazy=True)
    usuario = db.relationship('Usuario', backref='movimentacoes_estoque', lazy=True)
    equipamento = db.relationship('Equipamento', backref='movimentacoes_estoque', lazy=True)
    mecanico = db.relationship('Mecanico', backref='movimentacoes_estoque', lazy=True)
    ordem_servico = db.relationship('OrdemServico', backref='movimentacoes_estoque', lazy=True)
    estoque_origem = db.relationship('EstoqueLocal', foreign_keys=[estoque_origem_id], backref='movimentacoes_origem', lazy=True)
    estoque_destino = db.relationship('EstoqueLocal', foreign_keys=[estoque_destino_id], backref='movimentacoes_destino', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'peca_id': self.peca_id,
            'usuario_id': self.usuario_id,
            'tipo_movimentacao': self.tipo_movimentacao,
            'quantidade': self.quantidade,
            'motivo': self.motivo,
            'numero_nf': self.numero_nf,
            'equipamento_id': self.equipamento_id,
            'mecanico_id': self.mecanico_id,
            'setor': self.setor,
            'ordem_servico_id': self.ordem_servico_id,
            'estoque_origem_id': self.estoque_origem_id,
            'estoque_destino_id': self.estoque_destino_id,
            'observacoes': self.observacoes,
            'data_movimentacao': self.data_movimentacao.isoformat() if self.data_movimentacao else None,
            'peca': self.peca.to_dict() if self.peca else None,
            'usuario': self.usuario.nome_completo if self.usuario else None,
            'equipamento': self.equipamento.nome if self.equipamento else None,
            'mecanico': self.mecanico.nome_completo if self.mecanico else None
        }


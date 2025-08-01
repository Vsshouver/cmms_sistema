from src.models.usuario import db
from datetime import datetime

class Peca(db.Model):
    __tablename__ = 'pecas'
    
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(50), unique=True, nullable=False)  # numero_item da importação
    nome = db.Column(db.String(100), nullable=False)
    grupo_item_id = db.Column(db.Integer, db.ForeignKey('grupos_item.id'), nullable=False)
    categoria = db.Column(db.String(50), nullable=True)  # Manter para compatibilidade
    descricao = db.Column(db.Text, nullable=True)
    unidade = db.Column(db.String(20), nullable=False)  # unidades, metros, litros, etc.
    quantidade = db.Column(db.Integer, default=0)
    min_estoque = db.Column(db.Integer, default=0)
    max_estoque = db.Column(db.Integer, default=100)
    preco_unitario = db.Column(db.Float, nullable=True)
    ultimo_preco_avaliacao = db.Column(db.Float, nullable=True)
    ultimo_preco_compra = db.Column(db.Float, nullable=True)
    estoque_local_id = db.Column(db.Integer, db.ForeignKey('estoques_local.id'), nullable=True)
    localizacao = db.Column(db.String(100), nullable=True)  # Manter para compatibilidade
    fornecedor = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    ultima_inventariacao_data = db.Column(db.DateTime, nullable=True)
    ultima_inventariacao_usuario = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'nome': self.nome,
            'grupo_item_id': self.grupo_item_id,
            'grupo_item': self.grupo_item_obj.nome if self.grupo_item_obj else None,
            'categoria': self.categoria,
            'descricao': self.descricao,
            'unidade': self.unidade,
            'quantidade': self.quantidade,
            'min_estoque': self.min_estoque,
            'max_estoque': self.max_estoque,
            'preco_unitario': self.preco_unitario,
            'ultimo_preco_avaliacao': self.ultimo_preco_avaliacao,
            'ultimo_preco_compra': self.ultimo_preco_compra,
            'estoque_local_id': self.estoque_local_id,
            'estoque_local': self.estoque_local_obj.nome if self.estoque_local_obj else None,
            'localizacao': self.localizacao,
            'fornecedor': self.fornecedor,
            'observacoes': self.observacoes,
            'ultima_inventariacao_data': self.ultima_inventariacao_data.isoformat() if self.ultima_inventariacao_data else None,
            'ultima_inventariacao_usuario': self.ultima_inventariacao_usuario,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'status_estoque': 'baixo' if self.quantidade <= self.min_estoque else 'normal'
        }


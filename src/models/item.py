from src.db import db


class Item(db.Model):
    __tablename__ = "itens"

    id = db.Column(db.Integer, primary_key=True, index=True)
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    nome = db.Column(db.String(255), nullable=False)
    descricao = db.Column(db.Text)
    unidade_medida = db.Column(db.String(20))
    grupo = db.Column(db.String(100))
    fabricante = db.Column(db.String(100))
    criado_em = db.Column(db.TIMESTAMP, default=db.func.now())
    atualizado_em = db.Column(db.TIMESTAMP, default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "codigo": self.codigo,
            "nome": self.nome,
            "descricao": self.descricao,
            "unidade_medida": self.unidade_medida,
            "grupo": self.grupo,
            "fabricante": self.fabricante,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "atualizado_em": self.atualizado_em.isoformat() if self.atualizado_em else None,
        }

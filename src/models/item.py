
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func
from src.db import Base

class Item(Base):
    __tablename__ = "itens"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text)
    unidade_medida = Column(String(20))
    grupo = Column(String(100))
    fabricante = Column(String(100))
    criado_em = Column(TIMESTAMP, default=func.now())
    atualizado_em = Column(TIMESTAMP, default=func.now(), onupdate=func.now())

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nome_completo = db.Column(db.String(100), nullable=False)
    cargo = db.Column(db.String(50), nullable=False)
    # Níveis: ADM, Supervisor, PCM, Almoxarife, Mecanico
    nivel_acesso = db.Column(db.String(20), nullable=False, default='Mecanico')
    ativo = db.Column(db.Boolean, default=True)
    ultimo_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'nome_completo': self.nome_completo,
            'cargo': self.cargo,
            'nivel_acesso': self.nivel_acesso,
            'ativo': self.ativo,
            'ultimo_login': self.ultimo_login.isoformat() if self.ultimo_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


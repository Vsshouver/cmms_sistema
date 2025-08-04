from src.db import db
from datetime import datetime, timedelta

class PlanoPreventiva(db.Model):
    __tablename__ = 'planos_preventiva'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=False)
    tipo_manutencao_id = db.Column(db.Integer, db.ForeignKey('tipos_manutencao.id'), nullable=False)
    
    # Critérios de disparo
    intervalo_horas = db.Column(db.Integer, nullable=True)  # Intervalo em horas de operação
    intervalo_dias = db.Column(db.Integer, nullable=True)   # Intervalo em dias corridos
    intervalo_km = db.Column(db.Float, nullable=True)       # Intervalo em quilometragem
    
    # Configurações
    antecedencia_dias = db.Column(db.Integer, default=7)    # Dias de antecedência para gerar OS
    prioridade = db.Column(db.String(20), default='media')  # baixa, media, alta, critica
    ativo = db.Column(db.Boolean, default=True)
    
    # Dados da última execução
    ultima_execucao_data = db.Column(db.DateTime, nullable=True)
    ultima_execucao_horimetro = db.Column(db.Float, nullable=True)
    ultima_execucao_km = db.Column(db.Float, nullable=True)
    
    # Próxima execução calculada
    proxima_execucao_data = db.Column(db.DateTime, nullable=True)
    proxima_execucao_horimetro = db.Column(db.Float, nullable=True)
    proxima_execucao_km = db.Column(db.Float, nullable=True)
    
    # Metadados
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    equipamento = db.relationship('Equipamento', backref='planos_preventiva')
    tipo_manutencao = db.relationship('TipoManutencao', backref='planos_preventiva')
    
    def calcular_proxima_execucao(self):
        """Calcula a próxima data/horimetro/km de execução baseado nos critérios"""
        if not self.ativo:
            return
            
        # Calcular próxima data baseada em dias
        if self.intervalo_dias and self.ultima_execucao_data:
            self.proxima_execucao_data = self.ultima_execucao_data + timedelta(days=self.intervalo_dias)
        elif self.intervalo_dias and not self.ultima_execucao_data:
            self.proxima_execucao_data = datetime.utcnow() + timedelta(days=self.intervalo_dias)
            
        # Calcular próximo horímetro
        if self.intervalo_horas and self.ultima_execucao_horimetro is not None:
            self.proxima_execucao_horimetro = self.ultima_execucao_horimetro + self.intervalo_horas
        elif self.intervalo_horas and self.equipamento:
            self.proxima_execucao_horimetro = (self.equipamento.horimetro_atual or 0) + self.intervalo_horas
            
        # Calcular próxima quilometragem
        if self.intervalo_km and self.ultima_execucao_km is not None:
            self.proxima_execucao_km = self.ultima_execucao_km + self.intervalo_km
    
    def deve_gerar_os(self):
        """Verifica se deve gerar uma ordem de serviço baseado nos critérios"""
        if not self.ativo:
            return False
            
        agora = datetime.utcnow()
        data_limite = agora + timedelta(days=self.antecedencia_dias)
        
        # Verificar critério de data
        if self.proxima_execucao_data and self.proxima_execucao_data <= data_limite:
            return True
            
        # Verificar critério de horímetro
        if (self.proxima_execucao_horimetro and self.equipamento and 
            self.equipamento.horimetro_atual and 
            self.equipamento.horimetro_atual >= self.proxima_execucao_horimetro):
            return True
            
        # Verificar critério de quilometragem (se aplicável)
        if (self.proxima_execucao_km and self.equipamento and 
            hasattr(self.equipamento, 'km_atual') and self.equipamento.km_atual and
            self.equipamento.km_atual >= self.proxima_execucao_km):
            return True
            
        return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'descricao': self.descricao,
            'equipamento_id': self.equipamento_id,
            'equipamento_nome': self.equipamento.nome if self.equipamento else None,
            'tipo_manutencao_id': self.tipo_manutencao_id,
            'tipo_manutencao_nome': self.tipo_manutencao.nome if self.tipo_manutencao else None,
            'intervalo_horas': self.intervalo_horas,
            'intervalo_dias': self.intervalo_dias,
            'intervalo_km': self.intervalo_km,
            'antecedencia_dias': self.antecedencia_dias,
            'prioridade': self.prioridade,
            'ativo': self.ativo,
            'ultima_execucao_data': self.ultima_execucao_data.isoformat() if self.ultima_execucao_data else None,
            'ultima_execucao_horimetro': self.ultima_execucao_horimetro,
            'ultima_execucao_km': self.ultima_execucao_km,
            'proxima_execucao_data': self.proxima_execucao_data.isoformat() if self.proxima_execucao_data else None,
            'proxima_execucao_horimetro': self.proxima_execucao_horimetro,
            'proxima_execucao_km': self.proxima_execucao_km,
            'deve_gerar_os': self.deve_gerar_os(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


from src.db import db
from datetime import datetime

class BacklogItem(db.Model):
    __tablename__ = 'backlog_items'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    
    # Classificação
    categoria = db.Column(db.String(50), nullable=False)  # manutencao, melhoria, projeto, emergencia
    tipo = db.Column(db.String(50), nullable=False)       # preventiva_adhoc, corretiva, preditiva, upgrade, melhoria
    
    # Priorização
    prioridade = db.Column(db.String(20), default='media')  # baixa, media, alta, critica
    urgencia = db.Column(db.String(20), default='media')    # baixa, media, alta, critica
    impacto = db.Column(db.String(20), default='medio')     # baixo, medio, alto, critico
    
    # Relacionamentos opcionais
    equipamento_id = db.Column(db.Integer, db.ForeignKey('equipamentos.id'), nullable=True)
    ordem_servico_id = db.Column(db.Integer, db.ForeignKey('ordens_servico.id'), nullable=True)
    plano_preventiva_id = db.Column(db.Integer, db.ForeignKey('planos_preventiva.id'), nullable=True)  # Novo relacionamento
    
    # Estimativas
    esforco_estimado = db.Column(db.Float, nullable=True)  # Horas estimadas
    custo_estimado = db.Column(db.Float, nullable=True)    # Custo estimado
    
    # Datas
    data_identificacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_prevista = db.Column(db.DateTime, nullable=True)
    data_inicio = db.Column(db.DateTime, nullable=True)
    data_conclusao = db.Column(db.DateTime, nullable=True)
    
    # Status e controle
    status = db.Column(db.String(30), default='identificado')  # identificado, analisado, aprovado, em_execucao, concluido, cancelado
    responsavel = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    
    # Pontuação para priorização (calculada automaticamente)
    score_priorizacao = db.Column(db.Float, default=0.0)
    
    # Metadados
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100), nullable=True)
    
    # Relacionamentos
    equipamento = db.relationship('Equipamento', backref='backlog_items')
    ordem_servico = db.relationship('OrdemServico', backref='backlog_items')
    plano_preventiva = db.relationship('PlanoPreventiva', backref='backlog_items')
    
    def calcular_score_priorizacao(self):
        """Calcula o score de priorização baseado em urgência, impacto e outros fatores"""
        scores = {
            'baixa': 1, 'baixo': 1,
            'media': 2, 'medio': 2,
            'alta': 3, 'alto': 3,
            'critica': 4, 'critico': 4
        }
        
        urgencia_score = scores.get(self.urgencia, 2)
        impacto_score = scores.get(self.impacto, 2)
        prioridade_score = scores.get(self.prioridade, 2)
        
        # Fórmula: (Urgência * Impacto) + Prioridade + fatores adicionais
        base_score = (urgencia_score * impacto_score) + prioridade_score
        
        # Fatores adicionais
        if self.categoria == 'emergencia':
            base_score += 5
        elif self.categoria == 'manutencao':
            base_score += 2
        
        # Penalizar itens muito antigos
        if self.data_identificacao:
            dias_pendente = (datetime.utcnow() - self.data_identificacao).days
            if dias_pendente > 30:
                base_score += min(dias_pendente / 10, 5)  # Máximo +5 pontos
        
        self.score_priorizacao = round(base_score, 2)
        return self.score_priorizacao
    
    def get_status_display(self):
        """Retorna o status formatado para exibição"""
        status_map = {
            'identificado': 'Identificado',
            'analisado': 'Analisado',
            'aprovado': 'Aprovado',
            'em_execucao': 'Em Execução',
            'concluido': 'Concluído',
            'cancelado': 'Cancelado'
        }
        return status_map.get(self.status, self.status)
    
    def get_categoria_display(self):
        """Retorna a categoria formatada para exibição"""
        categoria_map = {
            'manutencao': 'Manutenção',
            'melhoria': 'Melhoria',
            'projeto': 'Projeto',
            'emergencia': 'Emergência'
        }
        return categoria_map.get(self.categoria, self.categoria)
    
    def get_prioridade_display(self):
        """Retorna a prioridade formatada para exibição"""
        prioridade_map = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'critica': 'Crítica'
        }
        return prioridade_map.get(self.prioridade, self.prioridade)
    
    def dias_pendente(self):
        """Calcula quantos dias o item está pendente"""
        if self.status in ['concluido', 'cancelado']:
            return 0
        if not self.data_identificacao:
            return 0
        return (datetime.utcnow() - self.data_identificacao).days
    
    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descricao': self.descricao,
            'categoria': self.categoria,
            'categoria_display': self.get_categoria_display(),
            'tipo': self.tipo,
            'prioridade': self.prioridade,
            'prioridade_display': self.get_prioridade_display(),
            'urgencia': self.urgencia,
            'impacto': self.impacto,
            'equipamento_id': self.equipamento_id,
            'equipamento_nome': self.equipamento.nome if self.equipamento else None,
            'ordem_servico_id': self.ordem_servico_id,
            'ordem_servico_numero': self.ordem_servico.numero_os if self.ordem_servico else None,
            'plano_preventiva_id': self.plano_preventiva_id,
            'plano_preventiva_nome': self.plano_preventiva.nome if self.plano_preventiva else None,
            'esforco_estimado': self.esforco_estimado,
            'custo_estimado': self.custo_estimado,
            'data_identificacao': self.data_identificacao.isoformat() if self.data_identificacao else None,
            'data_prevista': self.data_prevista.isoformat() if self.data_prevista else None,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_conclusao': self.data_conclusao.isoformat() if self.data_conclusao else None,
            'status': self.status,
            'status_display': self.get_status_display(),
            'responsavel': self.responsavel,
            'observacoes': self.observacoes,
            'score_priorizacao': self.score_priorizacao,
            'dias_pendente': self.dias_pendente(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by
        }


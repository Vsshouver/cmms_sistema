from flask import Blueprint, jsonify
from src.db import db
from src.models.equipamento import Equipamento
from src.models.ordem_servico import OrdemServico
from src.models.peca import Peca
from src.models.mecanico import Mecanico
from src.models.pneu import Pneu
from src.utils.auth import token_required
from sqlalchemy import func, extract
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard(current_user):
    try:
        # KPIs principais
        total_equipamentos = Equipamento.query.count()
        equipamentos_ativos = Equipamento.query.filter_by(status='ativo').count()
        equipamentos_manutencao = Equipamento.query.filter_by(status='manutencao').count()
        
        total_os = OrdemServico.query.count()
        os_abertas = OrdemServico.query.filter(OrdemServico.status.in_(['aberta', 'em_execucao', 'aguardando_pecas'])).count()
        os_concluidas = OrdemServico.query.filter_by(status='concluida').count()
        
        total_pecas = Peca.query.count()
        pecas_baixo_estoque = Peca.query.filter(Peca.quantidade <= Peca.min_estoque).count()
        
        total_mecanicos = Mecanico.query.filter_by(status='ativo').count()
        
        total_pneus = Pneu.query.count()
        pneus_em_uso = Pneu.query.filter_by(status='em_uso').count()
        
        # Custo mensal (últimos 30 dias)
        data_limite = datetime.utcnow() - timedelta(days=30)
        custo_mensal = db.session.query(func.sum(OrdemServico.custo_total)).filter(
            OrdemServico.data_encerramento >= data_limite
        ).scalar() or 0
        
        # Evolução mensal de OS (últimos 6 meses)
        evolucao_os = []
        for i in range(6):
            mes_atual = datetime.utcnow() - timedelta(days=30*i)
            mes_anterior = mes_atual - timedelta(days=30)
            
            count = OrdemServico.query.filter(
                OrdemServico.data_abertura >= mes_anterior,
                OrdemServico.data_abertura < mes_atual
            ).count()
            
            evolucao_os.append({
                'mes': mes_atual.strftime('%B'),
                'count': count
            })
        
        evolucao_os.reverse()
        
        # OS por status
        os_por_status = [
            {'status': 'Abertas', 'count': OrdemServico.query.filter_by(status='aberta').count()},
            {'status': 'Em Execução', 'count': OrdemServico.query.filter_by(status='em_execucao').count()},
            {'status': 'Aguardando Peças', 'count': OrdemServico.query.filter_by(status='aguardando_pecas').count()},
            {'status': 'Concluídas', 'count': OrdemServico.query.filter_by(status='concluida').count()},
            {'status': 'Canceladas', 'count': OrdemServico.query.filter_by(status='cancelada').count()}
        ]
        
        # Equipamentos com mais OS
        equipamentos_mais_os = db.session.query(
            Equipamento.nome,
            Equipamento.codigo_interno,
            func.count(OrdemServico.id).label('total_os')
        ).join(OrdemServico).group_by(Equipamento.id).order_by(func.count(OrdemServico.id).desc()).limit(5).all()
        
        equipamentos_ranking = [
            {
                'nome': eq.nome,
                'codigo': eq.codigo_interno,
                'total_os': eq.total_os
            } for eq in equipamentos_mais_os
        ]
        
        # OS por tipo
        os_por_tipo = [
            {'tipo': 'Preventiva', 'count': OrdemServico.query.filter_by(tipo='preventiva').count()},
            {'tipo': 'Corretiva', 'count': OrdemServico.query.filter_by(tipo='corretiva').count()}
        ]
        
        return jsonify({
            'kpis': {
                'total_equipamentos': total_equipamentos,
                'equipamentos_ativos': equipamentos_ativos,
                'equipamentos_manutencao': equipamentos_manutencao,
                'total_os': total_os,
                'os_abertas': os_abertas,
                'os_concluidas': os_concluidas,
                'total_pecas': total_pecas,
                'pecas_baixo_estoque': pecas_baixo_estoque,
                'total_mecanicos': total_mecanicos,
                'total_pneus': total_pneus,
                'pneus_em_uso': pneus_em_uso,
                'custo_mensal': custo_mensal
            },
            'graficos': {
                'evolucao_os': evolucao_os,
                'os_por_status': os_por_status,
                'equipamentos_mais_os': equipamentos_ranking,
                'os_por_tipo': os_por_tipo
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


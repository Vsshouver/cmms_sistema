from flask import Blueprint, request, jsonify
from src.db import db
from src.models.backlog_item import BacklogItem
from src.models.equipamento import Equipamento
from src.models.ordem_servico import OrdemServico
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime
from sqlalchemy import func, desc, asc

backlog_bp = Blueprint('backlog', __name__)

@backlog_bp.route('/backlog', methods=['GET'])
@token_required
def get_backlog_items(current_user):
    try:
        # Filtros opcionais
        categoria = request.args.get('categoria')
        status = request.args.get('status')
        prioridade = request.args.get('prioridade')
        responsavel = request.args.get('responsavel')
        equipamento_id = request.args.get('equipamento_id')
        search = request.args.get('search')
        sort_by = request.args.get('sort_by', 'score_priorizacao')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Paginação
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = BacklogItem.query
        
        # Aplicar filtros
        if categoria:
            query = query.filter_by(categoria=categoria)
        if status:
            query = query.filter_by(status=status)
        if prioridade:
            query = query.filter_by(prioridade=prioridade)
        if responsavel:
            query = query.filter(BacklogItem.responsavel.contains(responsavel))
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        if search:
            query = query.filter(
                db.or_(
                    BacklogItem.titulo.contains(search),
                    BacklogItem.descricao.contains(search),
                    BacklogItem.observacoes.contains(search)
                )
            )
        
        # Aplicar ordenação
        if sort_order == 'desc':
            query = query.order_by(desc(getattr(BacklogItem, sort_by)))
        else:
            query = query.order_by(asc(getattr(BacklogItem, sort_by)))
        
        # Executar query com paginação
        result = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'backlog_items': [item.to_dict() for item in result.items],
            'total': result.total,
            'pages': result.pages,
            'current_page': page,
            'per_page': per_page,
            'has_next': result.has_next,
            'has_prev': result.has_prev
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/<int:item_id>', methods=['GET'])
@token_required
def get_backlog_item(current_user, item_id):
    try:
        item = BacklogItem.query.get_or_404(item_id)
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog', methods=['POST'])
@token_required
def create_backlog_item(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('titulo'):
            return jsonify({'error': 'Título é obrigatório'}), 400
        if not data.get('categoria'):
            return jsonify({'error': 'Categoria é obrigatória'}), 400
        if not data.get('tipo'):
            return jsonify({'error': 'Tipo é obrigatório'}), 400
        
        # Verificar se equipamento existe (se fornecido)
        if data.get('equipamento_id'):
            equipamento = Equipamento.query.get(data['equipamento_id'])
            if not equipamento:
                return jsonify({'error': 'Equipamento não encontrado'}), 404
        
        # Verificar se ordem de serviço existe (se fornecida)
        if data.get('ordem_servico_id'):
            ordem_servico = OrdemServico.query.get(data['ordem_servico_id'])
            if not ordem_servico:
                return jsonify({'error': 'Ordem de serviço não encontrada'}), 404
        
        item = BacklogItem(
            titulo=data['titulo'],
            descricao=data.get('descricao'),
            categoria=data['categoria'],
            tipo=data['tipo'],
            prioridade=data.get('prioridade', 'media'),
            urgencia=data.get('urgencia', 'media'),
            impacto=data.get('impacto', 'medio'),
            equipamento_id=data.get('equipamento_id'),
            ordem_servico_id=data.get('ordem_servico_id'),
            esforco_estimado=data.get('esforco_estimado'),
            custo_estimado=data.get('custo_estimado'),
            data_prevista=datetime.fromisoformat(data['data_prevista']) if data.get('data_prevista') else None,
            responsavel=data.get('responsavel'),
            observacoes=data.get('observacoes'),
            created_by=current_user.nome
        )
        
        # Calcular score de priorização
        item.calcular_score_priorizacao()
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify({
            'message': 'Item de backlog criado com sucesso',
            'backlog_item': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/<int:item_id>', methods=['PUT'])
@token_required
def update_backlog_item(current_user, item_id):
    try:
        item = BacklogItem.query.get_or_404(item_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'titulo' in data:
            item.titulo = data['titulo']
        if 'descricao' in data:
            item.descricao = data['descricao']
        if 'categoria' in data:
            item.categoria = data['categoria']
        if 'tipo' in data:
            item.tipo = data['tipo']
        if 'prioridade' in data:
            item.prioridade = data['prioridade']
        if 'urgencia' in data:
            item.urgencia = data['urgencia']
        if 'impacto' in data:
            item.impacto = data['impacto']
        if 'equipamento_id' in data:
            if data['equipamento_id']:
                equipamento = Equipamento.query.get(data['equipamento_id'])
                if not equipamento:
                    return jsonify({'error': 'Equipamento não encontrado'}), 404
            item.equipamento_id = data['equipamento_id']
        if 'ordem_servico_id' in data:
            if data['ordem_servico_id']:
                ordem_servico = OrdemServico.query.get(data['ordem_servico_id'])
                if not ordem_servico:
                    return jsonify({'error': 'Ordem de serviço não encontrada'}), 404
            item.ordem_servico_id = data['ordem_servico_id']
        if 'esforco_estimado' in data:
            item.esforco_estimado = data['esforco_estimado']
        if 'custo_estimado' in data:
            item.custo_estimado = data['custo_estimado']
        if 'data_prevista' in data:
            item.data_prevista = datetime.fromisoformat(data['data_prevista']) if data['data_prevista'] else None
        if 'responsavel' in data:
            item.responsavel = data['responsavel']
        if 'observacoes' in data:
            item.observacoes = data['observacoes']
        if 'status' in data:
            item.status = data['status']
            # Atualizar datas baseado no status
            if data['status'] == 'em_execucao' and not item.data_inicio:
                item.data_inicio = datetime.utcnow()
            elif data['status'] == 'concluido' and not item.data_conclusao:
                item.data_conclusao = datetime.utcnow()
        
        # Recalcular score se critérios mudaram
        if any(key in data for key in ['prioridade', 'urgencia', 'impacto', 'categoria']):
            item.calcular_score_priorizacao()
        
        item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Item de backlog atualizado com sucesso',
            'backlog_item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/<int:item_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_backlog_item(current_user, item_id):
    try:
        item = BacklogItem.query.get_or_404(item_id)
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item de backlog excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/stats', methods=['GET'])
@token_required
def get_backlog_stats(current_user):
    try:
        # Estatísticas gerais
        total = BacklogItem.query.count()
        
        # Por status
        stats_status = db.session.query(
            BacklogItem.status,
            func.count(BacklogItem.id)
        ).group_by(BacklogItem.status).all()
        
        # Por categoria
        stats_categoria = db.session.query(
            BacklogItem.categoria,
            func.count(BacklogItem.id)
        ).group_by(BacklogItem.categoria).all()
        
        # Por prioridade
        stats_prioridade = db.session.query(
            BacklogItem.prioridade,
            func.count(BacklogItem.id)
        ).group_by(BacklogItem.prioridade).all()
        
        # Itens críticos (alta prioridade e urgência)
        criticos = BacklogItem.query.filter(
            db.and_(
                BacklogItem.prioridade.in_(['alta', 'critica']),
                BacklogItem.urgencia.in_(['alta', 'critica']),
                BacklogItem.status.in_(['identificado', 'analisado', 'aprovado'])
            )
        ).count()
        
        # Itens atrasados (data prevista passou)
        atrasados = BacklogItem.query.filter(
            db.and_(
                BacklogItem.data_prevista < datetime.utcnow(),
                BacklogItem.status.in_(['identificado', 'analisado', 'aprovado', 'em_execucao'])
            )
        ).count()
        
        # Esforço total estimado
        esforco_total = db.session.query(
            func.sum(BacklogItem.esforco_estimado)
        ).filter(
            BacklogItem.status.in_(['identificado', 'analisado', 'aprovado'])
        ).scalar() or 0
        
        # Custo total estimado
        custo_total = db.session.query(
            func.sum(BacklogItem.custo_estimado)
        ).filter(
            BacklogItem.status.in_(['identificado', 'analisado', 'aprovado'])
        ).scalar() or 0
        
        return jsonify({
            'total': total,
            'criticos': criticos,
            'atrasados': atrasados,
            'esforco_total_estimado': float(esforco_total),
            'custo_total_estimado': float(custo_total),
            'por_status': {status: count for status, count in stats_status},
            'por_categoria': {categoria: count for categoria, count in stats_categoria},
            'por_prioridade': {prioridade: count for prioridade, count in stats_prioridade}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/priorizar', methods=['POST'])
@token_required
@supervisor_or_admin_required
def recalcular_priorizacao(current_user):
    try:
        # Recalcular score de todos os itens ativos
        items = BacklogItem.query.filter(
            BacklogItem.status.in_(['identificado', 'analisado', 'aprovado'])
        ).all()
        
        for item in items:
            item.calcular_score_priorizacao()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Priorização recalculada para {len(items)} itens',
            'items_atualizados': len(items)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/<int:item_id>/iniciar', methods=['POST'])
@token_required
def iniciar_item(current_user, item_id):
    try:
        item = BacklogItem.query.get_or_404(item_id)
        
        if item.status not in ['aprovado']:
            return jsonify({'error': 'Item deve estar aprovado para ser iniciado'}), 400
        
        item.status = 'em_execucao'
        item.data_inicio = datetime.utcnow()
        item.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Item iniciado com sucesso',
            'backlog_item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@backlog_bp.route('/backlog/<int:item_id>/concluir', methods=['POST'])
@token_required
def concluir_item(current_user, item_id):
    try:
        item = BacklogItem.query.get_or_404(item_id)
        data = request.get_json() or {}
        
        if item.status not in ['em_execucao']:
            return jsonify({'error': 'Item deve estar em execução para ser concluído'}), 400
        
        item.status = 'concluido'
        item.data_conclusao = datetime.utcnow()
        item.updated_at = datetime.utcnow()
        
        if data.get('observacoes_conclusao'):
            if item.observacoes:
                item.observacoes += f"\n\nConclusão: {data['observacoes_conclusao']}"
            else:
                item.observacoes = f"Conclusão: {data['observacoes_conclusao']}"
        
        db.session.commit()
        
        return jsonify({
            'message': 'Item concluído com sucesso',
            'backlog_item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


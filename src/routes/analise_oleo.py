from flask import Blueprint, request, jsonify
from src.db import db
from src.models.analise_oleo import AnaliseOleo
from src.models.equipamento import Equipamento
from src.utils.auth import token_required, pcm_or_above_required
from datetime import datetime

analise_oleo_bp = Blueprint('analise_oleo', __name__)

@analise_oleo_bp.route('/analise-oleo', methods=['GET'])
@token_required
def get_analises_oleo(current_user):
    try:
        # Filtros opcionais
        status = request.args.get('status')
        prioridade = request.args.get('prioridade')
        equipamento_id = request.args.get('equipamento_id')
        search = request.args.get('search')
        
        query = AnaliseOleo.query
        
        if status:
            query = query.filter_by(status=status)
        if prioridade:
            query = query.filter_by(prioridade=prioridade)
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        if search:
            query = query.filter(
                AnaliseOleo.numero_amostra.contains(search) |
                AnaliseOleo.tipo_oleo.contains(search) |
                AnaliseOleo.laboratorio.contains(search)
            )
        
        # Ordenar por data de coleta (mais recentes primeiro)
        analises = query.order_by(AnaliseOleo.data_coleta.desc()).all()
        
        return jsonify({
            'analises_oleo': [analise.to_dict() for analise in analises],
            'total': len(analises)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo/<int:analise_id>', methods=['GET'])
@token_required
def get_analise_oleo(current_user, analise_id):
    try:
        analise = AnaliseOleo.query.get_or_404(analise_id)
        return jsonify(analise.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo', methods=['POST'])
@token_required
@pcm_or_above_required
def create_analise_oleo(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['equipamento_id', 'numero_amostra', 'data_coleta', 'tipo_oleo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se equipamento existe
        equipamento = Equipamento.query.get(data['equipamento_id'])
        if not equipamento:
            return jsonify({'error': 'Equipamento não encontrado'}), 404
        
        # Verificar se número da amostra já existe
        if AnaliseOleo.query.filter_by(numero_amostra=data['numero_amostra']).first():
            return jsonify({'error': 'Número da amostra já existe'}), 400
        
        analise = AnaliseOleo(
            equipamento_id=data['equipamento_id'],
            numero_amostra=data['numero_amostra'],
            data_coleta=datetime.strptime(data['data_coleta'], '%Y-%m-%d %H:%M:%S'),
            horimetro_coleta=data.get('horimetro_coleta'),
            tipo_oleo=data['tipo_oleo'],
            laboratorio=data.get('laboratorio'),
            data_resultado_lab=datetime.strptime(data['data_resultado_lab'], '%Y-%m-%d %H:%M:%S') if data.get('data_resultado_lab') else None,
            status=data.get('status', 'coletado'),
            prioridade=data.get('prioridade', 'normal'),
            responsavel_coleta=data.get('responsavel_coleta'),
            responsavel_analise=data.get('responsavel_analise'),
            observacoes=data.get('observacoes')
        )
        
        # Definir parâmetros analisados se fornecidos
        if data.get('parametros_analisados'):
            analise.set_parametros(data['parametros_analisados'])
        
        db.session.add(analise)
        db.session.commit()
        
        return jsonify({
            'message': 'Análise de óleo criada com sucesso',
            'analise_oleo': analise.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo/<int:analise_id>', methods=['PUT'])
@token_required
@pcm_or_above_required
def update_analise_oleo(current_user, analise_id):
    try:
        analise = AnaliseOleo.query.get_or_404(analise_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'data_resultado_lab' in data:
            analise.data_resultado_lab = datetime.strptime(data['data_resultado_lab'], '%Y-%m-%d %H:%M:%S') if data['data_resultado_lab'] else None
        if 'laboratorio' in data:
            analise.laboratorio = data['laboratorio']
        if 'parametros_analisados' in data:
            analise.set_parametros(data['parametros_analisados'])
        if 'diagnostico' in data:
            analise.diagnostico = data['diagnostico']
        if 'tratativa_recomendada' in data:
            analise.tratativa_recomendada = data['tratativa_recomendada']
        if 'tratativa_executada' in data:
            analise.tratativa_executada = data['tratativa_executada']
        if 'status' in data:
            analise.status = data['status']
        if 'prioridade' in data:
            analise.prioridade = data['prioridade']
        if 'responsavel_analise' in data:
            analise.responsavel_analise = data['responsavel_analise']
        if 'observacoes' in data:
            analise.observacoes = data['observacoes']
        
        analise.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Análise de óleo atualizada com sucesso',
            'analise_oleo': analise.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo/<int:analise_id>/concluir', methods=['PUT'])
@token_required
@pcm_or_above_required
def concluir_analise_oleo(current_user, analise_id):
    try:
        analise = AnaliseOleo.query.get_or_404(analise_id)
        data = request.get_json()
        
        if analise.status == 'concluido':
            return jsonify({'error': 'Análise já foi concluída'}), 400
        
        if not data.get('diagnostico'):
            return jsonify({'error': 'Diagnóstico é obrigatório para concluir a análise'}), 400
        
        analise.status = 'concluido'
        analise.diagnostico = data['diagnostico']
        analise.tratativa_recomendada = data.get('tratativa_recomendada')
        analise.tratativa_executada = data.get('tratativa_executada')
        analise.responsavel_analise = data.get('responsavel_analise', current_user.nome_completo)
        
        if not analise.data_resultado_lab:
            analise.data_resultado_lab = datetime.utcnow()
        
        analise.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Análise de óleo concluída com sucesso',
            'analise_oleo': analise.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo/<int:analise_id>', methods=['DELETE'])
@token_required
@pcm_or_above_required
def delete_analise_oleo(current_user, analise_id):
    try:
        analise = AnaliseOleo.query.get_or_404(analise_id)
        
        if analise.status == 'concluido':
            return jsonify({'error': 'Não é possível excluir análise concluída'}), 400
        
        db.session.delete(analise)
        db.session.commit()
        
        return jsonify({'message': 'Análise de óleo excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@analise_oleo_bp.route('/analise-oleo/relatorio', methods=['GET'])
@token_required
def get_relatorio_analise_oleo(current_user):
    try:
        # Estatísticas gerais
        total_analises = AnaliseOleo.query.count()
        analises_coletadas = AnaliseOleo.query.filter_by(status='coletado').count()
        analises_em_analise = AnaliseOleo.query.filter_by(status='em_analise').count()
        analises_concluidas = AnaliseOleo.query.filter_by(status='concluido').count()
        
        # Análises por prioridade
        analises_criticas = AnaliseOleo.query.filter_by(prioridade='critica').count()
        analises_altas = AnaliseOleo.query.filter_by(prioridade='alta').count()
        
        # Análises por equipamento (top 5)
        analises_por_equipamento = db.session.query(
            Equipamento.nome,
            Equipamento.codigo_interno,
            db.func.count(AnaliseOleo.id).label('total_analises')
        ).join(AnaliseOleo).group_by(Equipamento.id).order_by(db.func.count(AnaliseOleo.id).desc()).limit(5).all()
        
        equipamentos_ranking = [
            {
                'nome': eq.nome,
                'codigo': eq.codigo_interno,
                'total_analises': eq.total_analises
            } for eq in analises_por_equipamento
        ]
        
        return jsonify({
            'resumo': {
                'total_analises': total_analises,
                'analises_coletadas': analises_coletadas,
                'analises_em_analise': analises_em_analise,
                'analises_concluidas': analises_concluidas,
                'analises_criticas': analises_criticas,
                'analises_altas': analises_altas
            },
            'equipamentos_mais_analises': equipamentos_ranking
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


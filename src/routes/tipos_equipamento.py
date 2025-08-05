from flask import Blueprint, request, jsonify
from src.db import db
from src.models.tipo_equipamento import TipoEquipamento
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

tipos_equipamento_bp = Blueprint('tipos_equipamento', __name__)

@tipos_equipamento_bp.route('/tipos-equipamento', methods=['GET'])
@token_required
def get_tipos_equipamento(current_user):
    try:
        # Filtros opcionais
        ativo_param = request.args.get('ativo')
        search = request.args.get('search')

        query = TipoEquipamento.query

        if ativo_param is not None:
            # Aceita representações "true", "1", "false" e "0"
            ativo_bool = str(ativo_param).lower() in ("true", "1", "t")
            query = query.filter_by(ativo=ativo_bool)
        if search:
            query = query.filter(TipoEquipamento.nome.contains(search))
        
        tipos = query.order_by(TipoEquipamento.nome).all()
        
        return jsonify({
            'tipos_equipamento': [tipo.to_dict() for tipo in tipos],
            'total': len(tipos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tipos_equipamento_bp.route('/tipos-equipamento/<int:tipo_id>', methods=['GET'])
@token_required
def get_tipo_equipamento(current_user, tipo_id):
    try:
        tipo = TipoEquipamento.query.get_or_404(tipo_id)
        return jsonify(tipo.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tipos_equipamento_bp.route('/tipos-equipamento', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_tipo_equipamento(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Verificar se nome já existe
        if TipoEquipamento.query.filter_by(nome=data['nome']).first():
            return jsonify({'error': 'Nome já existe'}), 400
        
        tipo = TipoEquipamento(
            nome=data['nome'],
            descricao=data.get('descricao'),
            ativo=str(data.get('ativo', True)).lower() in ('true', '1', 't')
        )
        
        db.session.add(tipo)
        db.session.commit()
        
        return jsonify({
            'message': 'Tipo de equipamento criado com sucesso',
            'tipo_equipamento': tipo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_equipamento_bp.route('/tipos-equipamento/<int:tipo_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_tipo_equipamento(current_user, tipo_id):
    try:
        tipo = TipoEquipamento.query.get_or_404(tipo_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome' in data:
            # Verificar se nome já existe em outro tipo
            if TipoEquipamento.query.filter(
                TipoEquipamento.nome == data['nome'],
                TipoEquipamento.id != tipo_id
            ).first():
                return jsonify({'error': 'Nome já existe para outro tipo'}), 400
            tipo.nome = data['nome']
        
        if 'descricao' in data:
            tipo.descricao = data['descricao']
        if 'ativo' in data:
            tipo.ativo = data['ativo']
        
        tipo.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Tipo de equipamento atualizado com sucesso',
            'tipo_equipamento': tipo.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_equipamento_bp.route('/tipos-equipamento/<int:tipo_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_tipo_equipamento(current_user, tipo_id):
    try:
        tipo = TipoEquipamento.query.get_or_404(tipo_id)
        
        # Verificar se há equipamentos usando este tipo
        if tipo.equipamentos:
            return jsonify({'error': 'Não é possível excluir tipo com equipamentos associados'}), 400
        
        db.session.delete(tipo)
        db.session.commit()
        
        return jsonify({'message': 'Tipo de equipamento excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


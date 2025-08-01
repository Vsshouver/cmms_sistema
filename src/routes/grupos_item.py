from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.grupo_item import GrupoItem
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

grupos_item_bp = Blueprint('grupos_item', __name__)

@grupos_item_bp.route('/grupos-item', methods=['GET'])
@token_required
def get_grupos_item(current_user):
    try:
        # Filtros opcionais
        ativo = request.args.get('ativo')
        search = request.args.get('search')
        
        query = GrupoItem.query
        
        if ativo is not None:
            query = query.filter_by(ativo=ativo.lower() == 'true')
        if search:
            query = query.filter(
                GrupoItem.nome.contains(search) |
                GrupoItem.codigo.contains(search)
            )
        
        grupos = query.order_by(GrupoItem.nome).all()
        
        return jsonify({
            'grupos_item': [grupo.to_dict() for grupo in grupos],
            'total': len(grupos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@grupos_item_bp.route('/grupos-item/<int:grupo_id>', methods=['GET'])
@token_required
def get_grupo_item(current_user, grupo_id):
    try:
        grupo = GrupoItem.query.get_or_404(grupo_id)
        return jsonify(grupo.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@grupos_item_bp.route('/grupos-item', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_grupo_item(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['nome', 'codigo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se nome ou código já existem
        if GrupoItem.query.filter_by(nome=data['nome']).first():
            return jsonify({'error': 'Nome já existe'}), 400
        
        if GrupoItem.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Código já existe'}), 400
        
        grupo = GrupoItem(
            nome=data['nome'],
            codigo=data['codigo'],
            descricao=data.get('descricao'),
            ativo=data.get('ativo', True)
        )
        
        db.session.add(grupo)
        db.session.commit()
        
        return jsonify({
            'message': 'Grupo de item criado com sucesso',
            'grupo_item': grupo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@grupos_item_bp.route('/grupos-item/<int:grupo_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_grupo_item(current_user, grupo_id):
    try:
        grupo = GrupoItem.query.get_or_404(grupo_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome' in data:
            # Verificar se nome já existe em outro grupo
            if GrupoItem.query.filter(
                GrupoItem.nome == data['nome'],
                GrupoItem.id != grupo_id
            ).first():
                return jsonify({'error': 'Nome já existe para outro grupo'}), 400
            grupo.nome = data['nome']
        
        if 'codigo' in data:
            # Verificar se código já existe em outro grupo
            if GrupoItem.query.filter(
                GrupoItem.codigo == data['codigo'],
                GrupoItem.id != grupo_id
            ).first():
                return jsonify({'error': 'Código já existe para outro grupo'}), 400
            grupo.codigo = data['codigo']
        
        if 'descricao' in data:
            grupo.descricao = data['descricao']
        if 'ativo' in data:
            grupo.ativo = data['ativo']
        
        grupo.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Grupo de item atualizado com sucesso',
            'grupo_item': grupo.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@grupos_item_bp.route('/grupos-item/<int:grupo_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_grupo_item(current_user, grupo_id):
    try:
        grupo = GrupoItem.query.get_or_404(grupo_id)
        
        # Verificar se há peças usando este grupo
        if grupo.pecas:
            return jsonify({'error': 'Não é possível excluir grupo com peças associadas'}), 400
        
        db.session.delete(grupo)
        db.session.commit()
        
        return jsonify({'message': 'Grupo de item excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


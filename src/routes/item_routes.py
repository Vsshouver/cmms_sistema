from flask import Blueprint, request, jsonify
from src.db import db
from src.models.item import Item
from src.utils.auth import token_required, supervisor_or_admin_required

item_bp = Blueprint('item', __name__)


@item_bp.route('', methods=['GET'])
@token_required
def get_items(current_user):
    try:
        items = Item.query.order_by(Item.nome).all()
        return jsonify([item.to_dict() for item in items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@item_bp.route('/<int:item_id>', methods=['GET'])
@token_required
def get_item(current_user, item_id):
    try:
        item = Item.query.get_or_404(item_id)
        return jsonify(item.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@item_bp.route('', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_item(current_user):
    try:
        data = request.get_json() or {}
        if not data.get('codigo') or not data.get('nome'):
            return jsonify({'error': 'Campos codigo e nome são obrigatórios'}), 400
        if Item.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Código já existe'}), 400
        item = Item(
            codigo=data['codigo'],
            nome=data['nome'],
            descricao=data.get('descricao'),
            unidade_medida=data.get('unidade_medida'),
            grupo=data.get('grupo'),
            fabricante=data.get('fabricante')
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({'message': 'Item criado com sucesso', 'item': item.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@item_bp.route('/<int:item_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_item(current_user, item_id):
    try:
        item = Item.query.get_or_404(item_id)
        data = request.get_json() or {}
        if 'codigo' in data and data['codigo'] != item.codigo:
            if Item.query.filter_by(codigo=data['codigo']).first():
                return jsonify({'error': 'Código já existe'}), 400
            item.codigo = data['codigo']
        for field in ['nome', 'descricao', 'unidade_medida', 'grupo', 'fabricante']:
            if field in data:
                setattr(item, field, data[field])
        db.session.commit()
        return jsonify({'message': 'Item atualizado com sucesso', 'item': item.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@item_bp.route('/<int:item_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_item(current_user, item_id):
    try:
        item = Item.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item excluído com sucesso'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

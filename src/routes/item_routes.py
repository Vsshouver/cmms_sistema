
from flask import Blueprint, request, jsonify
from src.db import db_session
from src.models.item import Item

item_bp = Blueprint('item_bp', __name__)

@item_bp.route('/', methods=['GET'])
def listar_itens():
    itens = db_session.query(Item).all()
    return jsonify([{
        'id': i.id,
        'codigo': i.codigo,
        'nome': i.nome,
        'descricao': i.descricao,
        'unidade_medida': i.unidade_medida,
        'grupo': i.grupo,
        'fabricante': i.fabricante
    } for i in itens])

@item_bp.route('/', methods=['POST'])
def criar_item():
    data = request.json
    item = Item(
        codigo=data['codigo'],
        nome=data['nome'],
        descricao=data.get('descricao'),
        unidade_medida=data.get('unidade_medida'),
        grupo=data.get('grupo'),
        fabricante=data.get('fabricante')
    )
    db_session.add(item)
    db_session.commit()
    return jsonify({'message': 'Item criado com sucesso.'}), 201

@item_bp.route('/<int:item_id>', methods=['PUT'])
def atualizar_item(item_id):
    item = db_session.query(Item).get(item_id)
    if not item:
        return jsonify({'message': 'Item não encontrado'}), 404

    data = request.json
    item.codigo = data.get('codigo', item.codigo)
    item.nome = data.get('nome', item.nome)
    item.descricao = data.get('descricao', item.descricao)
    item.unidade_medida = data.get('unidade_medida', item.unidade_medida)
    item.grupo = data.get('grupo', item.grupo)
    item.fabricante = data.get('fabricante', item.fabricante)

    db_session.commit()
    return jsonify({'message': 'Item atualizado com sucesso'})

@item_bp.route('/<int:item_id>', methods=['DELETE'])
def deletar_item(item_id):
    item = db_session.query(Item).get(item_id)
    if not item:
        return jsonify({'message': 'Item não encontrado'}), 404

    db_session.delete(item)
    db_session.commit()
    return jsonify({'message': 'Item deletado com sucesso'})

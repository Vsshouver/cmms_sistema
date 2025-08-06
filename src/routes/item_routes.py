from flask import Blueprint, jsonify, request
from src.db import db
from src.models.item import Item


item_bp = Blueprint('item_bp', __name__)


@item_bp.route('/', methods=['GET'])
def listar_itens():
    itens = db.session.query(Item).all()
    return jsonify([
        {
            'id': i.id,
            'numero_item': i.numero_item,
            'descricao_item': i.descricao_item,
            'grupo_itens': i.grupo_itens,
            'unidade_medida': i.unidade_medida,
            'ultimo_preco_avaliacao': float(i.ultimo_preco_avaliacao)
            if i.ultimo_preco_avaliacao is not None
            else None,
            'ultimo_preco_compra': float(i.ultimo_preco_compra)
            if i.ultimo_preco_compra is not None
            else None,
            'estoque_baixo': i.estoque_baixo,
        }
        for i in itens
    ])


@item_bp.route('/', methods=['POST'])
def criar_item():
    data = request.get_json() or {}

    numero_item = data.get('numero_item')
    descricao_item = data.get('descricao_item')
    if not numero_item or not descricao_item:
        return (
            jsonify(
                {'message': 'Campos numero_item e descricao_item são obrigatórios'}
            ),
            400,
        )

    if db.session.query(Item).filter_by(numero_item=numero_item).first():
        return jsonify({'message': 'Número do item já existe'}), 400

    item = Item(
        numero_item=numero_item,
        descricao_item=descricao_item,
        grupo_itens=data.get('grupo_itens'),
        unidade_medida=data.get('unidade_medida'),
        ultimo_preco_avaliacao=data.get('ultimo_preco_avaliacao'),
        ultimo_preco_compra=data.get('ultimo_preco_compra'),
        estoque_baixo=data.get('estoque_baixo', False),
    )

    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Item criado com sucesso.'}), 201


@item_bp.route('/<int:item_id>', methods=['PUT'])
def atualizar_item(item_id):
    item = db.session.query(Item).get(item_id)
    if not item:
        return jsonify({'message': 'Item não encontrado'}), 404

    data = request.get_json() or {}

    if 'numero_item' in data:
        numero_item = data['numero_item']
        if (
            db.session.query(Item)
            .filter(Item.numero_item == numero_item, Item.id != item_id)
            .first()
        ):
            return jsonify({'message': 'Número do item já existe'}), 400
        item.numero_item = numero_item

    if 'descricao_item' in data:
        item.descricao_item = data['descricao_item']
    if 'grupo_itens' in data:
        item.grupo_itens = data['grupo_itens']
    if 'unidade_medida' in data:
        item.unidade_medida = data['unidade_medida']
    if 'ultimo_preco_avaliacao' in data:
        item.ultimo_preco_avaliacao = data['ultimo_preco_avaliacao']
    if 'ultimo_preco_compra' in data:
        item.ultimo_preco_compra = data['ultimo_preco_compra']
    if 'estoque_baixo' in data:
        item.estoque_baixo = data['estoque_baixo']

    db.session.commit()
    return jsonify({'message': 'Item atualizado com sucesso'})


@item_bp.route('/<int:item_id>', methods=['DELETE'])
def deletar_item(item_id):
    item = db.session.query(Item).get(item_id)
    if not item:
        return jsonify({'message': 'Item não encontrado'}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deletado com sucesso'})


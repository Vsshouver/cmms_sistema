from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.peca import Peca
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

estoque_bp = Blueprint('estoque', __name__)

@estoque_bp.route('/estoque/pecas', methods=['GET'])
@token_required
def get_pecas(current_user):
    try:
        # Filtros opcionais
        categoria = request.args.get('categoria')
        baixo_estoque = request.args.get('baixo_estoque')
        search = request.args.get('search')
        
        query = Peca.query
        
        if categoria:
            query = query.filter_by(categoria=categoria)
        if baixo_estoque == 'true':
            query = query.filter(Peca.quantidade <= Peca.min_estoque)
        if search:
            query = query.filter(
                Peca.nome.contains(search) |
                Peca.codigo.contains(search) |
                Peca.fornecedor.contains(search)
            )
        
        pecas = query.all()
        
        return jsonify({
            'pecas': [peca.to_dict() for peca in pecas],
            'total': len(pecas)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/pecas/<int:peca_id>', methods=['GET'])
@token_required
def get_peca(current_user, peca_id):
    try:
        peca = Peca.query.get_or_404(peca_id)
        return jsonify(peca.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/pecas', methods=['POST'])
@token_required
def create_peca(current_user):
    try:
        # Verificar se usuário tem permissão (Almoxarife, Supervisor ou ADM)
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'Almoxarife']:
            return jsonify({'error': 'Acesso negado. Apenas almoxarifes, supervisores ou administradores.'}), 403
        
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['codigo', 'nome', 'categoria', 'unidade']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se código já existe
        if Peca.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Código da peça já existe'}), 400
        
        peca = Peca(
            codigo=data['codigo'],
            nome=data['nome'],
            categoria=data['categoria'],
            descricao=data.get('descricao'),
            unidade=data['unidade'],
            quantidade=data.get('quantidade', 0),
            min_estoque=data.get('min_estoque', 0),
            max_estoque=data.get('max_estoque', 100),
            preco_unitario=data.get('preco_unitario'),
            localizacao=data.get('localizacao'),
            fornecedor=data.get('fornecedor'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(peca)
        db.session.commit()
        
        return jsonify({
            'message': 'Peça criada com sucesso',
            'peca': peca.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/pecas/<int:peca_id>', methods=['PUT'])
@token_required
def update_peca(current_user, peca_id):
    try:
        # Verificar se usuário tem permissão (Almoxarife, Supervisor ou ADM)
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'Almoxarife']:
            return jsonify({'error': 'Acesso negado. Apenas almoxarifes, supervisores ou administradores.'}), 403
        
        peca = Peca.query.get_or_404(peca_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome' in data:
            peca.nome = data['nome']
        if 'categoria' in data:
            peca.categoria = data['categoria']
        if 'descricao' in data:
            peca.descricao = data['descricao']
        if 'unidade' in data:
            peca.unidade = data['unidade']
        if 'quantidade' in data:
            peca.quantidade = data['quantidade']
        if 'min_estoque' in data:
            peca.min_estoque = data['min_estoque']
        if 'max_estoque' in data:
            peca.max_estoque = data['max_estoque']
        if 'preco_unitario' in data:
            peca.preco_unitario = data['preco_unitario']
        if 'localizacao' in data:
            peca.localizacao = data['localizacao']
        if 'fornecedor' in data:
            peca.fornecedor = data['fornecedor']
        if 'observacoes' in data:
            peca.observacoes = data['observacoes']
        
        peca.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Peça atualizada com sucesso',
            'peca': peca.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/pecas/<int:peca_id>/movimentacao', methods=['POST'])
@token_required
def movimentar_estoque(current_user, peca_id):
    try:
        # Verificar se usuário tem permissão (Almoxarife, Supervisor ou ADM)
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'Almoxarife']:
            return jsonify({'error': 'Acesso negado. Apenas almoxarifes, supervisores ou administradores.'}), 403
        
        peca = Peca.query.get_or_404(peca_id)
        data = request.get_json()
        
        tipo_movimentacao = data.get('tipo')  # entrada, saida
        quantidade = data.get('quantidade', 0)
        motivo = data.get('motivo', '')
        
        if not tipo_movimentacao or quantidade <= 0:
            return jsonify({'error': 'Tipo de movimentação e quantidade são obrigatórios'}), 400
        
        if tipo_movimentacao == 'entrada':
            peca.quantidade += quantidade
        elif tipo_movimentacao == 'saida':
            if peca.quantidade < quantidade:
                return jsonify({'error': 'Quantidade insuficiente em estoque'}), 400
            peca.quantidade -= quantidade
        else:
            return jsonify({'error': 'Tipo de movimentação inválido'}), 400
        
        peca.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': f'Movimentação de {tipo_movimentacao} realizada com sucesso',
            'peca': peca.to_dict(),
            'movimentacao': {
                'tipo': tipo_movimentacao,
                'quantidade': quantidade,
                'motivo': motivo,
                'usuario': current_user.nome_completo,
                'data': datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/categorias', methods=['GET'])
@token_required
def get_categorias(current_user):
    try:
        # Buscar todas as categorias únicas
        categorias = db.session.query(Peca.categoria).distinct().all()
        categorias_list = [cat[0] for cat in categorias if cat[0]]
        
        return jsonify({
            'categorias': sorted(categorias_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/relatorio', methods=['GET'])
@token_required
def get_relatorio_estoque(current_user):
    try:
        # Relatório geral do estoque
        total_pecas = Peca.query.count()
        pecas_baixo_estoque = Peca.query.filter(Peca.quantidade <= Peca.min_estoque).count()
        valor_total_estoque = db.session.query(db.func.sum(Peca.quantidade * Peca.preco_unitario)).scalar() or 0
        
        # Peças por categoria
        categorias = db.session.query(
            Peca.categoria,
            db.func.count(Peca.id).label('total_pecas'),
            db.func.sum(Peca.quantidade).label('total_quantidade')
        ).group_by(Peca.categoria).all()
        
        categorias_resumo = [
            {
                'categoria': cat.categoria,
                'total_pecas': cat.total_pecas,
                'total_quantidade': cat.total_quantidade or 0
            } for cat in categorias
        ]
        
        # Peças com baixo estoque
        pecas_baixo = Peca.query.filter(Peca.quantidade <= Peca.min_estoque).all()
        
        return jsonify({
            'resumo': {
                'total_pecas': total_pecas,
                'pecas_baixo_estoque': pecas_baixo_estoque,
                'valor_total_estoque': valor_total_estoque
            },
            'categorias': categorias_resumo,
            'pecas_baixo_estoque': [peca.to_dict() for peca in pecas_baixo]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


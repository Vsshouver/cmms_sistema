from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.peca import Peca
from src.models.movimentacao_estoque import MovimentacaoEstoque
from src.models.estoque_local import EstoqueLocal
from src.utils.auth import token_required, supervisor_or_admin_required, almoxarife_or_above_required
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


@estoque_bp.route('/estoque/movimentacoes', methods=['GET'])
@token_required
def get_movimentacoes_estoque(current_user):
    """Listar movimentações de estoque"""
    try:
        # Filtros opcionais
        peca_id = request.args.get('peca_id')
        tipo_movimentacao = request.args.get('tipo_movimentacao')
        usuario_id = request.args.get('usuario_id')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        query = MovimentacaoEstoque.query
        
        if peca_id:
            query = query.filter_by(peca_id=peca_id)
        if tipo_movimentacao:
            query = query.filter_by(tipo_movimentacao=tipo_movimentacao)
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
        if data_inicio:
            query = query.filter(MovimentacaoEstoque.data_movimentacao >= datetime.strptime(data_inicio, '%Y-%m-%d'))
        if data_fim:
            query = query.filter(MovimentacaoEstoque.data_movimentacao <= datetime.strptime(data_fim, '%Y-%m-%d'))
        
        movimentacoes = query.order_by(MovimentacaoEstoque.data_movimentacao.desc()).all()
        
        return jsonify({
            'movimentacoes': [mov.to_dict() for mov in movimentacoes],
            'total': len(movimentacoes)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/movimentacao', methods=['POST'])
@token_required
@almoxarife_or_above_required
def criar_movimentacao_estoque(current_user):
    """Criar nova movimentação de estoque"""
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['peca_id', 'tipo_movimentacao', 'quantidade', 'motivo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        peca = Peca.query.get(data['peca_id'])
        if not peca:
            return jsonify({'error': 'Peça não encontrada'}), 404
        
        quantidade = int(data['quantidade'])
        tipo_movimentacao = data['tipo_movimentacao']
        
        # Validar quantidade para saídas
        if tipo_movimentacao == 'saida' and peca.quantidade < quantidade:
            return jsonify({'error': f'Estoque insuficiente. Disponível: {peca.quantidade}'}), 400
        
        # Criar movimentação
        movimentacao = MovimentacaoEstoque(
            peca_id=data['peca_id'],
            usuario_id=current_user.id,
            tipo_movimentacao=tipo_movimentacao,
            quantidade=quantidade,
            motivo=data['motivo'],
            numero_nf=data.get('numero_nf'),
            equipamento_id=data.get('equipamento_id'),
            mecanico_id=data.get('mecanico_id'),
            setor=data.get('setor'),
            ordem_servico_id=data.get('ordem_servico_id'),
            estoque_origem_id=data.get('estoque_origem_id'),
            estoque_destino_id=data.get('estoque_destino_id'),
            observacoes=data.get('observacoes')
        )
        
        # Atualizar quantidade da peça
        if tipo_movimentacao == 'entrada':
            peca.quantidade += quantidade
        elif tipo_movimentacao == 'saida':
            peca.quantidade -= quantidade
        elif tipo_movimentacao == 'transferencia':
            # Para transferências, a quantidade não muda no total, apenas o local
            pass
        
        db.session.add(movimentacao)
        db.session.commit()
        
        return jsonify({
            'message': 'Movimentação criada com sucesso',
            'movimentacao': movimentacao.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/inventario', methods=['POST'])
@token_required
@almoxarife_or_above_required
def realizar_inventario(current_user):
    """Realizar inventário de estoque"""
    try:
        data = request.get_json()
        
        # Pode ser inventário de uma peça específica ou geral
        peca_id = data.get('peca_id')
        quantidade_fisica = data.get('quantidade_fisica')
        observacoes = data.get('observacoes', '')
        
        if peca_id:
            # Inventário de peça específica
            peca = Peca.query.get(peca_id)
            if not peca:
                return jsonify({'error': 'Peça não encontrada'}), 404
            
            if quantidade_fisica is None:
                return jsonify({'error': 'Quantidade física é obrigatória'}), 400
            
            quantidade_sistema = peca.quantidade
            diferenca = quantidade_fisica - quantidade_sistema
            
            # Atualizar dados do inventário
            peca.ultima_inventariacao_data = datetime.utcnow()
            peca.ultima_inventariacao_usuario = current_user.nome_completo
            
            # Se há diferença, criar movimentação de ajuste
            if diferenca != 0:
                tipo_ajuste = 'entrada' if diferenca > 0 else 'saida'
                motivo = f'Ajuste de inventário - Diferença: {diferenca}'
                
                movimentacao = MovimentacaoEstoque(
                    peca_id=peca_id,
                    usuario_id=current_user.id,
                    tipo_movimentacao=tipo_ajuste,
                    quantidade=abs(diferenca),
                    motivo=motivo,
                    observacoes=f'Inventário: Sistema={quantidade_sistema}, Físico={quantidade_fisica}. {observacoes}'
                )
                
                # Ajustar quantidade no sistema
                peca.quantidade = quantidade_fisica
                
                db.session.add(movimentacao)
            
            db.session.commit()
            
            return jsonify({
                'message': 'Inventário realizado com sucesso',
                'peca': peca.to_dict(),
                'diferenca': diferenca,
                'ajuste_necessario': diferenca != 0
            }), 200
        
        else:
            # Inventário geral - marcar data de inventário para todas as peças
            pecas = Peca.query.all()
            
            for peca in pecas:
                peca.ultima_inventariacao_data = datetime.utcnow()
                peca.ultima_inventariacao_usuario = current_user.nome_completo
            
            db.session.commit()
            
            return jsonify({
                'message': f'Inventário geral iniciado para {len(pecas)} peças',
                'total_pecas': len(pecas)
            }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/relatorio-inventario', methods=['GET'])
@token_required
@almoxarife_or_above_required
def gerar_relatorio_inventario(current_user):
    """Gerar relatório de inventário"""
    try:
        # Filtros opcionais
        grupo_id = request.args.get('grupo_id')
        estoque_local_id = request.args.get('estoque_local_id')
        apenas_baixo_estoque = request.args.get('apenas_baixo_estoque', 'false').lower() == 'true'
        
        query = Peca.query
        
        if grupo_id:
            query = query.filter_by(grupo_item_id=grupo_id)
        if estoque_local_id:
            query = query.filter_by(estoque_local_id=estoque_local_id)
        if apenas_baixo_estoque:
            query = query.filter(Peca.quantidade <= Peca.min_estoque)
        
        pecas = query.order_by(Peca.nome).all()
        
        # Estatísticas
        total_pecas = len(pecas)
        valor_total_estoque = sum((peca.quantidade * (peca.preco_unitario or 0)) for peca in pecas)
        pecas_baixo_estoque = sum(1 for peca in pecas if peca.quantidade <= peca.min_estoque)
        pecas_sem_inventario = sum(1 for peca in pecas if not peca.ultima_inventariacao_data)
        
        # Agrupar por estoque local
        estoques = {}
        for peca in pecas:
            estoque_nome = peca.estoque_local_obj.nome if peca.estoque_local_obj else 'Sem localização'
            if estoque_nome not in estoques:
                estoques[estoque_nome] = []
            estoques[estoque_nome].append(peca.to_dict())
        
        return jsonify({
            'relatorio': {
                'data_geracao': datetime.utcnow().isoformat(),
                'responsavel': current_user.nome_completo,
                'estatisticas': {
                    'total_pecas': total_pecas,
                    'valor_total_estoque': valor_total_estoque,
                    'pecas_baixo_estoque': pecas_baixo_estoque,
                    'pecas_sem_inventario': pecas_sem_inventario
                },
                'estoques': estoques
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/locais', methods=['GET'])
@token_required
def get_estoques_locais(current_user):
    """Listar estoques locais"""
    try:
        estoques = EstoqueLocal.query.filter_by(ativo=True).order_by(EstoqueLocal.nome).all()
        
        return jsonify({
            'estoques_locais': [estoque.to_dict() for estoque in estoques],
            'total': len(estoques)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@estoque_bp.route('/estoque/locais', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_estoque_local(current_user):
    """Criar novo estoque local"""
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['nome', 'codigo', 'localizacao']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se código já existe
        if EstoqueLocal.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Código já existe'}), 400
        
        estoque = EstoqueLocal(
            nome=data['nome'],
            codigo=data['codigo'],
            localizacao=data['localizacao'],
            prateleira=data.get('prateleira'),
            coluna=data.get('coluna'),
            setor=data.get('setor'),
            responsavel=data.get('responsavel'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(estoque)
        db.session.commit()
        
        return jsonify({
            'message': 'Estoque local criado com sucesso',
            'estoque_local': estoque.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


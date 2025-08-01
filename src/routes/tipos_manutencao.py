from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.tipo_manutencao import TipoManutencao
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

tipos_manutencao_bp = Blueprint('tipos_manutencao', __name__)

@tipos_manutencao_bp.route('/tipos-manutencao', methods=['GET'])
@token_required
def get_tipos_manutencao(current_user):
    try:
        # Filtros opcionais
        ativo = request.args.get('ativo')
        search = request.args.get('search')
        
        query = TipoManutencao.query
        
        if ativo is not None:
            query = query.filter_by(ativo=ativo.lower() == 'true')
        if search:
            query = query.filter(
                TipoManutencao.nome.contains(search) |
                TipoManutencao.codigo.contains(search)
            )
        
        tipos = query.order_by(TipoManutencao.nome).all()
        
        return jsonify({
            'tipos_manutencao': [tipo.to_dict() for tipo in tipos],
            'total': len(tipos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tipos_manutencao_bp.route('/tipos-manutencao/<int:tipo_id>', methods=['GET'])
@token_required
def get_tipo_manutencao(current_user, tipo_id):
    try:
        tipo = TipoManutencao.query.get_or_404(tipo_id)
        return jsonify(tipo.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@tipos_manutencao_bp.route('/tipos-manutencao', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_tipo_manutencao(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['nome', 'codigo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se nome ou código já existem
        if TipoManutencao.query.filter_by(nome=data['nome']).first():
            return jsonify({'error': 'Nome já existe'}), 400
        
        if TipoManutencao.query.filter_by(codigo=data['codigo']).first():
            return jsonify({'error': 'Código já existe'}), 400
        
        tipo = TipoManutencao(
            nome=data['nome'],
            codigo=data['codigo'],
            descricao=data.get('descricao'),
            cor_identificacao=data.get('cor_identificacao'),
            ativo=data.get('ativo', True)
        )
        
        db.session.add(tipo)
        db.session.commit()
        
        return jsonify({
            'message': 'Tipo de manutenção criado com sucesso',
            'tipo_manutencao': tipo.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_manutencao_bp.route('/tipos-manutencao/<int:tipo_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_tipo_manutencao(current_user, tipo_id):
    try:
        tipo = TipoManutencao.query.get_or_404(tipo_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome' in data:
            # Verificar se nome já existe em outro tipo
            if TipoManutencao.query.filter(
                TipoManutencao.nome == data['nome'],
                TipoManutencao.id != tipo_id
            ).first():
                return jsonify({'error': 'Nome já existe para outro tipo'}), 400
            tipo.nome = data['nome']
        
        if 'codigo' in data:
            # Verificar se código já existe em outro tipo
            if TipoManutencao.query.filter(
                TipoManutencao.codigo == data['codigo'],
                TipoManutencao.id != tipo_id
            ).first():
                return jsonify({'error': 'Código já existe para outro tipo'}), 400
            tipo.codigo = data['codigo']
        
        if 'descricao' in data:
            tipo.descricao = data['descricao']
        if 'cor_identificacao' in data:
            tipo.cor_identificacao = data['cor_identificacao']
        if 'ativo' in data:
            tipo.ativo = data['ativo']
        
        tipo.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Tipo de manutenção atualizado com sucesso',
            'tipo_manutencao': tipo.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tipos_manutencao_bp.route('/tipos-manutencao/<int:tipo_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_tipo_manutencao(current_user, tipo_id):
    try:
        tipo = TipoManutencao.query.get_or_404(tipo_id)
        
        # Verificar se há ordens de serviço usando este tipo
        if tipo.ordens_servico:
            return jsonify({'error': 'Não é possível excluir tipo com ordens de serviço associadas'}), 400
        
        db.session.delete(tipo)
        db.session.commit()
        
        return jsonify({'message': 'Tipo de manutenção excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


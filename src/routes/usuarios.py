from flask import Blueprint, request, jsonify
from src.db import db
from src.models.usuario import Usuario
from src.utils.auth import token_required, admin_required
from datetime import datetime

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuarios', methods=['GET'])
@token_required
@admin_required
def get_usuarios(current_user):
    try:
        # Filtros opcionais
        nivel_acesso = request.args.get('nivel_acesso')
        ativo = request.args.get('ativo')
        search = request.args.get('search')
        
        query = Usuario.query
        
        if nivel_acesso:
            query = query.filter_by(nivel_acesso=nivel_acesso)
        if ativo is not None:
            query = query.filter_by(ativo=ativo.lower() == 'true')
        if search:
            query = query.filter(
                Usuario.nome_completo.contains(search) |
                Usuario.username.contains(search) |
                Usuario.email.contains(search)
            )
        
        usuarios = query.all()
        
        return jsonify({
            'usuarios': [usuario.to_dict() for usuario in usuarios],
            'total': len(usuarios)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['GET'])
@token_required
@admin_required
def get_usuario(current_user, usuario_id):
    try:
        usuario = Usuario.query.get_or_404(usuario_id)
        return jsonify(usuario.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios', methods=['POST'])
@token_required
@admin_required
def create_usuario(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['username', 'email', 'password', 'nome_completo', 'cargo', 'nivel_acesso']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se username já existe
        if Usuario.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username já existe'}), 400
        
        # Verificar se email já existe
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já existe'}), 400
        
        # Validar nível de acesso
        niveis_validos = ['ADM', 'Supervisor', 'PCM', 'Almoxarife', 'Mecanico']
        if data['nivel_acesso'] not in niveis_validos:
            return jsonify({'error': f'Nível de acesso deve ser um dos: {", ".join(niveis_validos)}'}), 400
        
        usuario = Usuario(
            username=data['username'],
            email=data['email'],
            nome_completo=data['nome_completo'],
            cargo=data['cargo'],
            nivel_acesso=data['nivel_acesso'],
            ativo=data.get('ativo', True)
        )
        
        usuario.set_password(data['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'usuario': usuario.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['PUT'])
@token_required
@admin_required
def update_usuario(current_user, usuario_id):
    try:
        usuario = Usuario.query.get_or_404(usuario_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome_completo' in data:
            usuario.nome_completo = data['nome_completo']
        if 'cargo' in data:
            usuario.cargo = data['cargo']
        if 'nivel_acesso' in data:
            niveis_validos = ['ADM', 'Supervisor', 'PCM', 'Almoxarife', 'Mecanico']
            if data['nivel_acesso'] not in niveis_validos:
                return jsonify({'error': f'Nível de acesso deve ser um dos: {", ".join(niveis_validos)}'}), 400
            usuario.nivel_acesso = data['nivel_acesso']
        if 'ativo' in data:
            usuario.ativo = data['ativo']
        if 'email' in data:
            # Verificar se email já existe em outro usuário
            if Usuario.query.filter(
                Usuario.email == data['email'],
                Usuario.id != usuario_id
            ).first():
                return jsonify({'error': 'Email já existe para outro usuário'}), 400
            usuario.email = data['email']
        
        # Atualizar senha se fornecida
        if 'password' in data and data['password']:
            usuario.set_password(data['password'])
        
        usuario.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'usuario': usuario.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/<int:usuario_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_usuario(current_user, usuario_id):
    try:
        if current_user.id == usuario_id:
            return jsonify({'error': 'Não é possível excluir seu próprio usuário'}), 400
        
        usuario = Usuario.query.get_or_404(usuario_id)
        
        db.session.delete(usuario)
        db.session.commit()
        
        return jsonify({'message': 'Usuário excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/perfil', methods=['GET'])
@token_required
def get_perfil(current_user):
    try:
        return jsonify(current_user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/perfil', methods=['PUT'])
@token_required
def update_perfil(current_user):
    try:
        data = request.get_json()
        
        # Atualizar campos permitidos do próprio perfil
        if 'nome_completo' in data:
            current_user.nome_completo = data['nome_completo']
        if 'email' in data:
            # Verificar se email já existe em outro usuário
            if Usuario.query.filter(
                Usuario.email == data['email'],
                Usuario.id != current_user.id
            ).first():
                return jsonify({'error': 'Email já existe para outro usuário'}), 400
            current_user.email = data['email']
        
        # Atualizar senha se fornecida
        if 'password' in data and data['password']:
            current_user.set_password(data['password'])
        
        current_user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'usuario': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@usuarios_bp.route('/usuarios/niveis-acesso', methods=['GET'])
@token_required
@admin_required
def get_niveis_acesso(current_user):
    try:
        niveis = [
            {'codigo': 'ADM', 'nome': 'Administrador', 'descricao': 'Acesso total ao sistema'},
            {'codigo': 'Supervisor', 'nome': 'Supervisor', 'descricao': 'Supervisão de operações e relatórios'},
            {'codigo': 'PCM', 'nome': 'PCM (Planejamento e Controle de Manutenção)', 'descricao': 'Planejamento e controle de manutenção'},
            {'codigo': 'Almoxarife', 'nome': 'Almoxarife', 'descricao': 'Controle de estoque e peças'},
            {'codigo': 'Mecanico', 'nome': 'Mecânico', 'descricao': 'Execução de ordens de serviço'}
        ]
        
        return jsonify({'niveis_acesso': niveis}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


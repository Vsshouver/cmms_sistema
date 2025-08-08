from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from src.db import db
from src.models.usuario import Usuario
from src.utils.auth import token_required, get_user_permissions, SECRET_KEY
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        senha = data.get('senha')

        if not senha or not (email or username):
            return jsonify({'error': 'Email/usuário e senha são obrigatórios'}), 400

        if email:
            usuario = Usuario.query.filter_by(email=email).first()
        else:
            usuario = Usuario.query.filter_by(username=username).first()
        if not usuario or not usuario.check_password(senha):
            return jsonify({'error': 'Credenciais inválidas'}), 401

        if not usuario.ativo:
            return jsonify({'error': 'Usuário inativo'}), 403

        usuario.ultimo_login = datetime.utcnow()
        db.session.commit()

        token = jwt.encode({
            'user_id': usuario.id,
            'nivel_acesso': usuario.nivel_acesso,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')

        user_data = usuario.to_dict()
        user_data['permissions'] = get_user_permissions(usuario)

        return jsonify({
            'token': token, 
            'user': user_data,
            'message': 'Login realizado com sucesso'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/validate', methods=['GET'])
@token_required
def validate_token(current_user):
    user_data = current_user.to_dict()
    user_data['permissions'] = get_user_permissions(current_user)
    return jsonify({'user': user_data}), 200

@auth_bp.route('/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    # Em uma implementação real, você poderia invalidar o token
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@auth_bp.route('/auth/profile', methods=['GET'])
@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def get_profile(current_user):
    """Obter perfil do usuário atual"""
    user_data = current_user.to_dict()
    user_data['permissions'] = get_user_permissions(current_user)
    return jsonify({'user': user_data}), 200

@auth_bp.route('/auth/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Alterar senha do usuário atual"""
    try:
        data = request.get_json()
        senha_atual = data.get('senha_atual')
        nova_senha = data.get('nova_senha')

        if not senha_atual or not nova_senha:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400

        if not current_user.check_password(senha_atual):
            return jsonify({'error': 'Senha atual incorreta'}), 400

        if len(nova_senha) < 6:
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400

        current_user.set_password(nova_senha)
        db.session.commit()

        return jsonify({'message': 'Senha alterada com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


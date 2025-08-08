"""
Utilitários de autenticação e autorização
"""

from functools import wraps
from flask import request, jsonify
from src.models.usuario import Usuario
import jwt
import os

SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

def token_required(f):
    """Decorator para verificar se o token JWT é válido"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token ausente'}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = Usuario.query.get(data['user_id'])
            if not current_user or not current_user.ativo:
                return jsonify({'error': 'Usuário inválido'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator para verificar se o usuário é administrador"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.nivel_acesso != 'ADM':
            return jsonify({'error': 'Acesso negado. Apenas administradores.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def supervisor_or_admin_required(f):
    """Decorator para verificar se o usuário é supervisor ou administrador"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.nivel_acesso not in ['ADM', 'Supervisor']:
            return jsonify({'error': 'Acesso negado. Apenas supervisores ou administradores.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def pcm_or_above_required(f):
    """Decorator para verificar se o usuário é PCM, supervisor ou administrador"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'PCM']:
            return jsonify({'error': 'Acesso negado. Apenas PCM, supervisores ou administradores.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def almoxarife_or_above_required(f):
    """Decorator para verificar se o usuário pode gerenciar estoque"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'Almoxarife']:
            return jsonify({'error': 'Acesso negado. Apenas almoxarifes, supervisores ou administradores.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def mecanico_or_above_required(f):
    """Decorator para verificar se o usuário pode executar ordens de serviço"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.nivel_acesso not in ['ADM', 'Supervisor', 'PCM', 'Mecanico']:
            return jsonify({'error': 'Acesso negado.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def can_edit_equipment(current_user):
    """Verifica se o usuário pode editar equipamentos"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor']

def can_manage_stock(current_user):
    """Verifica se o usuário pode gerenciar estoque"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor', 'Almoxarife']

def can_create_os(current_user):
    """Verifica se o usuário pode criar ordens de serviço"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor', 'PCM']

def can_execute_os(current_user):
    """Verifica se o usuário pode executar ordens de serviço"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor', 'PCM', 'Mecanico']

def can_manage_users(current_user):
    """Verifica se o usuário pode gerenciar usuários"""
    return current_user.nivel_acesso == 'ADM'

def can_manage_mechanics(current_user):
    """Verifica se o usuário pode gerenciar mecânicos"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor']

def can_manage_tires(current_user):
    """Verifica se o usuário pode gerenciar pneus"""
    return current_user.nivel_acesso in ['ADM', 'Supervisor', 'Almoxarife']

def get_user_permissions(current_user):
    """Retorna as permissões do usuário atual"""
    return {
        'can_edit_equipment': can_edit_equipment(current_user),
        'can_manage_stock': can_manage_stock(current_user),
        'can_create_os': can_create_os(current_user),
        'can_execute_os': can_execute_os(current_user),
        'can_manage_users': can_manage_users(current_user),
        'can_manage_mechanics': can_manage_mechanics(current_user),
        'can_manage_tires': can_manage_tires(current_user),
        'nivel_acesso': current_user.nivel_acesso
    }


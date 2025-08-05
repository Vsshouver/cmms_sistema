from flask import Blueprint, request, jsonify
from src.db import db
from src.models.equipamento import Equipamento
from src.models.tipo_equipamento import TipoEquipamento
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

equipamentos_bp = Blueprint('equipamentos', __name__)

@equipamentos_bp.route('/equipamentos', methods=['GET'])
@token_required
def get_equipamentos(current_user):
    try:
        # Filtros opcionais
        status = request.args.get('status')
        tipo = request.args.get('tipo')
        search = request.args.get('search')
        
        # Query com join para incluir tipo de equipamento
        query = db.session.query(Equipamento).outerjoin(TipoEquipamento)
        
        if status:
            query = query.filter(Equipamento.status == status)
        if tipo:
            query = query.filter(Equipamento.tipo_equipamento_id == tipo)
        if search:
            query = query.filter(
                (Equipamento.nome.contains(search)) |
                (Equipamento.codigo_interno.contains(search)) |
                (Equipamento.fabricante.contains(search))
            )
        
        equipamentos = query.all()
        
        # Incluir informações do tipo de equipamento
        result = []
        for eq in equipamentos:
            eq_dict = eq.to_dict()
            if eq.tipo_equipamento_obj:
                eq_dict['tipo_equipamento_nome'] = eq.tipo_equipamento_obj.nome
            result.append(eq_dict)
        
        return jsonify({
            'equipamentos': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        print(f"Erro ao carregar equipamentos: {str(e)}")
        return jsonify({'error': str(e)}), 500

@equipamentos_bp.route('/equipamentos/<int:equipamento_id>', methods=['GET'])
@token_required
def get_equipamento(current_user, equipamento_id):
    try:
        equipamento = Equipamento.query.get_or_404(equipamento_id)
        return jsonify(equipamento.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@equipamentos_bp.route('/equipamentos', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_equipamento(current_user):
    try:
        data = request.get_json()
        required_fields = ["codigo_interno", "nome", "tipo_equipamento_id", "modelo", "fabricante", "numero_serie", "localizacao", "data_aquisicao"]
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Campo {field} é obrigatório"}), 400
        
        # Verificar se código interno já existe
        if Equipamento.query.filter_by(codigo_interno=data["codigo_interno"]).first():
            return jsonify({"error": "Código interno já existe"}), 400
        
        # Verificar se número de série já existe
        if Equipamento.query.filter_by(numero_serie=data["numero_serie"]).first():
            return jsonify({"error": "Número de série já existe"}), 400

        equipamento = Equipamento(
            codigo_interno=data["codigo_interno"],
            nome=data["nome"],
            tipo_equipamento_id=data["tipo_equipamento_id"],
            modelo=data["modelo"],
            fabricante=data["fabricante"],
            numero_serie=data["numero_serie"],
            status=data.get("status", "ativo"),
            localizacao=data["localizacao"],
            horimetro_atual=data.get("horimetro_atual", 0.0),
            data_aquisicao=datetime.strptime(data["data_aquisicao"], "%Y-%m-%d").date(),
            valor_aquisicao=data.get("valor_aquisicao"),
            observacoes=data.get("observacoes")
        )
        
        db.session.add(equipamento)
        db.session.commit()
        
        return jsonify({
            "message": "Equipamento criado com sucesso",
            "equipamento": equipamento.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@equipamentos_bp.route("/equipamentos/<int:equipamento_id>", methods=["PUT"])
@token_required
@supervisor_or_admin_required
def update_equipamento(current_user, equipamento_id):
    try:
        equipamento = Equipamento.query.get_or_404(equipamento_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if "nome" in data:
            equipamento.nome = data["nome"]
        if "tipo_equipamento_id" in data:
            equipamento.tipo_equipamento_id = data["tipo_equipamento_id"]
        if "modelo" in data:
            equipamento.modelo = data["modelo"]
        if "fabricante" in data:
            equipamento.fabricante = data["fabricante"]
        if "status" in data:
            equipamento.status = data["status"]
        if "localizacao" in data:
            equipamento.localizacao = data["localizacao"]
        if "horimetro_atual" in data:
            equipamento.horimetro_atual = data["horimetro_atual"]
        if "valor_aquisicao" in data:
            equipamento.valor_aquisicao = data["valor_aquisicao"]
        if "observacoes" in data:
            equipamento.observacoes = data["observacoes"]
        
        equipamento.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "Equipamento atualizado com sucesso",
            "equipamento": equipamento.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@equipamentos_bp.route('/equipamentos/<int:equipamento_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_equipamento(current_user, equipamento_id):
    try:
        equipamento = Equipamento.query.get_or_404(equipamento_id)
        
        # Verificar se há ordens de serviço associadas
        if equipamento.ordens_servico:
            return jsonify({'error': 'Não é possível excluir equipamento com ordens de serviço associadas'}), 400
        
        db.session.delete(equipamento)
        db.session.commit()
        
        return jsonify({'message': 'Equipamento excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
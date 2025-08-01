from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.ordem_servico import OrdemServico
from src.models.equipamento import Equipamento
from src.models.mecanico import Mecanico
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

ordens_servico_bp = Blueprint('ordens_servico', __name__)

@ordens_servico_bp.route('/ordens-servico', methods=['GET'])
@token_required
def get_ordens_servico(current_user):
    try:
        # Filtros opcionais
        status = request.args.get('status')
        tipo = request.args.get('tipo')
        prioridade = request.args.get('prioridade')
        equipamento_id = request.args.get('equipamento_id')
        mecanico_id = request.args.get('mecanico_id')
        search = request.args.get('search')
        
        query = OrdemServico.query
        
        if status:
            query = query.filter_by(status=status)
        if tipo:
            query = query.filter_by(tipo=tipo)
        if prioridade:
            query = query.filter_by(prioridade=prioridade)
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        if mecanico_id:
            query = query.filter_by(mecanico_id=mecanico_id)
        if search:
            query = query.filter(
                OrdemServico.numero_os.contains(search) |
                OrdemServico.descricao_problema.contains(search)
            )
        
        # Ordenar por data de abertura (mais recentes primeiro)
        ordens = query.order_by(OrdemServico.data_abertura.desc()).all()
        
        # Incluir informações do equipamento e mecânico
        result = []
        for os in ordens:
            os_dict = os.to_dict()
            if os.equipamento:
                os_dict['equipamento'] = {
                    'nome': os.equipamento.nome,
                    'codigo_interno': os.equipamento.codigo_interno
                }
            if os.mecanico:
                os_dict['mecanico'] = {
                    'nome_completo': os.mecanico.nome_completo
                }
            result.append(os_dict)
        
        return jsonify({
            'ordens_servico': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>', methods=['GET'])
@token_required
def get_ordem_servico(current_user, os_id):
    try:
        os = OrdemServico.query.get_or_404(os_id)
        os_dict = os.to_dict()
        
        if os.equipamento:
            os_dict['equipamento'] = os.equipamento.to_dict()
        if os.mecanico:
            os_dict['mecanico'] = os.mecanico.to_dict()
            
        return jsonify(os_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico', methods=['POST'])
@token_required
def create_ordem_servico(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['equipamento_id', 'tipo', 'prioridade', 'descricao_problema']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se equipamento existe
        equipamento = Equipamento.query.get(data['equipamento_id'])
        if not equipamento:
            return jsonify({'error': 'Equipamento não encontrado'}), 404
        
        # Gerar número da OS
        ultimo_numero = db.session.query(OrdemServico.numero_os).order_by(OrdemServico.id.desc()).first()
        if ultimo_numero:
            ultimo_num = int(ultimo_numero[0].split('-')[-1])
            novo_numero = f"OS-{datetime.now().year}-{ultimo_num + 1:03d}"
        else:
            novo_numero = f"OS-{datetime.now().year}-001"
        
        os = OrdemServico(
            numero_os=novo_numero,
            equipamento_id=data['equipamento_id'],
            mecanico_id=data.get('mecanico_id'),
            tipo=data['tipo'],
            prioridade=data['prioridade'],
            status=data.get('status', 'aberta'),
            descricao_problema=data['descricao_problema'],
            descricao_solucao=data.get('descricao_solucao'),
            data_prevista=datetime.strptime(data['data_prevista'], '%Y-%m-%d %H:%M:%S') if data.get('data_prevista') else None,
            observacoes=data.get('observacoes')
        )
        
        db.session.add(os)
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem de serviço criada com sucesso',
            'ordem_servico': os.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>/iniciar', methods=['PUT'])
@token_required
def iniciar_ordem_servico(current_user, os_id):
    try:
        os = OrdemServico.query.get_or_404(os_id)
        
        if os.status != 'aberta':
            return jsonify({'error': 'Apenas ordens abertas podem ser iniciadas'}), 400
        
        os.status = 'em_execucao'
        os.data_inicio = datetime.utcnow()
        os.updated_at = datetime.utcnow()
        
        # Se não há mecânico atribuído, atribuir o usuário atual (se for mecânico)
        if not os.mecanico_id and current_user.nivel_acesso == 'Mecanico':
            # Buscar mecânico pelo email do usuário
            mecanico = Mecanico.query.filter_by(email=current_user.email).first()
            if mecanico:
                os.mecanico_id = mecanico.id
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem de serviço iniciada com sucesso',
            'ordem_servico': os.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>/concluir', methods=['PUT'])
@token_required
def concluir_ordem_servico(current_user, os_id):
    try:
        os = OrdemServico.query.get_or_404(os_id)
        data = request.get_json()
        
        if os.status not in ['em_execucao', 'aguardando_pecas']:
            return jsonify({'error': 'Apenas ordens em execução ou aguardando peças podem ser concluídas'}), 400
        
        if not data.get('descricao_solucao'):
            return jsonify({'error': 'Descrição da solução é obrigatória para concluir a OS'}), 400
        
        os.status = 'concluida'
        os.data_encerramento = datetime.utcnow()
        os.descricao_solucao = data['descricao_solucao']
        os.custo_mao_obra = data.get('custo_mao_obra', 0.0)
        os.custo_pecas = data.get('custo_pecas', 0.0)
        os.custo_total = os.custo_mao_obra + os.custo_pecas
        os.updated_at = datetime.utcnow()
        
        # Calcular tempo de execução
        if os.data_inicio:
            tempo_execucao = os.data_encerramento - os.data_inicio
            os.tempo_execucao_horas = tempo_execucao.total_seconds() / 3600
        
        if data.get('observacoes'):
            os.observacoes = data['observacoes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem de serviço concluída com sucesso',
            'ordem_servico': os.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>', methods=['PUT'])
@token_required
def update_ordem_servico(current_user, os_id):
    try:
        os = OrdemServico.query.get_or_404(os_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'mecanico_id' in data:
            os.mecanico_id = data['mecanico_id']
        if 'tipo' in data:
            os.tipo = data['tipo']
        if 'prioridade' in data:
            os.prioridade = data['prioridade']
        if 'status' in data:
            os.status = data['status']
        if 'descricao_problema' in data:
            os.descricao_problema = data['descricao_problema']
        if 'descricao_solucao' in data:
            os.descricao_solucao = data['descricao_solucao']
        if 'data_prevista' in data:
            os.data_prevista = datetime.strptime(data['data_prevista'], '%Y-%m-%d %H:%M:%S')
        if 'observacoes' in data:
            os.observacoes = data['observacoes']
        
        os.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem de serviço atualizada com sucesso',
            'ordem_servico': os.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_ordem_servico(current_user, os_id):
    try:
        os = OrdemServico.query.get_or_404(os_id)
        
        if os.status == 'em_execucao':
            return jsonify({'error': 'Não é possível excluir ordem de serviço em execução'}), 400
        
        db.session.delete(os)
        db.session.commit()
        
        return jsonify({'message': 'Ordem de serviço excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


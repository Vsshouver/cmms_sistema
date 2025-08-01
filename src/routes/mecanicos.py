from flask import Blueprint, request, jsonify
from src.models.usuario import db
from src.models.mecanico import Mecanico
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

mecanicos_bp = Blueprint('mecanicos', __name__)

@mecanicos_bp.route('/mecanicos', methods=['GET'])
@token_required
def get_mecanicos(current_user):
    try:
        # Filtros opcionais
        status = request.args.get('status')
        especialidade = request.args.get('especialidade')
        nivel_experiencia = request.args.get('nivel_experiencia')
        search = request.args.get('search')
        
        query = Mecanico.query
        
        if status:
            query = query.filter_by(status=status)
        if especialidade:
            query = query.filter_by(especialidade=especialidade)
        if nivel_experiencia:
            query = query.filter_by(nivel_experiencia=nivel_experiencia)
        if search:
            query = query.filter(
                Mecanico.nome_completo.contains(search) |
                Mecanico.cpf.contains(search) |
                Mecanico.email.contains(search)
            )
        
        mecanicos = query.all()
        
        return jsonify({
            'mecanicos': [mecanico.to_dict() for mecanico in mecanicos],
            'total': len(mecanicos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos/<int:mecanico_id>', methods=['GET'])
@token_required
def get_mecanico(current_user, mecanico_id):
    try:
        mecanico = Mecanico.query.get_or_404(mecanico_id)
        return jsonify(mecanico.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_mecanico(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['nome_completo', 'cpf', 'especialidade', 'nivel_experiencia', 'data_admissao']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se CPF já existe
        if Mecanico.query.filter_by(cpf=data['cpf']).first():
            return jsonify({'error': 'CPF já cadastrado'}), 400
        
        # Verificar se email já existe (se fornecido)
        if data.get('email') and Mecanico.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        mecanico = Mecanico(
            nome_completo=data['nome_completo'],
            cpf=data['cpf'],
            telefone=data.get('telefone'),
            email=data.get('email'),
            especialidade=data['especialidade'],
            nivel_experiencia=data['nivel_experiencia'],
            salario=data.get('salario'),
            data_admissao=datetime.strptime(data['data_admissao'], '%Y-%m-%d').date(),
            status=data.get('status', 'ativo'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(mecanico)
        db.session.commit()
        
        return jsonify({
            'message': 'Mecânico criado com sucesso',
            'mecanico': mecanico.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos/<int:mecanico_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_mecanico(current_user, mecanico_id):
    try:
        mecanico = Mecanico.query.get_or_404(mecanico_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome_completo' in data:
            mecanico.nome_completo = data['nome_completo']
        if 'telefone' in data:
            mecanico.telefone = data['telefone']
        if 'email' in data:
            # Verificar se email já existe em outro mecânico
            if data['email'] and Mecanico.query.filter(
                Mecanico.email == data['email'],
                Mecanico.id != mecanico_id
            ).first():
                return jsonify({'error': 'Email já cadastrado para outro mecânico'}), 400
            mecanico.email = data['email']
        if 'especialidade' in data:
            mecanico.especialidade = data['especialidade']
        if 'nivel_experiencia' in data:
            mecanico.nivel_experiencia = data['nivel_experiencia']
        if 'salario' in data:
            mecanico.salario = data['salario']
        if 'status' in data:
            mecanico.status = data['status']
        if 'observacoes' in data:
            mecanico.observacoes = data['observacoes']
        
        mecanico.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Mecânico atualizado com sucesso',
            'mecanico': mecanico.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos/<int:mecanico_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_mecanico(current_user, mecanico_id):
    try:
        mecanico = Mecanico.query.get_or_404(mecanico_id)
        
        # Verificar se há ordens de serviço associadas
        if mecanico.ordens_servico:
            return jsonify({'error': 'Não é possível excluir mecânico com ordens de serviço associadas'}), 400
        
        db.session.delete(mecanico)
        db.session.commit()
        
        return jsonify({'message': 'Mecânico excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos/especialidades', methods=['GET'])
@token_required
def get_especialidades(current_user):
    try:
        # Buscar todas as especialidades únicas
        especialidades = db.session.query(Mecanico.especialidade).distinct().all()
        especialidades_list = [esp[0] for esp in especialidades if esp[0]]
        
        return jsonify({
            'especialidades': sorted(especialidades_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@mecanicos_bp.route('/mecanicos/<int:mecanico_id>/performance', methods=['GET'])
@token_required
def get_performance_mecanico(current_user, mecanico_id):
    try:
        mecanico = Mecanico.query.get_or_404(mecanico_id)
        
        # Estatísticas do mecânico
        total_os = len(mecanico.ordens_servico)
        os_concluidas = len([os for os in mecanico.ordens_servico if os.status == 'concluida'])
        os_em_andamento = len([os for os in mecanico.ordens_servico if os.status in ['em_execucao', 'aguardando_pecas']])
        
        # Tempo médio de execução
        os_com_tempo = [os for os in mecanico.ordens_servico if os.tempo_execucao_horas]
        tempo_medio = sum([os.tempo_execucao_horas for os in os_com_tempo]) / len(os_com_tempo) if os_com_tempo else 0
        
        # Custo total dos serviços
        custo_total = sum([os.custo_total for os in mecanico.ordens_servico if os.custo_total])
        
        return jsonify({
            'mecanico': mecanico.to_dict(),
            'performance': {
                'total_os': total_os,
                'os_concluidas': os_concluidas,
                'os_em_andamento': os_em_andamento,
                'taxa_conclusao': (os_concluidas / total_os * 100) if total_os > 0 else 0,
                'tempo_medio_execucao': round(tempo_medio, 2),
                'custo_total_servicos': custo_total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


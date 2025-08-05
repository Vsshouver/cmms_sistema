from flask import Blueprint, request, jsonify
from src.db import db
from src.models.plano_preventiva import PlanoPreventiva
from src.models.equipamento import Equipamento
from src.models.tipo_manutencao import TipoManutencao
from src.models.ordem_servico import OrdemServico
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime, timedelta

planos_preventiva_bp = Blueprint('planos_preventiva', __name__)

@planos_preventiva_bp.route('/planos-preventiva', methods=['GET'])
@token_required
def get_planos_preventiva(current_user):
    try:
        # Filtros opcionais
        equipamento_id = request.args.get('equipamento_id')
        ativo = request.args.get('ativo')
        deve_gerar = request.args.get('deve_gerar')
        search = request.args.get('search')
        
        query = PlanoPreventiva.query
        
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        if ativo is not None:
            query = query.filter_by(ativo=ativo.lower() == 'true')
        if search:
            query = query.filter(PlanoPreventiva.nome.contains(search))
        
        planos = query.order_by(PlanoPreventiva.nome).all()
        
        # Filtrar por deve_gerar se solicitado
        if deve_gerar and deve_gerar.lower() == 'true':
            planos = [p for p in planos if p.deve_gerar_os()]
        
        return jsonify({
            'planos_preventiva': [plano.to_dict() for plano in planos],
            'total': len(planos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva/<int:plano_id>', methods=['GET'])
@token_required
def get_plano_preventiva(current_user, plano_id):
    try:
        plano = PlanoPreventiva.query.get_or_404(plano_id)
        return jsonify(plano.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_plano_preventiva(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        if not data.get('nome'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        if not data.get('equipamento_id'):
            return jsonify({'error': 'Equipamento é obrigatório'}), 400
        if not data.get('tipo_manutencao_id'):
            return jsonify({'error': 'Tipo de manutenção é obrigatório'}), 400
            
        # Verificar se pelo menos um critério foi definido
        if not any([data.get('intervalo_horas'), data.get('intervalo_dias'), data.get('intervalo_km')]):
            return jsonify({'error': 'Pelo menos um critério de intervalo deve ser definido'}), 400
        
        # Verificar se equipamento existe
        equipamento = Equipamento.query.get(data['equipamento_id'])
        if not equipamento:
            return jsonify({'error': 'Equipamento não encontrado'}), 404
            
        # Verificar se tipo de manutenção existe
        tipo_manutencao = TipoManutencao.query.get(data['tipo_manutencao_id'])
        if not tipo_manutencao:
            return jsonify({'error': 'Tipo de manutenção não encontrado'}), 404
        
        plano = PlanoPreventiva(
            nome=data['nome'],
            descricao=data.get('descricao'),
            equipamento_id=data['equipamento_id'],
            tipo_manutencao_id=data['tipo_manutencao_id'],
            intervalo_horas=data.get('intervalo_horas'),
            intervalo_dias=data.get('intervalo_dias'),
            intervalo_km=data.get('intervalo_km'),
            antecedencia_dias=data.get('antecedencia_dias', 7),
            prioridade=data.get('prioridade', 'media'),
            ativo=data.get('ativo', True)
        )
        
        # Calcular próxima execução
        plano.calcular_proxima_execucao()
        
        db.session.add(plano)
        db.session.commit()
        
        return jsonify({
            'message': 'Plano de preventiva criado com sucesso',
            'plano_preventiva': plano.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva/<int:plano_id>', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def update_plano_preventiva(current_user, plano_id):
    try:
        plano = PlanoPreventiva.query.get_or_404(plano_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'nome' in data:
            plano.nome = data['nome']
        if 'descricao' in data:
            plano.descricao = data['descricao']
        if 'equipamento_id' in data:
            # Verificar se equipamento existe
            equipamento = Equipamento.query.get(data['equipamento_id'])
            if not equipamento:
                return jsonify({'error': 'Equipamento não encontrado'}), 404
            plano.equipamento_id = data['equipamento_id']
        if 'tipo_manutencao_id' in data:
            # Verificar se tipo de manutenção existe
            tipo_manutencao = TipoManutencao.query.get(data['tipo_manutencao_id'])
            if not tipo_manutencao:
                return jsonify({'error': 'Tipo de manutenção não encontrado'}), 404
            plano.tipo_manutencao_id = data['tipo_manutencao_id']
        if 'intervalo_horas' in data:
            plano.intervalo_horas = data['intervalo_horas']
        if 'intervalo_dias' in data:
            plano.intervalo_dias = data['intervalo_dias']
        if 'intervalo_km' in data:
            plano.intervalo_km = data['intervalo_km']
        if 'antecedencia_dias' in data:
            plano.antecedencia_dias = data['antecedencia_dias']
        if 'prioridade' in data:
            plano.prioridade = data['prioridade']
        if 'ativo' in data:
            plano.ativo = data['ativo']
        
        # Recalcular próxima execução se critérios mudaram
        if any(key in data for key in ['intervalo_horas', 'intervalo_dias', 'intervalo_km']):
            plano.calcular_proxima_execucao()
        
        plano.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Plano de preventiva atualizado com sucesso',
            'plano_preventiva': plano.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva/<int:plano_id>', methods=['DELETE'])
@token_required
@supervisor_or_admin_required
def delete_plano_preventiva(current_user, plano_id):
    try:
        plano = PlanoPreventiva.query.get_or_404(plano_id)
        
        db.session.delete(plano)
        db.session.commit()
        
        return jsonify({'message': 'Plano de preventiva excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva/<int:plano_id>/executar', methods=['POST'])
@token_required
@supervisor_or_admin_required
def executar_plano_preventiva(current_user, plano_id):
    try:
        plano = PlanoPreventiva.query.get_or_404(plano_id)
        data = request.get_json() or {}
        
        # Atualizar dados da última execução
        agora = datetime.utcnow()
        plano.ultima_execucao_data = agora
        
        if plano.equipamento and plano.equipamento.horimetro_atual:
            plano.ultima_execucao_horimetro = plano.equipamento.horimetro_atual
            
        if data.get('km_atual'):
            plano.ultima_execucao_km = data['km_atual']
        
        # Recalcular próxima execução
        plano.calcular_proxima_execucao()
        
        # Criar ordem de serviço se solicitado
        if data.get('criar_os', True):
            # Gerar número da OS
            ultimo_numero = db.session.query(OrdemServico.numero_os).order_by(OrdemServico.id.desc()).first()
            if ultimo_numero:
                numero = int(ultimo_numero[0].split('-')[-1]) + 1
            else:
                numero = 1
            numero_os = f"OS-{datetime.now().year}-{numero:03d}"
            
            os = OrdemServico(
                numero_os=numero_os,
                equipamento_id=plano.equipamento_id,
                tipo_manutencao_id=plano.tipo_manutencao_id,
                tipo='preventiva',
                origem='preventiva_automatica',
                prioridade=plano.prioridade,
                status='aberta',
                descricao_problema=f"Manutenção preventiva programada: {plano.nome}",
                data_prevista=plano.proxima_execucao_data
            )
            
            db.session.add(os)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Plano executado com sucesso',
            'plano_preventiva': plano.to_dict(),
            'ordem_servico_criada': data.get('criar_os', True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@planos_preventiva_bp.route('/planos-preventiva/gerar-os-pendentes', methods=['POST'])
@token_required
@supervisor_or_admin_required
def gerar_os_pendentes(current_user):
    try:
        planos = PlanoPreventiva.query.filter_by(ativo=True).all()
        os_criadas = 0
        
        for plano in planos:
            if plano.deve_gerar_os():
                # Verificar se já existe OS aberta para este plano
                os_existente = OrdemServico.query.filter(
                    OrdemServico.equipamento_id == plano.equipamento_id,
                    OrdemServico.tipo == 'preventiva',
                    OrdemServico.status.in_(['aberta', 'em_execucao'])
                ).first()
                
                if not os_existente:
                    # Gerar número da OS
                    ultimo_numero = db.session.query(OrdemServico.numero_os).order_by(OrdemServico.id.desc()).first()
                    if ultimo_numero:
                        numero = int(ultimo_numero[0].split('-')[-1]) + 1
                    else:
                        numero = 1
                    numero_os = f"OS-{datetime.now().year}-{numero:03d}"
                    
                    os = OrdemServico(
                        numero_os=numero_os,
                        equipamento_id=plano.equipamento_id,
                        tipo_manutencao_id=plano.tipo_manutencao_id,
                        tipo='preventiva',
                        origem='preventiva_automatica',
                        prioridade=plano.prioridade,
                        status='aberta',
                        descricao_problema=f"Manutenção preventiva programada: {plano.nome}",
                        data_prevista=plano.proxima_execucao_data
                    )
                    
                    db.session.add(os)
                    os_criadas += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'{os_criadas} ordens de serviço criadas com sucesso',
            'os_criadas': os_criadas
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


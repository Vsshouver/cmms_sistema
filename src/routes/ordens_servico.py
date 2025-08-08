from flask import Blueprint, request, jsonify
from src.db import db
from src.models.ordem_servico import OrdemServico
from src.models.equipamento import Equipamento
from src.models.mecanico import Mecanico
from src.models.tipo_manutencao import TipoManutencao
from src.models.peca import Peca
from src.models.os_peca import OS_Peca
from src.models.movimentacao_estoque import MovimentacaoEstoque
from src.utils.auth import token_required, supervisor_or_admin_required, pcm_or_above_required, mecanico_or_above_required
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

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
        
        # Query com joins para incluir relacionamentos
        query = db.session.query(OrdemServico)\
            .outerjoin(Equipamento, OrdemServico.equipamento_id == Equipamento.id)\
            .outerjoin(Mecanico, OrdemServico.mecanico_id == Mecanico.id)\
            .outerjoin(TipoManutencao, OrdemServico.tipo_manutencao_id == TipoManutencao.id)
        
        if status:
            query = query.filter(OrdemServico.status == status)
        if tipo:
            query = query.filter(OrdemServico.tipo_manutencao_id == tipo)
        if prioridade:
            query = query.filter(OrdemServico.prioridade == prioridade)
        if equipamento_id:
            query = query.filter(OrdemServico.equipamento_id == equipamento_id)
        if mecanico_id:
            query = query.filter(OrdemServico.mecanico_id == mecanico_id)
        if search:
            query = query.filter(
                (OrdemServico.numero_os.contains(search)) |
                (OrdemServico.descricao_problema.contains(search))
            )
        
        # Ordenar por data de abertura (mais recentes primeiro)
        ordens = query.order_by(OrdemServico.data_abertura.desc()).all()
        
        # Incluir informações do equipamento, mecânico e tipo de manutenção
        result = []
        for os in ordens:
            os_dict = os.to_dict()
            
            # Adicionar informações do equipamento
            if os.equipamento_id:
                equipamento = Equipamento.query.get(os.equipamento_id)
                if equipamento:
                    os_dict['equipamento_nome'] = equipamento.nome
                    os_dict['equipamento_codigo'] = equipamento.codigo_interno
                    os_dict['equipamento'] = {
                        'id': equipamento.id,
                        'nome': equipamento.nome,
                        'codigo_interno': equipamento.codigo_interno
                    }
            
            # Adicionar informações do mecânico
            if os.mecanico_id:
                mecanico = Mecanico.query.get(os.mecanico_id)
                if mecanico:
                    os_dict['mecanico_nome'] = mecanico.nome_completo
                    os_dict['mecanico'] = {
                        'id': mecanico.id,
                        'nome_completo': mecanico.nome_completo
                    }
            
            # Adicionar informações do tipo de manutenção
            if os.tipo_manutencao_id:
                tipo_manutencao = TipoManutencao.query.get(os.tipo_manutencao_id)
                if tipo_manutencao:
                    os_dict['tipo_manutencao_nome'] = tipo_manutencao.nome
                    os_dict['tipo_manutencao'] = {
                        'id': tipo_manutencao.id,
                        'nome': tipo_manutencao.nome
                    }
            
            result.append(os_dict)
        
        return jsonify({
            'ordens_servico': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        logger.exception("Erro ao carregar ordens de serviço")
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
@mecanico_or_above_required
def concluir_ordem_servico(current_user, os_id):
    try:
        ordem_servico = OrdemServico.query.get_or_404(os_id)
        data = request.get_json()
        
        if ordem_servico.status == 'concluida':
            return jsonify({'error': 'Ordem de serviço já foi concluída'}), 400
        
        if not data.get('descricao_solucao'):
            return jsonify({'error': 'Descrição da solução é obrigatória'}), 400
        
        # Atualizar dados da OS
        ordem_servico.status = 'concluida'
        ordem_servico.descricao_solucao = data['descricao_solucao']
        ordem_servico.data_encerramento = datetime.utcnow()
        ordem_servico.custo_mao_obra = data.get('custo_mao_obra', 0.0)
        ordem_servico.observacoes = data.get('observacoes')
        ordem_servico.assinatura_responsavel = data.get('assinatura_responsavel')  # Base64 da assinatura
        
        # Calcular tempo de execução
        if ordem_servico.data_inicio:
            tempo_execucao = ordem_servico.data_encerramento - ordem_servico.data_inicio
            ordem_servico.tempo_execucao_horas = tempo_execucao.total_seconds() / 3600
        
        # Processar peças utilizadas
        pecas_utilizadas = data.get('pecas_utilizadas', [])
        custo_total_pecas = 0
        
        for peca_data in pecas_utilizadas:
            peca_id = peca_data.get('peca_id')
            quantidade = peca_data.get('quantidade', 0)
            
            if not peca_id or quantidade <= 0:
                continue
            
            peca = Peca.query.get(peca_id)
            if not peca:
                return jsonify({'error': f'Peça com ID {peca_id} não encontrada'}), 404
            
            # Verificar se há estoque suficiente
            if peca.quantidade < quantidade:
                return jsonify({'error': f'Estoque insuficiente para a peça {peca.nome}. Disponível: {peca.quantidade}'}), 400
            
            # Registrar utilização da peça
            os_peca = OS_Peca(
                ordem_servico_id=ordem_servico.id,
                peca_id=peca_id,
                quantidade_utilizada=quantidade,
                custo_unitario_na_epoca=peca.preco_unitario,
                custo_total=peca.preco_unitario * quantidade if peca.preco_unitario else 0,
                observacoes=peca_data.get('observacoes')
            )
            db.session.add(os_peca)
            
            # Dar baixa no estoque
            peca.quantidade -= quantidade
            custo_total_pecas += os_peca.custo_total or 0
            
            # Registrar movimentação de estoque
            movimentacao = MovimentacaoEstoque(
                peca_id=peca_id,
                usuario_id=current_user.id,
                tipo_movimentacao='saida',
                quantidade=quantidade,
                motivo=f'Utilizada na OS {ordem_servico.numero_os}',
                ordem_servico_id=ordem_servico.id,
                observacoes=f'Baixa automática por conclusão de OS'
            )
            db.session.add(movimentacao)
        
        # Atualizar custos
        ordem_servico.custo_pecas = custo_total_pecas
        ordem_servico.custo_total = ordem_servico.custo_mao_obra + custo_total_pecas
        ordem_servico.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Ordem de serviço concluída com sucesso',
            'ordem_servico': ordem_servico.to_dict()
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
        if 'equipamento_id' in data:
            os.equipamento_id = data['equipamento_id']
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



@ordens_servico_bp.route('/ordens-servico/<int:os_id>/pecas', methods=['GET'])
@token_required
def get_pecas_utilizadas_os(current_user, os_id):
    """Listar peças utilizadas em uma ordem de serviço"""
    try:
        ordem_servico = OrdemServico.query.get_or_404(os_id)
        
        pecas_utilizadas = OS_Peca.query.filter_by(ordem_servico_id=os_id).all()
        
        return jsonify({
            'pecas_utilizadas': [peca.to_dict() for peca in pecas_utilizadas],
            'total': len(pecas_utilizadas),
            'custo_total_pecas': sum(peca.custo_total or 0 for peca in pecas_utilizadas)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/<int:os_id>/alertas', methods=['GET'])
@token_required
def get_alertas_os(current_user, os_id):
    """Obter alertas relacionados a uma ordem de serviço"""
    try:
        ordem_servico = OrdemServico.query.get_or_404(os_id)
        alertas = []
        
        # Verificar se OS está atrasada
        if ordem_servico.data_prevista and ordem_servico.status not in ['concluida', 'cancelada']:
            if datetime.utcnow().date() > ordem_servico.data_prevista:
                dias_atraso = (datetime.utcnow().date() - ordem_servico.data_prevista).days
                alertas.append({
                    'tipo': 'atraso',
                    'severidade': 'alta' if dias_atraso > 7 else 'media',
                    'mensagem': f'OS atrasada há {dias_atraso} dias',
                    'data_alerta': datetime.utcnow().isoformat()
                })
        
        # Verificar se há peças em falta
        if ordem_servico.status == 'aguardando_pecas':
            alertas.append({
                'tipo': 'pecas_falta',
                'severidade': 'media',
                'mensagem': 'OS aguardando peças para execução',
                'data_alerta': datetime.utcnow().isoformat()
            })
        
        # Verificar prioridade crítica
        if ordem_servico.prioridade == 'critica' and ordem_servico.status == 'aberta':
            alertas.append({
                'tipo': 'prioridade_critica',
                'severidade': 'critica',
                'mensagem': 'OS com prioridade crítica não iniciada',
                'data_alerta': datetime.utcnow().isoformat()
            })
        
        return jsonify({
            'alertas': alertas,
            'total_alertas': len(alertas)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ordens_servico_bp.route('/ordens-servico/alertas-mecanico', methods=['GET'])
@token_required
def get_alertas_mecanico(current_user):
    """Obter alertas de OS para o mecânico logado"""
    try:
        # Buscar mecânico associado ao usuário
        from src.models.mecanico import Mecanico
        mecanico = Mecanico.query.filter_by(nome_completo=current_user.nome_completo).first()
        
        if not mecanico:
            return jsonify({
                'alertas': [],
                'total_alertas': 0,
                'message': 'Usuário não é um mecânico cadastrado'
            }), 200
        
        # Buscar OS atribuídas ao mecânico
        ordens_pendentes = OrdemServico.query.filter(
            OrdemServico.mecanico_id == mecanico.id,
            OrdemServico.status.in_(['aberta', 'em_execucao', 'aguardando_pecas'])
        ).all()
        
        alertas = []
        
        for os in ordens_pendentes:
            # OS não iniciadas há mais de 1 dia
            if os.status == 'aberta':
                dias_desde_abertura = (datetime.utcnow() - os.data_abertura).days
                if dias_desde_abertura >= 1:
                    alertas.append({
                        'tipo': 'os_nao_iniciada',
                        'os_id': os.id,
                        'numero_os': os.numero_os,
                        'equipamento': os.equipamento.nome,
                        'prioridade': os.prioridade,
                        'severidade': 'alta' if os.prioridade == 'critica' else 'media',
                        'mensagem': f'OS {os.numero_os} não iniciada há {dias_desde_abertura} dias',
                        'data_alerta': datetime.utcnow().isoformat()
                    })
            
            # OS em execução há muito tempo
            if os.status == 'em_execucao' and os.data_inicio:
                dias_em_execucao = (datetime.utcnow() - os.data_inicio).days
                if dias_em_execucao >= 3:
                    alertas.append({
                        'tipo': 'os_execucao_longa',
                        'os_id': os.id,
                        'numero_os': os.numero_os,
                        'equipamento': os.equipamento.nome,
                        'prioridade': os.prioridade,
                        'severidade': 'media',
                        'mensagem': f'OS {os.numero_os} em execução há {dias_em_execucao} dias',
                        'data_alerta': datetime.utcnow().isoformat()
                    })
        
        return jsonify({
            'alertas': alertas,
            'total_alertas': len(alertas),
            'mecanico': mecanico.nome_completo
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


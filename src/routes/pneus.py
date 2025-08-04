from flask import Blueprint, request, jsonify
from src.db import db
from src.models.pneu import Pneu
from src.models.equipamento import Equipamento
from src.utils.auth import token_required, supervisor_or_admin_required
from datetime import datetime

pneus_bp = Blueprint('pneus', __name__)

@pneus_bp.route('/pneus', methods=['GET'])
@token_required
def get_pneus(current_user):
    try:
        # Filtros opcionais
        status = request.args.get('status')
        marca = request.args.get('marca')
        equipamento_id = request.args.get('equipamento_id')
        search = request.args.get('search')
        
        query = Pneu.query
        
        if status:
            query = query.filter_by(status=status)
        if marca:
            query = query.filter_by(marca=marca)
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        if search:
            query = query.filter(
                Pneu.numero_serie.contains(search) |
                Pneu.marca.contains(search) |
                Pneu.modelo.contains(search)
            )
        
        pneus = query.all()
        
        # Incluir informações do equipamento
        result = []
        for pneu in pneus:
            pneu_dict = pneu.to_dict()
            if pneu.equipamento_id:
                equipamento = Equipamento.query.get(pneu.equipamento_id)
                if equipamento:
                    pneu_dict['equipamento'] = {
                        'nome': equipamento.nome,
                        'codigo_interno': equipamento.codigo_interno
                    }
            result.append(pneu_dict)
        
        return jsonify({
            'pneus': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>', methods=['GET'])
@token_required
def get_pneu(current_user, pneu_id):
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        pneu_dict = pneu.to_dict()
        
        if pneu.equipamento_id:
            equipamento = Equipamento.query.get(pneu.equipamento_id)
            if equipamento:
                pneu_dict['equipamento'] = equipamento.to_dict()
                
        return jsonify(pneu_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus', methods=['POST'])
@token_required
@supervisor_or_admin_required
def create_pneu(current_user):
    try:
        data = request.get_json()
        
        # Validações básicas
        required_fields = ['numero_serie', 'marca', 'modelo', 'medida', 'tipo', 'data_compra']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se número de série já existe
        if Pneu.query.filter_by(numero_serie=data['numero_serie']).first():
            return jsonify({'error': 'Número de série já existe'}), 400
        
        pneu = Pneu(
            numero_serie=data['numero_serie'],
            marca=data['marca'],
            modelo=data['modelo'],
            medida=data['medida'],
            tipo=data['tipo'],
            status=data.get('status', 'estoque'),
            equipamento_id=data.get('equipamento_id'),
            posicao=data.get('posicao'),
            data_compra=datetime.strptime(data['data_compra'], '%Y-%m-%d').date(),
            valor_compra=data.get('valor_compra'),
            data_instalacao=datetime.strptime(data['data_instalacao'], '%Y-%m-%d').date() if data.get('data_instalacao') else None,
            km_instalacao=data.get('km_instalacao'),
            km_atual=data.get('km_atual'),
            pressao_recomendada=data.get('pressao_recomendada'),
            vida_util_estimada=data.get('vida_util_estimada'),
            fornecedor=data.get('fornecedor'),
            observacoes=data.get('observacoes')
        )
        
        db.session.add(pneu)
        db.session.commit()
        
        return jsonify({
            'message': 'Pneu criado com sucesso',
            'pneu': pneu.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>/instalar', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def instalar_pneu(current_user, pneu_id):
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        if pneu.status != 'estoque':
            return jsonify({'error': 'Apenas pneus em estoque podem ser instalados'}), 400
        
        equipamento_id = data.get('equipamento_id')
        posicao = data.get('posicao')
        km_instalacao = data.get('km_instalacao')
        
        if not equipamento_id or not posicao:
            return jsonify({'error': 'Equipamento e posição são obrigatórios'}), 400
        
        # Verificar se equipamento existe
        equipamento = Equipamento.query.get(equipamento_id)
        if not equipamento:
            return jsonify({'error': 'Equipamento não encontrado'}), 404
        
        # Verificar se já existe pneu na posição
        pneu_existente = Pneu.query.filter_by(
            equipamento_id=equipamento_id,
            posicao=posicao,
            status='em_uso'
        ).first()
        
        if pneu_existente:
            return jsonify({'error': f'Já existe um pneu instalado na posição {posicao}'}), 400
        
        pneu.status = 'em_uso'
        pneu.equipamento_id = equipamento_id
        pneu.posicao = posicao
        pneu.data_instalacao = datetime.utcnow().date()
        pneu.km_instalacao = km_instalacao or equipamento.horimetro_atual
        pneu.km_atual = pneu.km_instalacao
        pneu.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Pneu instalado com sucesso',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>/remover', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def remover_pneu(current_user, pneu_id):
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        if pneu.status != 'em_uso':
            return jsonify({'error': 'Apenas pneus em uso podem ser removidos'}), 400
        
        motivo = data.get('motivo', 'estoque')  # estoque, descarte, recapagem
        km_remocao = data.get('km_remocao')
        
        pneu.status = motivo
        pneu.equipamento_id = None
        pneu.posicao = None
        
        if km_remocao:
            pneu.km_atual = km_remocao
        
        pneu.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': f'Pneu removido com sucesso - {motivo}',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>/atualizar-km', methods=['PUT'])
@token_required
def atualizar_km_pneu(current_user, pneu_id):
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        if pneu.status != 'em_uso':
            return jsonify({'error': 'Apenas pneus em uso podem ter KM atualizada'}), 400
        
        km_atual = data.get('km_atual')
        if not km_atual:
            return jsonify({'error': 'KM atual é obrigatória'}), 400
        
        if km_atual < pneu.km_instalacao:
            return jsonify({'error': 'KM atual não pode ser menor que KM de instalação'}), 400
        
        pneu.km_atual = km_atual
        pneu.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'KM atualizada com sucesso',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/relatorio', methods=['GET'])
@token_required
def get_relatorio_pneus(current_user):
    try:
        # Estatísticas gerais
        total_pneus = Pneu.query.count()
        pneus_em_uso = Pneu.query.filter_by(status='em_uso').count()
        pneus_estoque = Pneu.query.filter_by(status='estoque').count()
        pneus_descarte = Pneu.query.filter_by(status='descarte').count()
        
        # Pneus por marca
        marcas = db.session.query(
            Pneu.marca,
            db.func.count(Pneu.id).label('total')
        ).group_by(Pneu.marca).all()
        
        marcas_resumo = [
            {'marca': marca.marca, 'total': marca.total}
            for marca in marcas
        ]
        
        # Pneus próximos ao fim da vida útil (>80%)
        pneus_criticos = []
        pneus_em_uso_list = Pneu.query.filter_by(status='em_uso').all()
        
        for pneu in pneus_em_uso_list:
            if pneu.vida_util_estimada and pneu.km_atual and pneu.km_instalacao:
                km_rodados = pneu.km_atual - pneu.km_instalacao
                percentual = (km_rodados / pneu.vida_util_estimada) * 100
                if percentual > 80:
                    pneu_dict = pneu.to_dict()
                    if pneu.equipamento_id:
                        equipamento = Equipamento.query.get(pneu.equipamento_id)
                        if equipamento:
                            pneu_dict['equipamento'] = {
                                'nome': equipamento.nome,
                                'codigo_interno': equipamento.codigo_interno
                            }
                    pneus_criticos.append(pneu_dict)
        
        # Valor total do estoque de pneus
        valor_total = db.session.query(db.func.sum(Pneu.valor_compra)).filter_by(status='estoque').scalar() or 0
        
        return jsonify({
            'resumo': {
                'total_pneus': total_pneus,
                'pneus_em_uso': pneus_em_uso,
                'pneus_estoque': pneus_estoque,
                'pneus_descarte': pneus_descarte,
                'valor_total_estoque': valor_total
            },
            'marcas': marcas_resumo,
            'pneus_criticos': pneus_criticos
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/equipamento/<int:equipamento_id>', methods=['GET'])
@token_required
def get_pneus_equipamento(current_user, equipamento_id):
    try:
        pneus = Pneu.query.filter_by(equipamento_id=equipamento_id, status='em_uso').all()
        
        return jsonify({
            'pneus': [pneu.to_dict() for pneu in pneus],
            'total': len(pneus)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@pneus_bp.route('/pneus/<int:pneu_id>/tratativa', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def aplicar_tratativa_pneu(current_user, pneu_id):
    """Aplicar tratativa ao pneu (recapagem, descarte, devolução)"""
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        tratativa = data.get('tratativa')  # recapagem, descarte, devolucao_estoque
        
        if not tratativa:
            return jsonify({'error': 'Tipo de tratativa é obrigatório'}), 400
        
        if tratativa == 'recapagem':
            if not data.get('fornecedor_recapagem'):
                return jsonify({'error': 'Fornecedor de recapagem é obrigatório'}), 400
            
            pneu.status = 'recapagem'
            pneu.fornecedor_recapagem = data['fornecedor_recapagem']
            pneu.data_recapagem = datetime.utcnow().date()
            pneu.equipamento_id = None  # Remove do equipamento
            pneu.posicao = None
            
        elif tratativa == 'descarte':
            if not data.get('motivo_descarte'):
                return jsonify({'error': 'Motivo do descarte é obrigatório'}), 400
            
            pneu.status = 'descarte'
            pneu.data_descarte = datetime.utcnow().date()
            pneu.motivo_descarte = data['motivo_descarte']
            pneu.equipamento_id = None  # Remove do equipamento
            pneu.posicao = None
            
        elif tratativa == 'devolucao_estoque':
            pneu.status = 'estoque'
            pneu.equipamento_id = None  # Remove do equipamento
            pneu.posicao = None
            
        else:
            return jsonify({'error': 'Tratativa inválida'}), 400
        
        # Atualizar observações se fornecidas
        if data.get('observacoes'):
            observacao_atual = pneu.observacoes or ''
            nova_observacao = f"{datetime.utcnow().strftime('%d/%m/%Y')}: {tratativa.upper()} - {data['observacoes']}"
            pneu.observacoes = f"{observacao_atual}\n{nova_observacao}" if observacao_atual else nova_observacao
        
        pneu.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': f'Tratativa {tratativa} aplicada com sucesso',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>/retorno-recapagem', methods=['PUT'])
@token_required
@supervisor_or_admin_required
def retorno_recapagem(current_user, pneu_id):
    """Registrar retorno de pneu da recapagem"""
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        if pneu.status != 'recapagem':
            return jsonify({'error': 'Pneu não está em recapagem'}), 400
        
        # Atualizar status e dados
        pneu.status = 'estoque'
        pneu.tipo = 'recapado'  # Marcar como recapado
        pneu.km_instalacao = None  # Resetar KM de instalação
        pneu.km_atual = None
        
        # Atualizar medida de sulco se fornecida
        if data.get('medida_sulco_mm'):
            pneu.medida_sulco_mm = float(data['medida_sulco_mm'])
        
        # Registrar observação
        if data.get('observacoes'):
            observacao_atual = pneu.observacoes or ''
            nova_observacao = f"{datetime.utcnow().strftime('%d/%m/%Y')}: RETORNO RECAPAGEM - {data['observacoes']}"
            pneu.observacoes = f"{observacao_atual}\n{nova_observacao}" if observacao_atual else nova_observacao
        
        pneu.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Retorno de recapagem registrado com sucesso',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/<int:pneu_id>/atualizar-sulco', methods=['PUT'])
@token_required
def atualizar_medida_sulco(current_user, pneu_id):
    """Atualizar medida do sulco do pneu"""
    try:
        pneu = Pneu.query.get_or_404(pneu_id)
        data = request.get_json()
        
        if not data.get('medida_sulco_mm'):
            return jsonify({'error': 'Medida do sulco é obrigatória'}), 400
        
        medida_anterior = pneu.medida_sulco_mm
        pneu.medida_sulco_mm = float(data['medida_sulco_mm'])
        
        # Registrar observação da medição
        observacao_medicao = f"Medição de sulco: {medida_anterior}mm → {pneu.medida_sulco_mm}mm"
        if data.get('observacoes'):
            observacao_medicao += f" - {data['observacoes']}"
        
        observacao_atual = pneu.observacoes or ''
        nova_observacao = f"{datetime.utcnow().strftime('%d/%m/%Y')}: {observacao_medicao}"
        pneu.observacoes = f"{observacao_atual}\n{nova_observacao}" if observacao_atual else nova_observacao
        
        pneu.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Medida do sulco atualizada com sucesso',
            'pneu': pneu.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/relatorio-performance', methods=['GET'])
@token_required
def get_relatorio_performance_pneus(current_user):
    """Gerar relatório de performance de pneus"""
    try:
        # Filtros opcionais
        marca = request.args.get('marca')
        fornecedor = request.args.get('fornecedor')
        equipamento_id = request.args.get('equipamento_id')
        
        query = Pneu.query
        
        if marca:
            query = query.filter_by(marca=marca)
        if fornecedor:
            query = query.filter_by(fornecedor=fornecedor)
        if equipamento_id:
            query = query.filter_by(equipamento_id=equipamento_id)
        
        pneus = query.all()
        
        # Estatísticas gerais
        total_pneus = len(pneus)
        pneus_em_uso = len([p for p in pneus if p.status == 'em_uso'])
        pneus_estoque = len([p for p in pneus if p.status == 'estoque'])
        pneus_descarte = len([p for p in pneus if p.status == 'descarte'])
        pneus_recapagem = len([p for p in pneus if p.status == 'recapagem'])
        
        # Performance por marca
        marcas_performance = {}
        for pneu in pneus:
            if pneu.marca not in marcas_performance:
                marcas_performance[pneu.marca] = {
                    'total': 0,
                    'km_total': 0,
                    'valor_total': 0,
                    'descartados': 0,
                    'recapados': 0
                }
            
            marcas_performance[pneu.marca]['total'] += 1
            marcas_performance[pneu.marca]['valor_total'] += pneu.valor_compra or 0
            
            if pneu.km_atual and pneu.km_instalacao:
                marcas_performance[pneu.marca]['km_total'] += (pneu.km_atual - pneu.km_instalacao)
            
            if pneu.status == 'descarte':
                marcas_performance[pneu.marca]['descartados'] += 1
            elif pneu.tipo == 'recapado':
                marcas_performance[pneu.marca]['recapados'] += 1
        
        # Calcular médias
        for marca in marcas_performance:
            data = marcas_performance[marca]
            if data['total'] > 0:
                data['km_medio'] = data['km_total'] / data['total']
                data['valor_medio'] = data['valor_total'] / data['total']
                data['taxa_descarte'] = (data['descartados'] / data['total']) * 100
                data['taxa_recapagem'] = (data['recapados'] / data['total']) * 100
        
        # Top 5 pneus com mais KM
        pneus_mais_km = sorted(
            [p for p in pneus if p.km_atual and p.km_instalacao],
            key=lambda x: x.km_atual - x.km_instalacao,
            reverse=True
        )[:5]
        
        return jsonify({
            'relatorio': {
                'data_geracao': datetime.utcnow().isoformat(),
                'estatisticas_gerais': {
                    'total_pneus': total_pneus,
                    'pneus_em_uso': pneus_em_uso,
                    'pneus_estoque': pneus_estoque,
                    'pneus_descarte': pneus_descarte,
                    'pneus_recapagem': pneus_recapagem
                },
                'performance_por_marca': marcas_performance,
                'top_pneus_km': [
                    {
                        'numero_serie': p.numero_serie,
                        'numero_fogo': p.numero_fogo,
                        'marca': p.marca,
                        'modelo': p.modelo,
                        'km_rodados': p.km_atual - p.km_instalacao,
                        'equipamento': p.equipamento.nome if p.equipamento else None
                    } for p in pneus_mais_km
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@pneus_bp.route('/pneus/alertas', methods=['GET'])
@token_required
def get_alertas_pneus(current_user):
    """Obter alertas relacionados a pneus"""
    try:
        pneus = Pneu.query.filter_by(status='em_uso').all()
        alertas = []
        
        for pneu in pneus:
            # Alerta por sulco baixo (menos de 3mm)
            if pneu.medida_sulco_mm and pneu.medida_sulco_mm < 3.0:
                alertas.append({
                    'tipo': 'sulco_baixo',
                    'pneu_id': pneu.id,
                    'numero_serie': pneu.numero_serie,
                    'numero_fogo': pneu.numero_fogo,
                    'equipamento': pneu.equipamento.nome if pneu.equipamento else None,
                    'medida_sulco': pneu.medida_sulco_mm,
                    'severidade': 'critica' if pneu.medida_sulco_mm < 1.5 else 'alta',
                    'mensagem': f'Sulco baixo: {pneu.medida_sulco_mm}mm'
                })
            
            # Alerta por vida útil próxima do fim
            if pneu.vida_util_estimada and pneu.km_atual and pneu.km_instalacao:
                km_rodados = pneu.km_atual - pneu.km_instalacao
                percentual_uso = (km_rodados / pneu.vida_util_estimada) * 100
                
                if percentual_uso >= 90:
                    alertas.append({
                        'tipo': 'vida_util_fim',
                        'pneu_id': pneu.id,
                        'numero_serie': pneu.numero_serie,
                        'numero_fogo': pneu.numero_fogo,
                        'equipamento': pneu.equipamento.nome if pneu.equipamento else None,
                        'percentual_uso': round(percentual_uso, 1),
                        'km_rodados': km_rodados,
                        'severidade': 'critica' if percentual_uso >= 95 else 'alta',
                        'mensagem': f'Vida útil: {percentual_uso:.1f}% ({km_rodados:.0f}km)'
                    })
        
        return jsonify({
            'alertas': alertas,
            'total_alertas': len(alertas)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


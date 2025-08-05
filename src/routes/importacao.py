from flask import Blueprint, request, jsonify
from src.db import db
from src.models.peca import Peca
from src.models.grupo_item import GrupoItem
from src.models.estoque_local import EstoqueLocal
from src.utils.auth import token_required, almoxarife_or_above_required
import pandas as pd
import io
from datetime import datetime

importacao_bp = Blueprint('importacao', __name__)

@importacao_bp.route('/importacao/pecas', methods=['POST'])
@token_required
@almoxarife_or_above_required
def importar_pecas(current_user):
    """
    Importar peças de um arquivo CSV/Excel
    Colunas esperadas: id, numero_item, descricao_item, grupo_itens, unidade_de_medida_de_estoque, 
    ultimo_preco_avaliacao, ultimo_preco_compra, estoque_baixo, unidade_medida_estoque, data_registro
    """
    try:
        # Verificar se arquivo foi enviado
        if 'arquivo' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        arquivo = request.files['arquivo']
        if arquivo.filename == '':
            return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
        
        # Verificar extensão do arquivo
        extensao = arquivo.filename.rsplit('.', 1)[1].lower() if '.' in arquivo.filename else ''
        if extensao not in ['csv', 'xlsx', 'xls']:
            return jsonify({'error': 'Formato de arquivo não suportado. Use CSV, XLS ou XLSX'}), 400
        
        # Ler arquivo
        try:
            if extensao == 'csv':
                df = pd.read_csv(io.StringIO(arquivo.read().decode('utf-8')), sep=',', engine='python', on_bad_lines='skip')
            else:
                df = pd.read_excel(arquivo)
        except Exception as e:
            return jsonify({'error': f'Erro ao ler arquivo: {str(e)}'}), 400
        
        # Validar colunas obrigatórias
        colunas_obrigatorias = ['numero_item', 'descricao_item', 'grupo_itens']
        colunas_faltantes = [col for col in colunas_obrigatorias if col not in df.columns]
        if colunas_faltantes:
            return jsonify({'error': f'Colunas obrigatórias faltantes: {", ".join(colunas_faltantes)}'}), 400

        if not any(col in df.columns for col in ['unidade_de_medida_de_estoque', 'unidade_medida_estoque']):
            return jsonify({'error': 'Coluna de unidade de medida não encontrada'}), 400
        
        # Estatísticas de importação
        total_linhas = len(df)
        adicionados = 0
        atualizados = 0
        ignorados = 0
        erros = []
        
        # Obter estoque padrão
        estoque_padrao = EstoqueLocal.query.filter_by(codigo='ALM_CENTRAL').first()
        if not estoque_padrao:
            estoque_padrao = EstoqueLocal.query.first()
        
        # Processar cada linha
        for index, row in df.iterrows():
            try:
                numero_item = str(row['numero_item']).strip()
                descricao_item = str(row['descricao_item']).strip()
                grupo_nome = str(row['grupo_itens']).strip()
                unidade = str(row.get('unidade_de_medida_de_estoque') or row.get('unidade_medida_estoque')).strip()
                
                # Validar dados obrigatórios
                if not numero_item or not descricao_item or not grupo_nome or not unidade:
                    erros.append(f'Linha {index + 2}: Dados obrigatórios faltantes')
                    ignorados += 1
                    continue
                
                # Buscar ou criar grupo de item
                grupo_item = GrupoItem.query.filter_by(nome=grupo_nome).first()
                if not grupo_item:
                    # Criar grupo automaticamente
                    grupo_item = GrupoItem(
                        nome=grupo_nome,
                        codigo=grupo_nome[:10].upper().replace(' ', '_'),
                        descricao=f'Grupo criado automaticamente durante importação'
                    )
                    db.session.add(grupo_item)
                    db.session.flush()  # Para obter o ID
                
                # Verificar se peça já existe
                peca_existente = Peca.query.filter_by(codigo=numero_item).first()
                
                if peca_existente:
                    # Atualizar peça existente
                    peca_existente.nome = descricao_item
                    peca_existente.grupo_item_id = grupo_item.id
                    peca_existente.unidade = unidade
                    
                    # Atualizar campos opcionais se fornecidos
                    if 'ultimo_preco_avaliacao' in row and pd.notna(row['ultimo_preco_avaliacao']):
                        peca_existente.ultimo_preco_avaliacao = float(row['ultimo_preco_avaliacao'])
                    
                    if 'ultimo_preco_compra' in row and pd.notna(row['ultimo_preco_compra']):
                        peca_existente.ultimo_preco_compra = float(row['ultimo_preco_compra'])
                        peca_existente.preco_unitario = float(row['ultimo_preco_compra'])
                    
                    if 'estoque_baixo' in row and pd.notna(row['estoque_baixo']):
                        peca_existente.min_estoque = int(row['estoque_baixo'])
                    
                    if 'data_registro' in row and pd.notna(row['data_registro']):
                        peca_existente.data_registro = pd.to_datetime(row['data_registro'])

                    peca_existente.updated_at = datetime.utcnow()
                    atualizados += 1
                    
                else:
                    # Criar nova peça
                    nova_peca = Peca(
                        codigo=numero_item,
                        nome=descricao_item,
                        grupo_item_id=grupo_item.id,
                        unidade=unidade,
                        quantidade=0,
                        min_estoque=int(row.get('estoque_baixo', 10)) if pd.notna(row.get('estoque_baixo')) else 10,
                        max_estoque=100,
                        estoque_local_id=estoque_padrao.id if estoque_padrao else None
                    )
                    
                    # Definir preços se fornecidos
                    if 'ultimo_preco_avaliacao' in row and pd.notna(row['ultimo_preco_avaliacao']):
                        nova_peca.ultimo_preco_avaliacao = float(row['ultimo_preco_avaliacao'])
                    
                    if 'ultimo_preco_compra' in row and pd.notna(row['ultimo_preco_compra']):
                        nova_peca.ultimo_preco_compra = float(row['ultimo_preco_compra'])
                        nova_peca.preco_unitario = float(row['ultimo_preco_compra'])
                    
                    if 'data_registro' in row and pd.notna(row['data_registro']):
                        nova_peca.data_registro = pd.to_datetime(row['data_registro'])

                    db.session.add(nova_peca)
                    adicionados += 1
                
            except Exception as e:
                erros.append(f'Linha {index + 2}: {str(e)}')
                ignorados += 1
                continue
        
        # Commit das alterações
        db.session.commit()
        
        # Preparar relatório
        relatorio = {
            'total_linhas': total_linhas,
            'adicionados': adicionados,
            'atualizados': atualizados,
            'ignorados': ignorados,
            'erros': erros[:10]  # Limitar a 10 erros para não sobrecarregar a resposta
        }
        
        return jsonify({
            'message': 'Importação concluída',
            'relatorio': relatorio
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro durante importação: {str(e)}'}), 500

@importacao_bp.route('/importacao/template-pecas', methods=['GET'])
@token_required
@almoxarife_or_above_required
def download_template_pecas(current_user):
    """
    Gerar template CSV para importação de peças
    """
    try:
        # Criar DataFrame com template
        template_data = {
            'numero_item': ['FILTRO001', 'OLEO002', 'PECA003'],
            'descricao_item': ['Filtro de óleo hidráulico', 'Óleo motor 15W40', 'Peça exemplo'],
            'grupo_itens': ['Filtros', 'Óleos e Lubrificantes', 'Peças de Motor'],
            'unidade_de_medida_de_estoque': ['UN', 'L', 'UN'],
            'ultimo_preco_avaliacao': [45.50, 25.00, 150.00],
            'ultimo_preco_compra': [42.00, 23.50, 145.00],
            'estoque_baixo': [5, 10, 2],
            'data_registro': ['2024-01-01', '2024-01-01', '2024-01-01']
        }
        
        df = pd.DataFrame(template_data)
        
        # Converter para CSV
        output = io.StringIO()
        df.to_csv(output, index=False, encoding='utf-8')
        csv_content = output.getvalue()
        
        return jsonify({
            'template_csv': csv_content,
            'filename': 'template_importacao_pecas.csv'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar template: {str(e)}'}), 500

@importacao_bp.route('/importacao/grupos-disponiveis', methods=['GET'])
@token_required
@almoxarife_or_above_required
def get_grupos_disponiveis(current_user):
    """
    Listar grupos de itens disponíveis para importação
    """
    try:
        grupos = GrupoItem.query.filter_by(ativo=True).order_by(GrupoItem.nome).all()
        
        return jsonify({
            'grupos': [{'nome': grupo.nome, 'codigo': grupo.codigo} for grupo in grupos]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


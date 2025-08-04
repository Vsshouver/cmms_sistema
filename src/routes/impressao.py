from flask import Blueprint, request, jsonify, make_response
from src.db import db
from src.models.ordem_servico import OrdemServico
from src.models.equipamento import Equipamento
from src.models.mecanico import Mecanico
from src.models.os_peca import OS_Peca
from src.utils.auth import token_required
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
import base64
from datetime import datetime

impressao_bp = Blueprint('impressao', __name__)

@impressao_bp.route('/ordens-servico/<int:os_id>/imprimir', methods=['GET'])
@token_required
def imprimir_ordem_servico(current_user, os_id):
    """
    Gerar PDF da Ordem de Serviço para impressão
    """
    try:
        # Buscar ordem de serviço
        ordem_servico = OrdemServico.query.get_or_404(os_id)
        
        # Criar buffer para o PDF
        buffer = io.BytesIO()
        
        # Criar documento PDF
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Estilos
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        
        # Conteúdo do PDF
        story = []
        
        # Cabeçalho
        story.append(Paragraph("ORDEM DE SERVIÇO DE MANUTENÇÃO", title_style))
        story.append(Spacer(1, 12))
        
        # Informações básicas da OS
        info_basica = [
            ['Número da OS:', ordem_servico.numero_os, 'Data de Abertura:', ordem_servico.data_abertura.strftime('%d/%m/%Y %H:%M') if ordem_servico.data_abertura else ''],
            ['Status:', ordem_servico.status.upper(), 'Prioridade:', ordem_servico.prioridade.upper()],
            ['Tipo:', ordem_servico.tipo_manutencao_obj.nome if ordem_servico.tipo_manutencao_obj else ordem_servico.tipo, '', '', '']
        ]
        
        table_info = Table(info_basica, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
        table_info.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table_info)
        story.append(Spacer(1, 20))
        
        # Informações do Equipamento
        story.append(Paragraph("EQUIPAMENTO", heading_style))
        
        equipamento = ordem_servico.equipamento
        info_equipamento = [
            ['Código:', equipamento.codigo_interno, 'Nome:', equipamento.nome],
            ['Tipo:', equipamento.tipo_equipamento_obj.nome if equipamento.tipo_equipamento_obj else equipamento.tipo, 'Modelo:', equipamento.modelo],
            ['Fabricante:', equipamento.fabricante, 'Nº Série:', equipamento.numero_serie],
            ['Localização:', equipamento.localizacao, 'Horímetro:', f"{equipamento.horimetro_atual}h" if equipamento.horimetro_atual else 'N/A']
        ]
        
        table_equipamento = Table(info_equipamento, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
        table_equipamento.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table_equipamento)
        story.append(Spacer(1, 20))
        
        # Informações do Mecânico (se atribuído)
        if ordem_servico.mecanico:
            story.append(Paragraph("MECÂNICO RESPONSÁVEL", heading_style))
            
            mecanico = ordem_servico.mecanico
            info_mecanico = [
                ['Nome:', mecanico.nome_completo, 'CPF:', mecanico.cpf],
                ['Especialidade:', mecanico.especialidade, 'Nível:', mecanico.nivel_experiencia]
            ]
            
            table_mecanico = Table(info_mecanico, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
            table_mecanico.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table_mecanico)
            story.append(Spacer(1, 20))
        
        # Descrição do Problema
        story.append(Paragraph("DESCRIÇÃO DO PROBLEMA", heading_style))
        problema_text = ordem_servico.descricao_problema or "Não informado"
        story.append(Paragraph(problema_text, normal_style))
        story.append(Spacer(1, 15))
        
        # Peças Utilizadas (se houver)
        pecas_utilizadas = OS_Peca.query.filter_by(ordem_servico_id=ordem_servico.id).all()
        if pecas_utilizadas:
            story.append(Paragraph("PEÇAS UTILIZADAS", heading_style))
            
            pecas_data = [['Código', 'Descrição', 'Quantidade', 'Valor Unit.', 'Total']]
            total_pecas = 0
            
            for os_peca in pecas_utilizadas:
                peca = os_peca.peca
                valor_unit = os_peca.custo_unitario_na_epoca or peca.preco_unitario or 0
                total_item = valor_unit * os_peca.quantidade_utilizada
                total_pecas += total_item
                
                pecas_data.append([
                    peca.codigo,
                    peca.nome[:30] + '...' if len(peca.nome) > 30 else peca.nome,
                    str(os_peca.quantidade_utilizada),
                    f'R$ {valor_unit:.2f}',
                    f'R$ {total_item:.2f}'
                ])
            
            # Linha de total
            pecas_data.append(['', '', '', 'TOTAL:', f'R$ {total_pecas:.2f}'])
            
            table_pecas = Table(pecas_data, colWidths=[1*inch, 2.5*inch, 0.8*inch, 1*inch, 1*inch])
            table_pecas.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table_pecas)
            story.append(Spacer(1, 20))
        
        # Solução (se concluída)
        if ordem_servico.descricao_solucao:
            story.append(Paragraph("SOLUÇÃO EXECUTADA", heading_style))
            solucao_text = ordem_servico.descricao_solucao
            story.append(Paragraph(solucao_text, normal_style))
            story.append(Spacer(1, 15))
        
        # Informações de Execução
        if ordem_servico.data_inicio or ordem_servico.data_encerramento:
            story.append(Paragraph("INFORMAÇÕES DE EXECUÇÃO", heading_style))
            
            info_execucao = []
            if ordem_servico.data_inicio:
                info_execucao.append(['Data de Início:', ordem_servico.data_inicio.strftime('%d/%m/%Y %H:%M'), '', ''])
            if ordem_servico.data_encerramento:
                info_execucao.append(['Data de Encerramento:', ordem_servico.data_encerramento.strftime('%d/%m/%Y %H:%M'), '', ''])
            if ordem_servico.tempo_execucao_horas:
                info_execucao.append(['Tempo de Execução:', f"{ordem_servico.tempo_execucao_horas}h", '', ''])
            
            if info_execucao:
                table_execucao = Table(info_execucao, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
                table_execucao.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(table_execucao)
                story.append(Spacer(1, 20))
        
        # Custos
        story.append(Paragraph("CUSTOS", heading_style))
        
        custos_data = [
            ['Mão de Obra:', f"R$ {ordem_servico.custo_mao_obra:.2f}"],
            ['Peças:', f"R$ {ordem_servico.custo_pecas:.2f}"],
            ['TOTAL:', f"R$ {ordem_servico.custo_total:.2f}"]
        ]
        
        table_custos = Table(custos_data, colWidths=[2*inch, 2*inch])
        table_custos.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('BACKGROUND', (0, -1), (-1, -1), colors.grey),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table_custos)
        story.append(Spacer(1, 30))
        
        # Assinatura
        story.append(Paragraph("ASSINATURAS", heading_style))
        
        # Se há assinatura digital, incluir
        if ordem_servico.assinatura_responsavel:
            story.append(Paragraph("Responsável pela Execução:", normal_style))
            story.append(Spacer(1, 10))
            
            # Decodificar assinatura base64 e incluir como imagem
            try:
                assinatura_data = ordem_servico.assinatura_responsavel.split(',')[1]  # Remove data:image/png;base64,
                assinatura_bytes = base64.b64decode(assinatura_data)
                assinatura_buffer = io.BytesIO(assinatura_bytes)
                
                # Adicionar imagem da assinatura
                story.append(Image(assinatura_buffer, width=2*inch, height=1*inch))
            except:
                story.append(Paragraph("Assinatura digital presente", normal_style))
            
            story.append(Spacer(1, 10))
        else:
            # Campos para assinatura manual
            assinatura_data = [
                ['Responsável pela Execução:', ''],
                ['', ''],
                ['Nome:', ''],
                ['Data:', ''],
                ['Assinatura:', '']
            ]
            
            table_assinatura = Table(assinatura_data, colWidths=[2*inch, 3*inch])
            table_assinatura.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('LINEBELOW', (1, 2), (1, 2), 1, colors.black),  # Linha para nome
                ('LINEBELOW', (1, 3), (1, 3), 1, colors.black),  # Linha para data
                ('LINEBELOW', (1, 4), (1, 4), 1, colors.black),  # Linha para assinatura
            ]))
            
            story.append(table_assinatura)
        
        # Rodapé
        story.append(Spacer(1, 30))
        rodape_style = ParagraphStyle(
            'Rodape',
            parent=styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        story.append(Paragraph(f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')} - Sistema CMMS", rodape_style))
        
        # Construir PDF
        doc.build(story)
        
        # Preparar resposta
        buffer.seek(0)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        response = make_response(pdf_data)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'inline; filename="OS_{ordem_servico.numero_os}.pdf"'
        
        return response
        
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar PDF: {str(e)}'}), 500


#!/usr/bin/env python3
"""
Script de inicialização do banco de dados CMMS.
Cria tabelas e dados iniciais necessários.
"""

import os
import sys

# Adicionar o diretório raiz ao path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask
from src.models.usuario import db, Usuario
from src.models.equipamento import Equipamento
from src.models.mecanico import Mecanico
from src.models.ordem_servico import OrdemServico
from src.models.peca import Peca
from src.models.pneu import Pneu
from src.models.tipo_equipamento import TipoEquipamento
from src.models.tipo_manutencao import TipoManutencao
from src.models.grupo_item import GrupoItem
from src.models.estoque_local import EstoqueLocal
from src.models.movimentacao_estoque import MovimentacaoEstoque
from src.models.os_peca import OS_Peca
from src.models.analise_oleo import AnaliseOleo

from datetime import datetime, date, timedelta
from sqlalchemy import text, inspect

def create_app():
    """Criar aplicação Flask para inicialização."""
    app = Flask(__name__)

    # Chave secreta configurável via variável de ambiente
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key')
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Configurar banco de dados PostgreSQL
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL não configurada. Defina a variável de ambiente com a URL do PostgreSQL.")

    print(f"🐘 Conectando ao PostgreSQL: {database_url[:50]}...")
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url.replace("postgresql://", "postgresql+psycopg2://")
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

    return app

def ensure_schema():
    """Garantir que as colunas necessárias existam no banco."""
    engine = db.engine
    inspector = inspect(engine)

    # Verificar coluna tipo_equipamento_id em equipamentos
    cols = [c['name'] for c in inspector.get_columns('equipamentos')]
    if 'tipo_equipamento_id' not in cols:
        print("⚙️  Adicionando coluna 'tipo_equipamento_id' em equipamentos...")
        with engine.connect() as conn:
            conn.execute(text(
                'ALTER TABLE equipamentos ADD COLUMN tipo_equipamento_id INTEGER'))
            conn.commit()

    # Verificar coluna tipo_manutencao_id em ordens_servico
    cols = [c['name'] for c in inspector.get_columns('ordens_servico')]
    if 'tipo_manutencao_id' not in cols:
        print("⚙️  Adicionando coluna 'tipo_manutencao_id' em ordens_servico...")
        with engine.connect() as conn:
            conn.execute(text(
                'ALTER TABLE ordens_servico ADD COLUMN tipo_manutencao_id INTEGER'))
            conn.commit()

    # Verificar colunas grupo_item_id e estoque_local_id em pecas
    cols = [c['name'] for c in inspector.get_columns('pecas')]
    if 'grupo_item_id' not in cols:
        print("⚙️  Adicionando coluna 'grupo_item_id' em pecas...")
        with engine.connect() as conn:
            conn.execute(text(
                'ALTER TABLE pecas ADD COLUMN grupo_item_id INTEGER'))
            conn.commit()
    if 'estoque_local_id' not in cols:
        print("⚙️  Adicionando coluna 'estoque_local_id' em pecas...")
        with engine.connect() as conn:
            conn.execute(text(
                'ALTER TABLE pecas ADD COLUMN estoque_local_id INTEGER'))
            conn.commit()

def criar_dados_exemplo():
    """Função para criar dados de exemplo no banco"""
    print("🔄 Iniciando criação de dados de exemplo...")
    
    try:
        # Verificar se já existem dados
        if Usuario.query.count() == 0:
            print("📝 Criando usuários...")
            
            # Criar usuários com diferentes níveis de acesso
            usuarios = [
                {
                    'username': 'admin',
                    'email': 'admin@mineracao.com',
                    'nome_completo': 'Administrador do Sistema',
                    'cargo': 'Administrador',
                    'nivel_acesso': 'ADM',
                    'password': 'admin123'
                },
                {
                    'username': 'supervisor',
                    'email': 'supervisor@mineracao.com',
                    'nome_completo': 'João Silva Supervisor',
                    'cargo': 'Supervisor de Manutenção',
                    'nivel_acesso': 'Supervisor',
                    'password': 'super123'
                },
                {
                    'username': 'pcm',
                    'email': 'pcm@mineracao.com',
                    'nome_completo': 'Maria Santos PCM',
                    'cargo': 'Planejador de Manutenção',
                    'nivel_acesso': 'PCM',
                    'password': 'pcm123'
                },
                {
                    'username': 'almoxarife',
                    'email': 'almoxarife@mineracao.com',
                    'nome_completo': 'Carlos Oliveira',
                    'cargo': 'Almoxarife',
                    'nivel_acesso': 'Almoxarife',
                    'password': 'almox123'
                },
                {
                    'username': 'mecanico',
                    'email': 'mecanico@mineracao.com',
                    'nome_completo': 'Pedro Santos',
                    'cargo': 'Mecânico Sênior',
                    'nivel_acesso': 'Mecanico',
                    'password': 'mec123'
                }
            ]
            
            for user_data in usuarios:
                user = Usuario(
                    username=user_data['username'],
                    email=user_data['email'],
                    nome_completo=user_data['nome_completo'],
                    cargo=user_data['cargo'],
                    nivel_acesso=user_data['nivel_acesso']
                )
                user.set_password(user_data['password'])
                db.session.add(user)
            
            print("🔧 Criando equipamentos...")
            # Criar equipamentos
            equipamentos = [
                Equipamento(
                    codigo_interno='ESC-001',
                    nome='Escavadeira Hidráulica CAT 320',
                    tipo='Escavadeira',
                    modelo='320D',
                    fabricante='Caterpillar',
                    numero_serie='CAT320D001',
                    status='ativo',
                    localizacao='Frente de Lavra A',
                    horimetro_atual=2450.5,
                    data_aquisicao=date(2020, 3, 15),
                    valor_aquisicao=850000.00
                ),
                Equipamento(
                    codigo_interno='CAM-001',
                    nome='Caminhão Basculante Volvo FH',
                    tipo='Caminhão',
                    modelo='FH 540',
                    fabricante='Volvo',
                    numero_serie='VOLVOFH001',
                    status='manutencao',
                    localizacao='Oficina Principal',
                    horimetro_atual=15200.0,
                    data_aquisicao=date(2019, 8, 22),
                    valor_aquisicao=450000.00
                ),
                Equipamento(
                    codigo_interno='TRA-001',
                    nome='Trator de Esteiras Komatsu D85',
                    tipo='Trator',
                    modelo='D85ESS-2A',
                    fabricante='Komatsu',
                    numero_serie='KOMD85001',
                    status='ativo',
                    localizacao='Frente de Lavra B',
                    horimetro_atual=8750.25,
                    data_aquisicao=date(2021, 1, 10),
                    valor_aquisicao=720000.00
                )
            ]
            
            for eq in equipamentos:
                db.session.add(eq)
            
            print("👷 Criando mecânicos...")
            # Criar mecânicos
            mecanicos = [
                Mecanico(
                    nome_completo='João Silva Santos',
                    cpf='123.456.789-01',
                    telefone='(11) 98765-4321',
                    email='joao.silva@mineracao.com',
                    especialidade='Mecânica Pesada',
                    nivel_experiencia='senior',
                    salario=8500.00,
                    data_admissao=date(2018, 5, 15),
                    status='ativo'
                ),
                Mecanico(
                    nome_completo='Maria Oliveira Costa',
                    cpf='987.654.321-02',
                    telefone='(11) 91234-5678',
                    email='maria.oliveira@mineracao.com',
                    especialidade='Elétrica e Eletrônica',
                    nivel_experiencia='pleno',
                    salario=6800.00,
                    data_admissao=date(2019, 9, 20),
                    status='ativo'
                ),
                Mecanico(
                    nome_completo='Pedro Santos Lima',
                    cpf='456.789.123-03',
                    telefone='(11) 99876-5432',
                    email='pedro.santos@mineracao.com',
                    especialidade='Hidráulica',
                    nivel_experiencia='senior',
                    salario=9200.00,
                    data_admissao=date(2017, 2, 8),
                    status='ativo'
                )
            ]
            
            for mec in mecanicos:
                db.session.add(mec)
            
            print("📦 Criando peças...")
            # Criar peças
            pecas = [
                Peca(
                    codigo='FO-CAT-320',
                    nome='Filtro de Óleo Motor CAT 320',
                    categoria='Filtros',
                    descricao='Filtro de óleo para motor Caterpillar 320D',
                    unidade='unidades',
                    quantidade=25,
                    min_estoque=10,
                    max_estoque=50,
                    preco_unitario=85.50,
                    localizacao='Almoxarifado A - Prateleira 15',
                    fornecedor='Caterpillar Brasil'
                ),
                Peca(
                    codigo='PF-VOL-FH',
                    nome='Pastilha de Freio Volvo FH',
                    categoria='Freios',
                    descricao='Jogo de pastilhas de freio dianteiro Volvo FH',
                    unidade='jogos',
                    quantidade=8,
                    min_estoque=5,
                    max_estoque=20,
                    preco_unitario=320.00,
                    localizacao='Almoxarifado B - Setor Freios',
                    fornecedor='Volvo Peças'
                ),
                Peca(
                    codigo='OH-KOM-D85',
                    nome='Óleo Hidráulico Komatsu D85',
                    categoria='Fluidos',
                    descricao='Óleo hidráulico específico para Komatsu D85',
                    unidade='litros',
                    quantidade=150,
                    min_estoque=50,
                    max_estoque=300,
                    preco_unitario=28.75,
                    localizacao='Almoxarifado A - Tanque 3',
                    fornecedor='Komatsu Brasil'
                )
            ]
            
            for peca in pecas:
                db.session.add(peca)
            
            print("🛞 Criando pneus...")
            # Criar pneus
            pneus = [
                Pneu(
                    numero_serie='PN001-2024',
                    marca='Michelin',
                    modelo='XDR3',
                    medida='385/65R22.5',
                    tipo='novo',
                    status='em_uso',
                    equipamento_id=2,  # Caminhão
                    posicao='dianteiro_esquerdo',
                    data_compra=date(2024, 1, 15),
                    valor_compra=2500.00,
                    data_instalacao=date(2024, 1, 20),
                    km_instalacao=15000.0,
                    km_atual=15200.0,
                    pressao_recomendada=120.0,
                    vida_util_estimada=80000.0,
                    fornecedor='Michelin Brasil'
                ),
                Pneu(
                    numero_serie='PN002-2024',
                    marca='Bridgestone',
                    modelo='R268',
                    medida='385/65R22.5',
                    tipo='novo',
                    status='estoque',
                    data_compra=date(2024, 2, 10),
                    valor_compra=2300.00,
                    pressao_recomendada=120.0,
                    vida_util_estimada=75000.0,
                    fornecedor='Bridgestone Brasil'
                )
            ]
            
            for pneu in pneus:
                db.session.add(pneu)
            
            # Commit para salvar dados básicos
            db.session.commit()
            print("💾 Dados básicos salvos. Criando ordens de serviço...")
            
            # Criar ordens de serviço (após commit para ter IDs)
            ordens_servico = [
                OrdemServico(
                    numero_os='OS-2024-001',
                    equipamento_id=1,  # ESC-001
                    mecanico_id=1,     # João Silva
                    tipo='preventiva',
                    prioridade='media',
                    status='concluida',
                    descricao_problema='Manutenção preventiva de 250 horas - troca de filtros e óleos',
                    descricao_solucao='Realizada troca de filtro de óleo, filtro de ar, filtro hidráulico e óleo do motor.',
                    data_abertura=datetime.now() - timedelta(days=15),
                    data_inicio=datetime.now() - timedelta(days=14),
                    data_prevista=datetime.now() - timedelta(days=13),
                    data_encerramento=datetime.now() - timedelta(days=13),
                    tempo_execucao_horas=6.5,
                    custo_mao_obra=520.00,
                    custo_pecas=340.00,
                    custo_total=860.00
                ),
                OrdemServico(
                    numero_os='OS-2024-002',
                    equipamento_id=2,  # CAM-001
                    mecanico_id=2,     # Maria Oliveira
                    tipo='corretiva',
                    prioridade='alta',
                    status='em_execucao',
                    descricao_problema='Falha no sistema elétrico - luzes de sinalização não funcionam',
                    data_abertura=datetime.now() - timedelta(days=3),
                    data_inicio=datetime.now() - timedelta(days=2),
                    data_prevista=datetime.now() + timedelta(days=1)
                ),
                OrdemServico(
                    numero_os='OS-2024-003',
                    equipamento_id=3,  # TRA-001
                    mecanico_id=3,     # Pedro Santos
                    tipo='preventiva',
                    prioridade='baixa',
                    status='aberta',
                    descricao_problema='Manutenção preventiva de 500 horas - revisão geral do sistema hidráulico',
                    data_abertura=datetime.now() - timedelta(days=1),
                    data_prevista=datetime.now() + timedelta(days=7)
                )
            ]
            
            for os in ordens_servico:
                db.session.add(os)
            
            # Commit final
            db.session.commit()
            print("✅ Dados de exemplo criados com sucesso!")
            print(f"✅ Usuários criados: {Usuario.query.count()}")
            print(f"✅ Equipamentos criados: {Equipamento.query.count()}")
            print(f"✅ Mecânicos criados: {Mecanico.query.count()}")
            print(f"✅ Peças criadas: {Peca.query.count()}")
            print(f"✅ Pneus criados: {Pneu.query.count()}")
            print(f"✅ Ordens de serviço criadas: {OrdemServico.query.count()}")
        else:
            print("✅ Dados já existem no banco de dados")
            print(f"✅ Usuários: {Usuario.query.count()}")
            print(f"✅ Equipamentos: {Equipamento.query.count()}")
            print(f"✅ Mecânicos: {Mecanico.query.count()}")
            print(f"✅ Peças: {Peca.query.count()}")
            print(f"✅ Pneus: {Pneu.query.count()}")
            print(f"✅ Ordens de serviço: {OrdemServico.query.count()}")
            
    except Exception as e:
        print(f"❌ Erro ao criar dados de exemplo: {str(e)}")
        db.session.rollback()
        raise e

def main():
    """Função principal de inicialização."""
    
    print("=" * 60)
    print("🚀 INICIALIZANDO SISTEMA CMMS - MINERAÇÃO")
    print("=" * 60)
    
    try:
        # Criar aplicação Flask
        app = create_app()
        
        with app.app_context():
            print("🔧 Criando/verificando estrutura do banco de dados...")
            db.create_all()
            ensure_schema()

            print("📊 Populando com dados de exemplo...")
            # Usar a função mais completa para garantir compatibilidade
            criar_dados_exemplo_completos()
            
            print("\n" + "=" * 60)
            print("✅ SISTEMA INICIALIZADO COM SUCESSO!")
            print("🌐 O sistema está pronto para uso.")
            print("\n📋 CREDENCIAIS DE ACESSO:")
            print("👤 Admin: admin@mineracao.com / admin123")
            print("👤 Supervisor: supervisor@mineracao.com / super123")
            print("👤 PCM: pcm@mineracao.com / pcm123")
            print("👤 Almoxarife: almoxarife@mineracao.com / almox123")
            print("👤 Mecânico: mecanico@mineracao.com / mec123")
            print("=" * 60)
            
            return True
            
    except Exception as e:
        print(f"\n❌ ERRO NA INICIALIZAÇÃO: {str(e)}")
        print("🔍 Verifique as configurações e tente novamente.")
        print("=" * 60)
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)


def criar_tipos_equipamento():
    """Criar tipos de equipamento padrão"""
    if TipoEquipamento.query.count() == 0:
        print("🏗️ Criando tipos de equipamento...")
        tipos = [
            {'nome': 'Escavadeira', 'descricao': 'Equipamentos de escavação hidráulica'},
            {'nome': 'Caminhão', 'descricao': 'Veículos de transporte de carga'},
            {'nome': 'Trator', 'descricao': 'Tratores e equipamentos de terraplanagem'},
            {'nome': 'Carregadeira', 'descricao': 'Equipamentos de carregamento'},
            {'nome': 'Perfuratriz', 'descricao': 'Equipamentos de perfuração'},
            {'nome': 'Britador', 'descricao': 'Equipamentos de britagem'},
            {'nome': 'Compressor', 'descricao': 'Compressores de ar'},
            {'nome': 'Gerador', 'descricao': 'Geradores de energia elétrica'}
        ]
        
        for tipo_data in tipos:
            tipo = TipoEquipamento(
                nome=tipo_data['nome'],
                descricao=tipo_data['descricao']
            )
            db.session.add(tipo)

def criar_tipos_manutencao():
    """Criar tipos de manutenção padrão"""
    if TipoManutencao.query.count() == 0:
        print("🔧 Criando tipos de manutenção...")
        tipos = [
            {'nome': 'Preventiva', 'codigo': 'PREV', 'descricao': 'Manutenção preventiva programada', 'cor_identificacao': '#10b981'},
            {'nome': 'Corretiva Mecânica', 'codigo': 'CORR_MEC', 'descricao': 'Correção de problemas mecânicos', 'cor_identificacao': '#ef4444'},
            {'nome': 'Corretiva Elétrica', 'codigo': 'CORR_ELE', 'descricao': 'Correção de problemas elétricos', 'cor_identificacao': '#f59e0b'},
            {'nome': 'Caldeiraria', 'codigo': 'CALD', 'descricao': 'Serviços de soldagem e caldeiraria', 'cor_identificacao': '#8b5cf6'},
            {'nome': 'Inspeção', 'codigo': 'INSP', 'descricao': 'Inspeções técnicas e de segurança', 'cor_identificacao': '#3b82f6'}
        ]
        
        for tipo_data in tipos:
            tipo = TipoManutencao(
                nome=tipo_data['nome'],
                codigo=tipo_data['codigo'],
                descricao=tipo_data['descricao'],
                cor_identificacao=tipo_data['cor_identificacao']
            )
            db.session.add(tipo)

def criar_grupos_item():
    """Criar grupos de item padrão"""
    if GrupoItem.query.count() == 0:
        print("📦 Criando grupos de item...")
        grupos = [
            {'nome': 'Filtros', 'codigo': 'FIL', 'descricao': 'Filtros de óleo, ar, combustível'},
            {'nome': 'Óleos e Lubrificantes', 'codigo': 'OLE', 'descricao': 'Óleos hidráulicos, motor, transmissão'},
            {'nome': 'Peças de Motor', 'codigo': 'MOT', 'descricao': 'Componentes do motor'},
            {'nome': 'Sistema Hidráulico', 'codigo': 'HID', 'descricao': 'Componentes do sistema hidráulico'},
            {'nome': 'Pneus e Rodas', 'codigo': 'PNE', 'descricao': 'Pneus, câmaras e componentes de rodas'},
            {'nome': 'Peças Elétricas', 'codigo': 'ELE', 'descricao': 'Componentes elétricos e eletrônicos'},
            {'nome': 'Ferramentas', 'codigo': 'FER', 'descricao': 'Ferramentas e equipamentos'},
            {'nome': 'Consumíveis', 'codigo': 'CON', 'descricao': 'Materiais de consumo geral'}
        ]
        
        for grupo_data in grupos:
            grupo = GrupoItem(
                nome=grupo_data['nome'],
                codigo=grupo_data['codigo'],
                descricao=grupo_data['descricao']
            )
            db.session.add(grupo)

def criar_estoques_locais():
    """Criar estoques locais padrão"""
    if EstoqueLocal.query.count() == 0:
        print("🏪 Criando estoques locais...")
        estoques = [
            {
                'nome': 'Almoxarifado Central',
                'codigo': 'ALM_CENTRAL',
                'localizacao': 'Prédio Administrativo - Térreo',
                'prateleira': 'A-Z',
                'coluna': '1-50',
                'setor': 'Manutenção',
                'responsavel': 'Carlos Oliveira'
            },
            {
                'nome': 'Estoque de Campo',
                'codigo': 'EST_CAMPO',
                'localizacao': 'Oficina de Campo',
                'prateleira': 'A-J',
                'coluna': '1-20',
                'setor': 'Operações',
                'responsavel': 'João Silva'
            },
            {
                'nome': 'Estoque de Pneus',
                'codigo': 'EST_PNEUS',
                'localizacao': 'Galpão de Pneus',
                'setor': 'Manutenção',
                'responsavel': 'Pedro Santos'
            }
        ]
        
        for estoque_data in estoques:
            estoque = EstoqueLocal(
                nome=estoque_data['nome'],
                codigo=estoque_data['codigo'],
                localizacao=estoque_data['localizacao'],
                prateleira=estoque_data.get('prateleira'),
                coluna=estoque_data.get('coluna'),
                setor=estoque_data['setor'],
                responsavel=estoque_data['responsavel']
            )
            db.session.add(estoque)

def atualizar_dados_existentes():
    """Atualizar dados existentes com os novos campos"""
    print("🔄 Atualizando dados existentes...")
    
    # Atualizar equipamentos com tipo_equipamento_id
    equipamentos = Equipamento.query.filter(Equipamento.tipo_equipamento_id.is_(None)).all()
    if equipamentos:
        print(f"📝 Atualizando {len(equipamentos)} equipamentos...")
        for equipamento in equipamentos:
            # Mapear tipo antigo para novo
            tipo_map = {
                'Escavadeira': 'Escavadeira',
                'Caminhão': 'Caminhão',
                'Trator': 'Trator',
                'Carregadeira': 'Carregadeira'
            }
            
            tipo_nome = tipo_map.get(equipamento.tipo, 'Escavadeira')
            tipo_equipamento = TipoEquipamento.query.filter_by(nome=tipo_nome).first()
            if tipo_equipamento:
                equipamento.tipo_equipamento_id = tipo_equipamento.id
    
    # Atualizar ordens de serviço com tipo_manutencao_id
    ordens = OrdemServico.query.filter(OrdemServico.tipo_manutencao_id.is_(None)).all()
    if ordens:
        print(f"📝 Atualizando {len(ordens)} ordens de serviço...")
        for ordem in ordens:
            # Mapear tipo antigo para novo
            tipo_map = {
                'preventiva': 'Preventiva',
                'corretiva': 'Corretiva Mecânica'
            }
            
            tipo_nome = tipo_map.get(ordem.tipo, 'Corretiva Mecânica')
            tipo_manutencao = TipoManutencao.query.filter_by(nome=tipo_nome).first()
            if tipo_manutencao:
                ordem.tipo_manutencao_id = tipo_manutencao.id
    
    # Atualizar peças com grupo_item_id
    pecas = Peca.query.filter(Peca.grupo_item_id.is_(None)).all()
    if pecas:
        print(f"📝 Atualizando {len(pecas)} peças...")
        almoxarifado_central = EstoqueLocal.query.filter_by(codigo='ALM_CENTRAL').first()
        
        for peca in pecas:
            # Mapear categoria antiga para grupo
            categoria_map = {
                'Filtros': 'Filtros',
                'Óleos': 'Óleos e Lubrificantes',
                'Peças': 'Peças de Motor',
                'Ferramentas': 'Ferramentas'
            }
            
            grupo_nome = categoria_map.get(peca.categoria, 'Consumíveis')
            grupo_item = GrupoItem.query.filter_by(nome=grupo_nome).first()
            if grupo_item:
                peca.grupo_item_id = grupo_item.id
            
            # Definir estoque local padrão
            if not peca.estoque_local_id and almoxarifado_central:
                peca.estoque_local_id = almoxarifado_central.id

# Atualizar a função principal
def criar_dados_exemplo_completos():
    """Função principal para criar todos os dados de exemplo"""
    print("🔄 Iniciando criação completa de dados de exemplo...")
    
    try:
        # Criar tipos primeiro (dependências)
        criar_tipos_equipamento()
        criar_tipos_manutencao()
        criar_grupos_item()
        criar_estoques_locais()
        
        # Commit das dependências
        db.session.commit()
        
        # Atualizar dados existentes
        atualizar_dados_existentes()
        
        # Commit final
        db.session.commit()
        
        print("✅ Dados de exemplo criados/atualizados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados de exemplo: {str(e)}")
        db.session.rollback()
        raise

# Manter compatibilidade com a função original
def criar_dados_exemplo():
    """Função de compatibilidade - chama a função completa"""
    # Garante que colunas novas existam mesmo quando chamado fora do main()
    ensure_schema()
    return criar_dados_exemplo_completos()


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

from datetime import datetime, date, timedelta

def create_app():
    """Criar aplicação Flask para inicialização."""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
    
    # Configurar banco de dados PostgreSQL
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Railway PostgreSQL
        print(f"🐘 Conectando ao PostgreSQL: {database_url[:50]}...")
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Fallback para SQLite local (desenvolvimento)
        print("🗄️ Usando SQLite local para desenvolvimento...")
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(current_dir, 'src', 'database', 'app.db')}"
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    return app

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
            
            print("📊 Populando com dados de exemplo...")
            criar_dados_exemplo()
            
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


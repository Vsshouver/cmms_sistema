// Dados de teste para validação do sistema CMMS
class TestData {
    static getEquipments() {
        return [
            {
                id: 1,
                nome: 'Escavadeira CAT 320D',
                codigo: 'ESC-001',
                tipo: 'Escavadeira',
                modelo: '320D',
                fabricante: 'Caterpillar',
                ano: 2020,
                numero_serie: 'CAT320D2020001',
                status: 'operacional',
                condicao: 'bom',
                localizacao: 'Obra Norte',
                responsavel: 'João Silva',
                data_aquisicao: '2020-03-15',
                valor_aquisicao: 450000.00,
                horas_trabalhadas: 2450,
                proxima_manutencao: '2024-02-15',
                created_at: '2020-03-15T10:00:00Z'
            },
            {
                id: 2,
                nome: 'Caminhão Basculante Volvo',
                codigo: 'CAM-002',
                tipo: 'Caminhão',
                modelo: 'FMX 540',
                fabricante: 'Volvo',
                ano: 2019,
                numero_serie: 'VOLVO540001',
                status: 'manutencao',
                condicao: 'regular',
                localizacao: 'Oficina Central',
                responsavel: 'Maria Santos',
                data_aquisicao: '2019-08-20',
                valor_aquisicao: 380000.00,
                horas_trabalhadas: 3200,
                proxima_manutencao: '2024-01-30',
                created_at: '2019-08-20T14:30:00Z'
            },
            {
                id: 3,
                nome: 'Retroescavadeira JCB',
                codigo: 'RET-003',
                tipo: 'Retroescavadeira',
                modelo: '3CX',
                fabricante: 'JCB',
                ano: 2021,
                numero_serie: 'JCB3CX2021001',
                status: 'operacional',
                condicao: 'excelente',
                localizacao: 'Obra Sul',
                responsavel: 'Pedro Costa',
                data_aquisicao: '2021-01-10',
                valor_aquisicao: 320000.00,
                horas_trabalhadas: 1800,
                proxima_manutencao: '2024-03-10',
                created_at: '2021-01-10T09:15:00Z'
            },
            {
                id: 4,
                nome: 'Trator de Esteira D6T',
                codigo: 'TRA-004',
                tipo: 'Trator',
                modelo: 'D6T',
                fabricante: 'Caterpillar',
                ano: 2018,
                numero_serie: 'CATD6T2018001',
                status: 'parado',
                condicao: 'ruim',
                localizacao: 'Pátio',
                responsavel: 'Ana Lima',
                data_aquisicao: '2018-05-25',
                valor_aquisicao: 520000.00,
                horas_trabalhadas: 4500,
                proxima_manutencao: '2024-01-20',
                created_at: '2018-05-25T16:45:00Z'
            },
            {
                id: 5,
                nome: 'Motoniveladora 140M',
                codigo: 'MOT-005',
                tipo: 'Motoniveladora',
                modelo: '140M',
                fabricante: 'Caterpillar',
                ano: 2022,
                numero_serie: 'CAT140M2022001',
                status: 'operacional',
                condicao: 'excelente',
                localizacao: 'Obra Leste',
                responsavel: 'Carlos Oliveira',
                data_aquisicao: '2022-02-28',
                valor_aquisicao: 680000.00,
                horas_trabalhadas: 950,
                proxima_manutencao: '2024-04-15',
                created_at: '2022-02-28T11:20:00Z'
            }
        ];
    }

    static getWorkOrders() {
        return [
            {
                id: 1,
                numero: 'OS-2024-001',
                equipamento_id: 1,
                equipamento_nome: 'Escavadeira CAT 320D',
                tipo: 'preventiva',
                prioridade: 'normal',
                status: 'aberta',
                descricao: 'Manutenção preventiva - troca de óleo e filtros',
                mecanico_id: 1,
                mecanico_nome: 'José Silva',
                data_abertura: '2024-01-15T08:00:00Z',
                data_prevista: '2024-01-20T17:00:00Z',
                data_inicio: null,
                data_conclusao: null,
                tempo_estimado: 8,
                tempo_real: null,
                custo_estimado: 1500.00,
                custo_real: null,
                observacoes: 'Verificar também sistema hidráulico',
                created_at: '2024-01-15T08:00:00Z'
            },
            {
                id: 2,
                numero: 'OS-2024-002',
                equipamento_id: 2,
                equipamento_nome: 'Caminhão Basculante Volvo',
                tipo: 'corretiva',
                prioridade: 'alta',
                status: 'em_andamento',
                descricao: 'Reparo no sistema de freios - pastilhas gastas',
                mecanico_id: 2,
                mecanico_nome: 'Antonio Santos',
                data_abertura: '2024-01-10T14:30:00Z',
                data_prevista: '2024-01-12T16:00:00Z',
                data_inicio: '2024-01-11T07:30:00Z',
                data_conclusao: null,
                tempo_estimado: 12,
                tempo_real: null,
                custo_estimado: 2800.00,
                custo_real: 2650.00,
                observacoes: 'Necessário trocar também os discos',
                created_at: '2024-01-10T14:30:00Z'
            },
            {
                id: 3,
                numero: 'OS-2024-003',
                equipamento_id: 3,
                equipamento_nome: 'Retroescavadeira JCB',
                tipo: 'preventiva',
                prioridade: 'baixa',
                status: 'concluida',
                descricao: 'Inspeção geral e lubrificação',
                mecanico_id: 1,
                mecanico_nome: 'José Silva',
                data_abertura: '2024-01-05T09:00:00Z',
                data_prevista: '2024-01-08T17:00:00Z',
                data_inicio: '2024-01-08T08:00:00Z',
                data_conclusao: '2024-01-08T16:30:00Z',
                tempo_estimado: 6,
                tempo_real: 8.5,
                custo_estimado: 800.00,
                custo_real: 950.00,
                observacoes: 'Equipamento em excelente estado',
                created_at: '2024-01-05T09:00:00Z'
            },
            {
                id: 4,
                numero: 'OS-2024-004',
                equipamento_id: 4,
                equipamento_nome: 'Trator de Esteira D6T',
                tipo: 'corretiva',
                prioridade: 'critica',
                status: 'pendente',
                descricao: 'Motor com superaquecimento - possível problema na bomba d\'água',
                mecanico_id: 3,
                mecanico_nome: 'Roberto Lima',
                data_abertura: '2024-01-18T11:45:00Z',
                data_prevista: '2024-01-25T17:00:00Z',
                data_inicio: null,
                data_conclusao: null,
                tempo_estimado: 24,
                tempo_real: null,
                custo_estimado: 5500.00,
                custo_real: null,
                observacoes: 'Aguardando chegada de peças',
                created_at: '2024-01-18T11:45:00Z'
            },
            {
                id: 5,
                numero: 'OS-2024-005',
                equipamento_id: 5,
                equipamento_nome: 'Motoniveladora 140M',
                tipo: 'preventiva',
                prioridade: 'normal',
                status: 'agendada',
                descricao: 'Manutenção de 1000 horas',
                mecanico_id: 2,
                mecanico_nome: 'Antonio Santos',
                data_abertura: '2024-01-20T10:00:00Z',
                data_prevista: '2024-02-01T17:00:00Z',
                data_inicio: null,
                data_conclusao: null,
                tempo_estimado: 16,
                tempo_real: null,
                custo_estimado: 3200.00,
                custo_real: null,
                observacoes: 'Incluir troca de filtros especiais',
                created_at: '2024-01-20T10:00:00Z'
            }
        ];
    }

    static getStockItems() {
        return [
            {
                id: 1,
                nome: 'Óleo Motor 15W40',
                codigo: 'OLE-001',
                categoria: 'Lubrificantes',
                unidade: 'Litro',
                quantidade: 150,
                quantidade_minima: 50,
                quantidade_maxima: 300,
                valor_unitario: 25.50,
                status: 'Disponível',
                fornecedor: 'Petrobras',
                localizacao: 'A1-001',
                data_ultima_entrada: '2024-01-10T14:00:00Z',
                data_ultima_saida: '2024-01-18T09:30:00Z',
                created_at: '2023-12-01T10:00:00Z'
            },
            {
                id: 2,
                nome: 'Filtro de Óleo CAT',
                codigo: 'FIL-002',
                categoria: 'Filtros',
                unidade: 'Peça',
                quantidade: 25,
                quantidade_minima: 10,
                quantidade_maxima: 50,
                valor_unitario: 85.00,
                status: 'Disponível',
                fornecedor: 'Caterpillar',
                localizacao: 'B2-015',
                data_ultima_entrada: '2024-01-08T11:15:00Z',
                data_ultima_saida: '2024-01-15T16:20:00Z',
                created_at: '2023-11-15T14:30:00Z'
            },
            {
                id: 3,
                nome: 'Pastilha de Freio Volvo',
                codigo: 'FRE-003',
                categoria: 'Freios',
                unidade: 'Jogo',
                quantidade: 8,
                quantidade_minima: 5,
                quantidade_maxima: 20,
                valor_unitario: 450.00,
                status: 'Disponível',
                fornecedor: 'Volvo Parts',
                localizacao: 'C1-008',
                data_ultima_entrada: '2023-12-20T09:45:00Z',
                data_ultima_saida: '2024-01-11T13:10:00Z',
                created_at: '2023-10-05T16:00:00Z'
            },
            {
                id: 4,
                nome: 'Bomba D\'água D6T',
                codigo: 'BOM-004',
                categoria: 'Motor',
                unidade: 'Peça',
                quantidade: 0,
                quantidade_minima: 2,
                quantidade_maxima: 5,
                valor_unitario: 1250.00,
                status: 'Zerado',
                fornecedor: 'Caterpillar',
                localizacao: 'D3-022',
                data_ultima_entrada: '2023-11-30T15:20:00Z',
                data_ultima_saida: '2024-01-18T12:00:00Z',
                created_at: '2023-09-10T11:45:00Z'
            },
            {
                id: 5,
                nome: 'Graxa Multiuso',
                codigo: 'GRA-005',
                categoria: 'Lubrificantes',
                unidade: 'Kg',
                quantidade: 45,
                quantidade_minima: 20,
                quantidade_maxima: 100,
                valor_unitario: 18.75,
                status: 'Disponível',
                fornecedor: 'Shell',
                localizacao: 'A2-005',
                data_ultima_entrada: '2024-01-12T10:30:00Z',
                data_ultima_saida: '2024-01-17T14:45:00Z',
                created_at: '2023-08-22T13:15:00Z'
            },
            {
                id: 6,
                nome: 'Correia Dentada JCB',
                codigo: 'COR-006',
                categoria: 'Transmissão',
                unidade: 'Peça',
                quantidade: 3,
                quantidade_minima: 5,
                quantidade_maxima: 15,
                valor_unitario: 320.00,
                status: 'Baixo',
                fornecedor: 'JCB Parts',
                localizacao: 'B1-012',
                data_ultima_entrada: '2023-12-15T16:00:00Z',
                data_ultima_saida: '2024-01-05T10:15:00Z',
                created_at: '2023-07-18T09:30:00Z'
            }
        ];
    }

    static getItemGroups() {
        return [
            { id: 1, nome: 'Lubrificantes' },
            { id: 2, nome: 'Filtros' },
            { id: 3, nome: 'Freios' }
        ];
    }

    static getMechanics() {
        return [
            {
                id: 1,
                nome: 'José Silva',
                email: 'jose.silva@empresa.com',
                telefone: '(11) 99999-1111',
                especialidade: 'Mecânica Geral',
                nivel: 'senior',
                status: 'ativo',
                turno: 'Manhã',
                os_ativas: 2,
                os_concluidas: 45,
                data_admissao: '2020-03-15',
                ultima_atividade: '2024-01-18',
                observacoes: 'Especialista em equipamentos Caterpillar',
                created_at: '2020-03-15T10:00:00Z'
            },
            {
                id: 2,
                nome: 'Antonio Santos',
                email: 'antonio.santos@empresa.com',
                telefone: '(11) 99999-2222',
                especialidade: 'Hidráulica',
                nivel: 'pleno',
                status: 'ocupado',
                turno: 'Tarde',
                os_ativas: 1,
                os_concluidas: 32,
                data_admissao: '2021-08-20',
                ultima_atividade: '2024-01-18',
                observacoes: 'Certificado em sistemas hidráulicos',
                created_at: '2021-08-20T14:30:00Z'
            },
            {
                id: 3,
                nome: 'Roberto Lima',
                email: 'roberto.lima@empresa.com',
                telefone: '(11) 99999-3333',
                especialidade: 'Motor',
                nivel: 'especialista',
                status: 'ativo',
                turno: 'Integral',
                os_ativas: 1,
                os_concluidas: 67,
                data_admissao: '2018-05-10',
                ultima_atividade: '2024-01-17',
                observacoes: 'Especialista em motores diesel',
                created_at: '2018-05-10T09:15:00Z'
            },
            {
                id: 4,
                nome: 'Carlos Oliveira',
                email: 'carlos.oliveira@empresa.com',
                telefone: '(11) 99999-4444',
                especialidade: 'Elétrica',
                nivel: 'junior',
                status: 'ativo',
                turno: 'Manhã',
                os_ativas: 0,
                os_concluidas: 12,
                data_admissao: '2023-02-01',
                ultima_atividade: '2024-01-16',
                observacoes: 'Em treinamento',
                created_at: '2023-02-01T08:00:00Z'
            },
            {
                id: 5,
                nome: 'Fernando Costa',
                email: 'fernando.costa@empresa.com',
                telefone: '(11) 99999-5555',
                especialidade: 'Soldas',
                nivel: 'senior',
                status: 'ferias',
                turno: 'Noite',
                os_ativas: 0,
                os_concluidas: 38,
                data_admissao: '2019-11-12',
                ultima_atividade: '2024-01-05',
                observacoes: 'Retorna em 15/02/2024',
                created_at: '2019-11-12T13:45:00Z'
            }
        ];
    }

    static getUsers() {
        return [
            {
                id: 1,
                nome: 'Administrador Sistema',
                email: 'admin@empresa.com',
                perfil: 'admin',
                telefone: '(11) 99999-0000',
                departamento: 'TI',
                cargo: 'Administrador de Sistema',
                ativo: true,
                pode_alterar_senha: true,
                ultimo_acesso: '2024-01-18T15:30:00Z',
                created_at: '2023-01-01T10:00:00Z'
            },
            {
                id: 2,
                nome: 'Maria PCM',
                email: 'maria.pcm@empresa.com',
                perfil: 'pcm',
                telefone: '(11) 99999-1000',
                departamento: 'Manutenção',
                cargo: 'Planejador de Manutenção',
                ativo: true,
                pode_alterar_senha: true,
                ultimo_acesso: '2024-01-18T14:20:00Z',
                created_at: '2023-02-15T09:30:00Z'
            },
            {
                id: 3,
                nome: 'João Almoxarife',
                email: 'joao.almoxarife@empresa.com',
                perfil: 'almoxarife',
                telefone: '(11) 99999-2000',
                departamento: 'Almoxarifado',
                cargo: 'Almoxarife',
                ativo: true,
                pode_alterar_senha: true,
                ultimo_acesso: '2024-01-18T13:45:00Z',
                created_at: '2023-03-10T11:15:00Z'
            },
            {
                id: 4,
                nome: 'Pedro Operador',
                email: 'pedro.operador@empresa.com',
                perfil: 'operador',
                telefone: '(11) 99999-3000',
                departamento: 'Operações',
                cargo: 'Operador de Máquinas',
                ativo: true,
                pode_alterar_senha: false,
                ultimo_acesso: '2024-01-17T16:00:00Z',
                created_at: '2023-04-20T14:00:00Z'
            },
            {
                id: 5,
                nome: 'Ana Visualizadora',
                email: 'ana.visualizadora@empresa.com',
                perfil: 'visualizador',
                telefone: '(11) 99999-4000',
                departamento: 'Gerência',
                cargo: 'Gerente de Operações',
                ativo: false,
                pode_alterar_senha: true,
                ultimo_acesso: '2024-01-10T12:30:00Z',
                created_at: '2023-05-05T10:45:00Z'
            }
        ];
    }

    static getMaintenanceTypes() {
        return [
            { id: 1, codigo: 'PM-001', nome: 'Preventiva', descricao: 'Manutenção preventiva padrão', cor_identificacao: '#4CAF50', ativo: true },
            { id: 2, codigo: 'CM-001', nome: 'Corretiva', descricao: 'Correção de falhas', cor_identificacao: '#F44336', ativo: true }
        ];
    }

    static getBacklogItems() {
        return [
            { id: 1, titulo: 'Vazamento hidráulico', categoria: 'hidraulica', categoria_display: 'Hidráulica', status: 'pendente', status_display: 'Pendente', prioridade: 'alta', prioridade_display: 'Alta', responsavel: 'João Silva', equipamento_id: 1 },
            { id: 2, titulo: 'Falha elétrica', categoria: 'eletrica', categoria_display: 'Elétrica', status: 'em_execucao', status_display: 'Em Execução', prioridade: 'media', prioridade_display: 'Média', responsavel: 'Maria Santos', equipamento_id: 2 }
        ];
    }

    static getPreventivePlans() {
        return [
            { id: 1, nome: 'Troca de óleo 250h', equipamento_id: 1, equipamento_nome: 'Escavadeira CAT 320D', tipo_manutencao_id: 1, tipo_manutencao_nome: 'Preventiva', prioridade: 'Alta', intervalo_dias: 90, ativo: true },
            { id: 2, nome: 'Revisão geral anual', equipamento_id: 2, equipamento_nome: 'Caminhão Basculante Volvo', tipo_manutencao_id: 1, tipo_manutencao_nome: 'Preventiva', prioridade: 'Média', intervalo_dias: 365, ativo: true }
        ];
    }

    static getMovements() {
        return [
            { id: 1, tipo: 'entrada', item: 'Óleo Motor 15W40', quantidade: 50, documento: 'NF-123', responsavel: 'João Almoxarife', data: '2024-01-10' },
            { id: 2, tipo: 'saida', item: 'Filtro de Óleo CAT', quantidade: 2, documento: 'REQ-456', responsavel: 'Maria PCM', data: '2024-01-12' }
        ];
    }

    static getEquipmentTypes() {
        return [
            { id: 1, nome: 'Escavadeira', descricao: 'Equipamentos para escavação', ativo: true },
            { id: 2, nome: 'Caminhão', descricao: 'Veículos de transporte', ativo: true }
        ];
    }

    static getTires() {
        return [
            {
                id: 1,
                numero_serie: 'PN001',
                numero_fogo: 'F001',
                marca: 'Goodyear',
                modelo: 'G1',
                medida: '385/65R22.5',
                status: 'estoque',
                sulco_inicial: 15,
                sulco_atual: 15,
                item_id: 1
            },
            {
                id: 2,
                numero_serie: 'PN002',
                numero_fogo: 'F002',
                marca: 'Michelin',
                modelo: 'X1',
                medida: '295/80R22.5',
                status: 'em_uso',
                sulco_inicial: 18,
                sulco_atual: 17,
                item_id: 1
            }
        ];
    }

    static getOilAnalysis() {
        return [
            { id: 1, numero_amostra: 'A2024-001', equipamento_id: 1, equipamento_nome: 'Escavadeira CAT 320D', data_coleta: '2024-01-15', status: 'Em análise', resultado: null },
            { id: 2, numero_amostra: 'A2024-002', equipamento_id: 2, equipamento_nome: 'Caminhão Basculante Volvo', data_coleta: '2024-01-12', status: 'Concluída', resultado: 'Normal' }
        ];
    }

    static getDashboardStats() {
        const equipamentos = this.getEquipments();
        const os = this.getWorkOrders();
        const stock = this.getStockItems();
        return {
            kpis: {
                equipamentos_ativos: equipamentos.length,
                os_abertas: os.filter(o => o.status !== 'concluida').length,
                os_concluidas_mes: os.filter(o => o.status === 'concluida').length,
                pecas_estoque: stock.reduce((sum, item) => sum + item.quantidade, 0)
            },
            graficos: {
                os_por_status: [
                    { status: 'aberta', count: os.filter(o => o.status === 'aberta').length },
                    { status: 'em_execucao', count: os.filter(o => o.status === 'em_execucao').length },
                    { status: 'concluida', count: os.filter(o => o.status === 'concluida').length }
                ],
                os_por_tipo: [
                    { tipo: 'preventiva', count: os.filter(o => o.tipo === 'preventiva').length },
                    { tipo: 'corretiva', count: os.filter(o => o.tipo === 'corretiva').length }
                ]
            },
            alertas: [],
            atividades_recentes: []
        };
    }

    // Método para simular API calls
    static simulateAPI() {
        // Simular delay de rede
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Mock do objeto API
        window.API = {
            auth: {
                login: async () => {
                    await delay(300);
                    return {
                        token: 'fake-token',
                        user: {
                            id: 1,
                            nome: 'Administrador Sistema',
                            email: 'admin@empresa.com',
                            nivel_acesso: 'ADM'
                        }
                    };
                },
                logout: async () => {
                    await delay(200);
                    return { success: true };
                },
                me: async () => {
                    await delay(200);
                    return {
                        user: {
                            id: 1,
                            nome: 'Administrador Sistema',
                            email: 'admin@empresa.com',
                            nivel_acesso: 'ADM'
                        }
                    };
                }
            },
            equipments: {
                getAll: async () => {
                    await delay(500);
                    return TestData.getEquipments();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando equipamento:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando equipamento:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo equipamento:', id);
                    return { success: true };
                }
            },
             workOrders: {
                 getAll: async () => {
                     await delay(600);
                     return TestData.getWorkOrders();
                 },
                 create: async (data) => {
                     await delay(400);
                     console.log('Criando OS:', data);
                     return { id: Date.now(), ...data };
                 },
                 update: async (id, data) => {
                     await delay(400);
                     console.log('Atualizando OS:', id, data);
                     return { id, ...data };
                 },
                 delete: async (id) => {
                     await delay(300);
                     console.log('Excluindo OS:', id);
                     return { success: true };
                },
                getMechanicAlerts: async () => {
                    await delay(300);
                    // Considera todas as OS não concluídas como alertas
                    const alertas = TestData.getWorkOrders().filter(os => os.status !== 'concluida');
                    return { total_alertas: alertas.length, alertas };
                }
            },
            tires: {
                getAll: async () => {
                    await delay(300);
                    return TestData.getTires();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando pneu:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando pneu:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(200);
                    console.log('Excluindo pneu:', id);
                    return { success: true };
                },
                getAlerts: async () => {
                    await delay(300);
                    return { total_alertas: 0, alertas: [] };
                }
            },
            items: {
                getAll: async () => {
                    await delay(300);
                    return TestData.getStockItems();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando item:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando item:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(200);
                    console.log('Excluindo item:', id);
                    return { success: true };
                }
            },
            stock: {
                getAll: async () => {
                    await delay(450);
                    return TestData.getStockItems();
                },
                create: async (data) => {
                    await delay(350);
                    console.log('Criando item:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(350);
                    console.log('Atualizando item:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo item:', id);
                    return { success: true };
                }
            },
            inventory: {
                getAll: async () => {
                    await delay(450);
                    return { pecas: TestData.getStockItems() };
                },
                create: async (data) => {
                    await delay(350);
                    console.log('Criando item de estoque:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(350);
                    console.log('Atualizando item de estoque:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo item de estoque:', id);
                    return { success: true };
                },
                movement: async (id, data) => {
                    await delay(300);
                    console.log('Registrando movimentação do item:', id, data);
                    return { id, ...data };
                }
            },
            itemGroups: {
                getAll: async () => {
                    await delay(300);
                    const grupos = TestData.getItemGroups();
                    return { grupos_item: grupos, data: grupos };
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando grupo de item:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando grupo de item:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(200);
                    console.log('Excluindo grupo de item:', id);
                    return { success: true };
                }
            },
            mechanics: {
                getAll: async () => {
                    await delay(400);
                    return TestData.getMechanics();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando mecânico:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando mecânico:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo mecânico:', id);
                    return { success: true };
                }
            },
            users: {
                getAll: async () => {
                    await delay(350);
                    return TestData.getUsers();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando usuário:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando usuário:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo usuário:', id);
                    return { success: true };
                },
                resetPassword: async (id) => {
                    await delay(400);
                    console.log('Redefinindo senha do usuário:', id);
                    return Math.random().toString(36).slice(-8);
                }
            },
            dashboard: {
                getStats: async () => {
                    await delay(300);
                    return TestData.getDashboardStats();
                }
            },
            maintenanceTypes: {
                getAll: async () => {
                    await delay(300);
                    const tipos = TestData.getMaintenanceTypes();
                    return { tipos_manutencao: tipos, data: tipos };
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando tipo de manutenção:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando tipo de manutenção:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo tipo de manutenção:', id);
                    return { success: true };
                }
            },
            backlog: {
                getAll: async () => {
                    await delay(300);
                    const items = TestData.getBacklogItems();
                    return { backlog_items: items, data: items };
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando item de backlog:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando item de backlog:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo item de backlog:', id);
                    return { success: true };
                }
            },
            preventivePlans: {
                getAll: async () => {
                    await delay(300);
                    const planos = TestData.getPreventivePlans();
                    return { planos_preventiva: planos, data: planos };
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando plano de preventiva:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando plano de preventiva:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo plano de preventiva:', id);
                    return { success: true };
                }
            },
            movements: {
                getAll: async () => {
                    await delay(300);
                    return TestData.getMovements();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando movimentação:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando movimentação:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo movimentação:', id);
                    return { success: true };
                }
            },
            equipmentTypes: {
                getAll: async () => {
                    await delay(300);
                    return TestData.getEquipmentTypes();
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando tipo de equipamento:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando tipo de equipamento:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo tipo de equipamento:', id);
                    return { success: true };
                }
            },
            oilAnalysis: {
                getAll: async () => {
                    await delay(300);
                    const analises = TestData.getOilAnalysis();
                    return { analises, data: analises };
                },
                create: async (data) => {
                    await delay(300);
                    console.log('Criando análise de óleo:', data);
                    return { id: Date.now(), ...data };
                },
                update: async (id, data) => {
                    await delay(300);
                    console.log('Atualizando análise de óleo:', id, data);
                    return { id, ...data };
                },
                delete: async (id) => {
                    await delay(300);
                    console.log('Excluindo análise de óleo:', id);
                    return { success: true };
                }
            }
        };

        console.log('API de teste configurada com sucesso!');
    }

    // Método para configurar utilitários de teste
    static setupTestUtils() {
        window.Utils = {
            showToast: (message, type = 'info') => {
                console.log(`Toast [${type}]: ${message}`);
                
                // Criar toast visual simples
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i>
                    ${message}
                `;
                
                const container = document.getElementById('toast-container') || (() => {
                    const container = document.createElement('div');
                    container.id = 'toast-container';
                    container.className = 'toast-container';
                    document.body.appendChild(container);
                    return container;
                })();
                
                container.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            },
            
            showConfirm: async (title, message, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
                return new Promise((resolve) => {
                    const result = confirm(`${title}\n\n${message}`);
                    resolve(result);
                });
            },
            
            showAlert: (title, message, type = 'info') => {
                alert(`${title}\n\n${message}`);
            }
        };

        console.log('Utilitários de teste configurados!');
    }

    // Método principal para inicializar todos os dados de teste
    static initialize() {
        this.simulateAPI();
        this.setupTestUtils();
        
        console.log('Sistema de teste inicializado com sucesso!');
        console.log('Dados disponíveis:');
        console.log('- Equipamentos:', this.getEquipments().length);
        console.log('- Ordens de Serviço:', this.getWorkOrders().length);
        console.log('- Itens de Estoque:', this.getStockItems().length);
        console.log('- Grupos de Itens:', this.getItemGroups().length);
        console.log('- Mecânicos:', this.getMechanics().length);
        console.log('- Usuários:', this.getUsers().length);
        console.log('- Tipos de Manutenção:', this.getMaintenanceTypes().length);
        console.log('- Itens de Backlog:', this.getBacklogItems().length);
        console.log('- Planos de Preventiva:', this.getPreventivePlans().length);
        console.log('- Movimentações:', this.getMovements().length);
        console.log('- Pneus:', this.getTires().length);
        console.log('- Tipos de Equipamento:', this.getEquipmentTypes().length);
        console.log('- Análises de Óleo:', this.getOilAnalysis().length);
    }
}

// Auto-inicializar quando o arquivo for carregado
if (typeof window !== 'undefined') {
    // Aguardar o DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TestData.initialize();
        });
    } else {
        TestData.initialize();
    }
}


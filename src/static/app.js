// Configuração da API
const API_BASE_URL = '/api';

// Estado da aplicação
let currentUser = null;
let authToken = null;

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há token salvo
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        authToken = savedToken;
        validateToken();
    } else {
        showLogin();
    }

    // Event listeners
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            navigateToPage(page);
        });
    });

    // Filtros e busca
    setupFilters();
}

// Configurar filtros
function setupFilters() {
    // Equipamentos
    document.getElementById('equipamentos-search').addEventListener('input', debounce(() => loadEquipamentos(), 300));
    document.getElementById('equipamentos-status-filter').addEventListener('change', loadEquipamentos);
    
    // Ordens de Serviço
    document.getElementById('os-search').addEventListener('input', debounce(() => loadOrdensServico(), 300));
    document.getElementById('os-status-filter').addEventListener('change', loadOrdensServico);
    document.getElementById('os-tipo-filter').addEventListener('change', loadOrdensServico);
    document.getElementById('os-prioridade-filter').addEventListener('change', loadOrdensServico);
    
    // Mecânicos
    document.getElementById('mecanicos-search').addEventListener('input', debounce(() => loadMecanicos(), 300));
    document.getElementById('mecanicos-status-filter').addEventListener('change', loadMecanicos);
    
    // Estoque
    document.getElementById('estoque-search').addEventListener('input', debounce(() => loadEstoque(), 300));
    document.getElementById('estoque-categoria-filter').addEventListener('change', loadEstoque);
    document.getElementById('baixo-estoque-filter').addEventListener('change', loadEstoque);
    
    // Pneus
    document.getElementById('pneus-search').addEventListener('input', debounce(() => loadPneus(), 300));
    document.getElementById('pneus-status-filter').addEventListener('change', loadPneus);
    
    // Usuários
    document.getElementById('usuarios-search').addEventListener('input', debounce(() => loadUsuarios(), 300));
    document.getElementById('usuarios-nivel-filter').addEventListener('change', loadUsuarios);
}

// Utilitário debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const senha = formData.get('password');
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showMainApp();
        } else {
            showError(data.error || 'Erro no login');
        }
    } catch (error) {
        showError('Erro de conexão. Tente novamente.');
    }
}

async function validateToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/validate`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
        } else {
            localStorage.removeItem('authToken');
            showLogin();
        }
    } catch (error) {
        localStorage.removeItem('authToken');
        showLogin();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showLogin();
}

// Interface
function showLogin() {
    loginScreen.style.display = 'flex';
    mainApp.style.display = 'none';
}

function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'flex';
    
    // Atualizar informações do usuário
    document.getElementById('user-name').textContent = `Usuário: ${currentUser.nome_completo}`;
    
    // Carregar dashboard por padrão
    navigateToPage('dashboard');
}

function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 5000);
}

// Navegação
function navigateToPage(page) {
    // Atualizar menu ativo
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Mostrar página
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'equipamentos': 'Equipamentos',
        'ordens-servico': 'Ordens de Serviço',
        'mecanicos': 'Mecânicos',
        'estoque': 'Estoque',
        'pneus': 'Controle de Pneus',
        'usuarios': 'Usuários'
    };
    document.getElementById('page-title').textContent = titles[page];
    
    // Carregar dados da página
    loadPageData(page);
}

async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'equipamentos':
            await loadEquipamentos();
            break;
        case 'ordens-servico':
            await loadOrdensServico();
            break;
        case 'mecanicos':
            await loadMecanicos();
            break;
        case 'estoque':
            await loadEstoque();
            break;
        case 'pneus':
            await loadPneus();
            break;
        case 'usuarios':
            if (currentUser.nivel_acesso === 'ADM') {
                await loadUsuarios();
            } else {
                showError('Acesso negado. Apenas administradores.');
            }
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboardKPIs(data.kpis);
            updateDashboardCharts(data.graficos);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function updateDashboardKPIs(kpis) {
    document.getElementById('total-os').textContent = kpis.total_os;
    document.getElementById('os-abertas').textContent = `${kpis.os_abertas} abertas`;
    document.getElementById('total-equipamentos').textContent = kpis.total_equipamentos;
    document.getElementById('equipamentos-manutencao').textContent = `${kpis.equipamentos_manutencao} em manutenção`;
    document.getElementById('total-pecas').textContent = kpis.total_pecas;
    document.getElementById('pecas-baixo-estoque').textContent = `${kpis.pecas_baixo_estoque} peças em falta`;
    document.getElementById('custo-mensal').textContent = `R$ ${kpis.custo_mensal.toLocaleString('pt-BR')}`;
}

function updateDashboardCharts(graficos) {
    // Gráfico de evolução mensal
    const evolucaoCtx = document.getElementById('evolucao-chart').getContext('2d');
    new Chart(evolucaoCtx, {
        type: 'line',
        data: {
            labels: graficos.evolucao_os.map(item => item.mes),
            datasets: [{
                label: 'Ordens de Serviço',
                data: graficos.evolucao_os.map(item => item.count),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Gráfico de status
    const statusCtx = document.getElementById('status-chart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: graficos.os_por_status.map(item => item.status),
            datasets: [{
                data: graficos.os_por_status.map(item => item.count),
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Ranking de equipamentos
    const rankingContainer = document.getElementById('equipamentos-ranking');
    rankingContainer.innerHTML = graficos.equipamentos_mais_os.map(eq => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <div>
                <div style="font-weight: 600; color: #1e293b;">${eq.nome}</div>
                <div style="font-size: 12px; color: #64748b;">${eq.codigo}</div>
            </div>
            <div style="font-weight: 700; color: #3b82f6;">${eq.total_os}</div>
        </div>
    `).join('');
    
    // Gráfico de tipos
    const tipoCtx = document.getElementById('tipo-chart').getContext('2d');
    new Chart(tipoCtx, {
        type: 'bar',
        data: {
            labels: graficos.os_por_tipo.map(item => item.tipo),
            datasets: [{
                data: graficos.os_por_tipo.map(item => item.count),
                backgroundColor: ['#10b981', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Equipamentos
async function loadEquipamentos() {
    try {
        const search = document.getElementById('equipamentos-search').value;
        const status = document.getElementById('equipamentos-status-filter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/equipamentos?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateEquipamentosStats(data.equipamentos);
            renderEquipamentos(data.equipamentos);
        }
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
    }
}

function updateEquipamentosStats(equipamentos) {
    const total = equipamentos.length;
    const ativos = equipamentos.filter(eq => eq.status === 'ativo').length;
    const manutencao = equipamentos.filter(eq => eq.status === 'manutencao').length;
    const inativos = equipamentos.filter(eq => eq.status === 'inativo').length;
    
    document.getElementById('equipamentos-total').textContent = total;
    document.getElementById('equipamentos-ativos').textContent = ativos;
    document.getElementById('equipamentos-em-manutencao').textContent = manutencao;
    document.getElementById('equipamentos-inativos').textContent = inativos;
}

function renderEquipamentos(equipamentos) {
    const container = document.getElementById('equipamentos-list');
    
    if (equipamentos.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhum equipamento encontrado</div>';
        return;
    }
    
    container.innerHTML = equipamentos.map(eq => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${eq.nome}</div>
                    <div class="item-subtitle">${eq.codigo_interno}</div>
                </div>
                <span class="status-badge status-${eq.status}">${eq.status}</span>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">Modelo</span>
                    <span class="info-value">${eq.modelo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Fabricante</span>
                    <span class="info-value">${eq.fabricante}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Horímetro</span>
                    <span class="info-value">${eq.horimetro_atual}h</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Localização</span>
                    <span class="info-value">${eq.localizacao}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewEquipamento(${eq.id})">Ver</button>
                ${canEdit() ? `<button class="btn-action btn-edit" onclick="editEquipamento(${eq.id})">Editar</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Ordens de Serviço
async function loadOrdensServico() {
    try {
        const search = document.getElementById('os-search').value;
        const status = document.getElementById('os-status-filter').value;
        const tipo = document.getElementById('os-tipo-filter').value;
        const prioridade = document.getElementById('os-prioridade-filter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (tipo) params.append('tipo', tipo);
        if (prioridade) params.append('prioridade', prioridade);
        
        const response = await fetch(`${API_BASE_URL}/ordens-servico?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateOSStats(data.ordens_servico);
            renderOrdensServico(data.ordens_servico);
        }
    } catch (error) {
        console.error('Erro ao carregar ordens de serviço:', error);
    }
}

function updateOSStats(ordens) {
    const abertas = ordens.filter(os => os.status === 'aberta').length;
    const execucao = ordens.filter(os => os.status === 'em_execucao').length;
    const aguardando = ordens.filter(os => os.status === 'aguardando_pecas').length;
    const concluidas = ordens.filter(os => os.status === 'concluida').length;
    const canceladas = ordens.filter(os => os.status === 'cancelada').length;
    
    document.getElementById('os-abertas-count').textContent = abertas;
    document.getElementById('os-execucao-count').textContent = execucao;
    document.getElementById('os-aguardando-count').textContent = aguardando;
    document.getElementById('os-concluidas-count').textContent = concluidas;
    document.getElementById('os-canceladas-count').textContent = canceladas;
}

function renderOrdensServico(ordens) {
    const container = document.getElementById('ordens-servico-list');
    
    if (ordens.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhuma ordem de serviço encontrada</div>';
        return;
    }
    
    container.innerHTML = ordens.map(os => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${os.numero_os}</div>
                    <div class="item-subtitle">${os.equipamento ? os.equipamento.nome : 'N/A'}</div>
                </div>
                <div>
                    <span class="status-badge status-${os.status}">${os.status.replace('_', ' ')}</span>
                    <span class="status-badge status-${os.prioridade}">${os.prioridade}</span>
                </div>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">${os.tipo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Mecânico</span>
                    <span class="info-value">${os.mecanico ? os.mecanico.nome_completo : 'Não atribuído'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Data Abertura</span>
                    <span class="info-value">${formatDate(os.data_abertura)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Custo Total</span>
                    <span class="info-value">R$ ${(os.custo_total || 0).toLocaleString('pt-BR')}</span>
                </div>
            </div>
            <div style="margin: 12px 0; font-size: 14px; color: #64748b;">
                ${os.descricao_problema}
            </div>
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewOS(${os.id})">Ver Detalhes</button>
                ${os.status === 'aberta' ? `<button class="btn-action btn-start" onclick="iniciarOS(${os.id})">Iniciar</button>` : ''}
                ${os.status === 'em_execucao' ? `<button class="btn-action btn-complete" onclick="concluirOS(${os.id})">Concluir</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Mecânicos
async function loadMecanicos() {
    try {
        const search = document.getElementById('mecanicos-search').value;
        const status = document.getElementById('mecanicos-status-filter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/mecanicos?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderMecanicos(data.mecanicos);
        }
    } catch (error) {
        console.error('Erro ao carregar mecânicos:', error);
    }
}

function renderMecanicos(mecanicos) {
    const container = document.getElementById('mecanicos-list');
    
    if (mecanicos.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhum mecânico encontrado</div>';
        return;
    }
    
    container.innerHTML = mecanicos.map(mec => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${mec.nome_completo}</div>
                    <div class="item-subtitle">${mec.especialidade}</div>
                </div>
                <span class="status-badge status-${mec.status}">${mec.status}</span>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">CPF</span>
                    <span class="info-value">${mec.cpf}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Telefone</span>
                    <span class="info-value">${mec.telefone || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Nível</span>
                    <span class="info-value">${mec.nivel_experiencia}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Admissão</span>
                    <span class="info-value">${formatDate(mec.data_admissao)}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewMecanico(${mec.id})">Ver</button>
                ${canEdit() ? `<button class="btn-action btn-edit" onclick="editMecanico(${mec.id})">Editar</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Estoque
async function loadEstoque() {
    try {
        const search = document.getElementById('estoque-search').value;
        const categoria = document.getElementById('estoque-categoria-filter').value;
        const baixoEstoque = document.getElementById('baixo-estoque-filter').checked;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoria) params.append('categoria', categoria);
        if (baixoEstoque) params.append('baixo_estoque', 'true');
        
        const response = await fetch(`${API_BASE_URL}/estoque/pecas?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderEstoque(data.pecas);
        }
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
    }
}

function renderEstoque(pecas) {
    const container = document.getElementById('estoque-list');
    
    if (pecas.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhuma peça encontrada</div>';
        return;
    }
    
    container.innerHTML = pecas.map(peca => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${peca.nome}</div>
                    <div class="item-subtitle">${peca.codigo}</div>
                </div>
                <span class="status-badge ${peca.status_estoque === 'baixo' ? 'status-inativo' : 'status-ativo'}">
                    ${peca.status_estoque === 'baixo' ? 'Baixo Estoque' : 'Normal'}
                </span>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">Categoria</span>
                    <span class="info-value">${peca.categoria}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Quantidade</span>
                    <span class="info-value">${peca.quantidade} ${peca.unidade}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Estoque Mín.</span>
                    <span class="info-value">${peca.min_estoque}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Preço Unit.</span>
                    <span class="info-value">R$ ${(peca.preco_unitario || 0).toLocaleString('pt-BR')}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewPeca(${peca.id})">Ver</button>
                ${canManageStock() ? `<button class="btn-action btn-edit" onclick="movimentarEstoque(${peca.id})">Movimentar</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Pneus
async function loadPneus() {
    try {
        const search = document.getElementById('pneus-search').value;
        const status = document.getElementById('pneus-status-filter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/pneus?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderPneus(data.pneus);
        }
    } catch (error) {
        console.error('Erro ao carregar pneus:', error);
    }
}

function renderPneus(pneus) {
    const container = document.getElementById('pneus-list');
    
    if (pneus.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhum pneu encontrado</div>';
        return;
    }
    
    container.innerHTML = pneus.map(pneu => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${pneu.marca} ${pneu.modelo}</div>
                    <div class="item-subtitle">${pneu.numero_serie}</div>
                </div>
                <span class="status-badge status-${pneu.status.replace('_', '-')}">${pneu.status.replace('_', ' ')}</span>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">Medida</span>
                    <span class="info-value">${pneu.medida}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tipo</span>
                    <span class="info-value">${pneu.tipo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">KM Rodados</span>
                    <span class="info-value">${pneu.km_rodados || 0} km</span>
                </div>
                <div class="info-item">
                    <span class="info-label">% Uso</span>
                    <span class="info-value">${pneu.percentual_uso || 0}%</span>
                </div>
            </div>
            ${pneu.equipamento ? `
                <div style="margin: 12px 0; padding: 8px; background: #f1f5f9; border-radius: 6px; font-size: 14px;">
                    <strong>Equipamento:</strong> ${pneu.equipamento.nome} (${pneu.posicao})
                </div>
            ` : ''}
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewPneu(${pneu.id})">Ver</button>
                ${canEdit() ? `<button class="btn-action btn-edit" onclick="editPneu(${pneu.id})">Editar</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Usuários
async function loadUsuarios() {
    try {
        const search = document.getElementById('usuarios-search').value;
        const nivel = document.getElementById('usuarios-nivel-filter').value;
        
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (nivel) params.append('nivel_acesso', nivel);
        
        const response = await fetch(`${API_BASE_URL}/usuarios?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderUsuarios(data.usuarios);
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

function renderUsuarios(usuarios) {
    const container = document.getElementById('usuarios-list');
    
    if (usuarios.length === 0) {
        container.innerHTML = '<div class="text-center">Nenhum usuário encontrado</div>';
        return;
    }
    
    container.innerHTML = usuarios.map(user => `
        <div class="item-card">
            <div class="item-header">
                <div>
                    <div class="item-title">${user.nome_completo}</div>
                    <div class="item-subtitle">${user.username} - ${user.email}</div>
                </div>
                <span class="status-badge ${user.ativo ? 'status-ativo' : 'status-inativo'}">
                    ${user.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div class="item-info">
                <div class="info-item">
                    <span class="info-label">Cargo</span>
                    <span class="info-value">${user.cargo}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Nível de Acesso</span>
                    <span class="info-value">${user.nivel_acesso}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Último Login</span>
                    <span class="info-value">${user.ultimo_login ? formatDate(user.ultimo_login) : 'Nunca'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Criado em</span>
                    <span class="info-value">${formatDate(user.created_at)}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-action btn-view" onclick="viewUsuario(${user.id})">Ver</button>
                <button class="btn-action btn-edit" onclick="editUsuario(${user.id})">Editar</button>
            </div>
        </div>
    `).join('');
}

// Utilitários
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function canEdit() {
    return ['ADM', 'Supervisor'].includes(currentUser.nivel_acesso);
}

function canManageStock() {
    return ['ADM', 'Supervisor', 'Almoxarife'].includes(currentUser.nivel_acesso);
}

// Modais
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Ações placeholder (implementar conforme necessário)
function viewEquipamento(id) { console.log('Ver equipamento:', id); }
function editEquipamento(id) { console.log('Editar equipamento:', id); }
function viewOS(id) { console.log('Ver OS:', id); }
function iniciarOS(id) { console.log('Iniciar OS:', id); }
function concluirOS(id) { console.log('Concluir OS:', id); }
function viewMecanico(id) { console.log('Ver mecânico:', id); }
function editMecanico(id) { console.log('Editar mecânico:', id); }
function viewPeca(id) { console.log('Ver peça:', id); }
function movimentarEstoque(id) { console.log('Movimentar estoque:', id); }
function viewPneu(id) { console.log('Ver pneu:', id); }
function editPneu(id) { console.log('Editar pneu:', id); }
function viewUsuario(id) { console.log('Ver usuário:', id); }
function editUsuario(id) { console.log('Editar usuário:', id); }


// Formulários dos modais
document.addEventListener('DOMContentLoaded', function() {
    // Equipamento form
    document.getElementById('equipamento-form').addEventListener('submit', handleEquipamentoSubmit);
    
    // OS form
    document.getElementById('os-form').addEventListener('submit', handleOSSubmit);
    
    // Mecânico form
    document.getElementById('mecanico-form').addEventListener('submit', handleMecanicoSubmit);
    
    // Peça form
    document.getElementById('peca-form').addEventListener('submit', handlePecaSubmit);
    
    // Pneu form
    document.getElementById('pneu-form').addEventListener('submit', handlePneuSubmit);
    
    // Usuário form
    document.getElementById('usuario-form').addEventListener('submit', handleUsuarioSubmit);
});

// Handlers dos formulários
async function handleEquipamentoSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/equipamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('equipamento-modal');
            e.target.reset();
            loadEquipamentos();
            showSuccess('Equipamento criado com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar equipamento');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

async function handleOSSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/ordens-servico`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('os-modal');
            e.target.reset();
            loadOrdensServico();
            showSuccess('Ordem de serviço criada com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar ordem de serviço');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

async function handleMecanicoSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/mecanicos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('mecanico-modal');
            e.target.reset();
            loadMecanicos();
            showSuccess('Mecânico criado com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar mecânico');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

async function handlePecaSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/estoque/pecas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('peca-modal');
            e.target.reset();
            loadEstoque();
            showSuccess('Peça criada com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar peça');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

async function handlePneuSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/pneus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('pneu-modal');
            e.target.reset();
            loadPneus();
            showSuccess('Pneu criado com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar pneu');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

async function handleUsuarioSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            hideModal('usuario-modal');
            e.target.reset();
            loadUsuarios();
            showSuccess('Usuário criado com sucesso!');
        } else {
            const error = await response.json();
            showError(error.error || 'Erro ao criar usuário');
        }
    } catch (error) {
        showError('Erro de conexão');
    }
}

// Funções de notificação
function showSuccess(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Carregar opções para selects
async function loadSelectOptions() {
    try {
        // Carregar equipamentos para OS
        const equipamentosResponse = await fetch(`${API_BASE_URL}/equipamentos`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (equipamentosResponse.ok) {
            const equipamentosData = await equipamentosResponse.json();
            const equipamentoSelect = document.querySelector('#os-form select[name="equipamento_id"]');
            equipamentoSelect.innerHTML = '<option value="">Selecione um equipamento</option>';
            equipamentosData.equipamentos.forEach(eq => {
                equipamentoSelect.innerHTML += `<option value="${eq.id}">${eq.nome} (${eq.codigo_interno})</option>`;
            });
        }
        
        // Carregar mecânicos para OS
        const mecanicosResponse = await fetch(`${API_BASE_URL}/mecanicos`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (mecanicosResponse.ok) {
            const mecanicosData = await mecanicosResponse.json();
            const mecanicoSelect = document.querySelector('#os-form select[name="mecanico_id"]');
            mecanicoSelect.innerHTML = '<option value="">Selecione um mecânico</option>';
            mecanicosData.mecanicos.forEach(mec => {
                mecanicoSelect.innerHTML += `<option value="${mec.id}">${mec.nome_completo}</option>`;
            });
        }
        
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
    }
}

// Carregar opções quando necessário
function showModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    
    // Carregar opções específicas para cada modal
    if (modalId === 'os-modal') {
        loadSelectOptions();
    }
}

// Adicionar animação CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);


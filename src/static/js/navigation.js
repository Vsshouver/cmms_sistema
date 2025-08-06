// Gerenciador de navegação
(() => {
<<<<<<< HEAD
var useState = React.useState, useEffect = React.useEffect;
=======
const { useState, useEffect } = React;
>>>>>>> 4e6505b08c67a825b5bec376a4dc6050a2784a72

class NavigationManager {
    constructor() {
        this.currentPage = 'dashboard';
        this.pages = new Map();
        this.sidebar = null;
        this.mainContent = null;
        this.menuToggle = null;
        this.isSidebarOpen = true;
        
        this.init();
    }

    init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupNavigation());
        } else {
            this.setupNavigation();
        }
    }

    setupNavigation() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('main-content');
        this.menuToggle = document.getElementById('menu-toggle');

        if (!this.sidebar || !this.mainContent) return;

        // Event listeners
        this.setupSidebarEvents();
        this.setupMenuToggle();

        // Carregar página inicial
        this.navigateTo('dashboard');
    }

    setupSidebarEvents() {
        // Links de navegação
        this.sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link');
            if (link && link.dataset.page) {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            }
        });
    }

    setupMenuToggle() {
        if (!this.menuToggle) return;

        this.menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.isSidebarOpen = !this.isSidebarOpen;
            this.updateSidebar();
        });

        // Fechar sidebar ao clicar fora
        document.addEventListener('click', (e) => {
            if (
                window.innerWidth <= 1024 &&
                this.isSidebarOpen &&
                !this.sidebar.contains(e.target) &&
                !this.menuToggle.contains(e.target)
            ) {
                this.isSidebarOpen = false;
                this.updateSidebar();
            }
        });
    }

    updateSidebar() {
        if (window.innerWidth <= 1024) {
            this.sidebar.classList.toggle('open', this.isSidebarOpen);
        } else {
            this.sidebar.classList.remove('open');
            this.sidebar.classList.toggle('closed', !this.isSidebarOpen);
        }
    }

    // Navegar para uma página
    async navigateTo(pageName) {
        if (this.currentPage === pageName) return;

        try {
            // Mostrar loading
            this.showPageLoading();

            // Carregar página se não estiver em cache
            if (!this.pages.has(pageName)) {
                await this.loadPage(pageName);
            }

            // Atualizar navegação ativa
            this.updateActiveNavigation(pageName);

            // Renderizar página
            const page = this.pages.get(pageName);
            if (page && page.render) {
                await page.render(this.mainContent);
            }

            this.currentPage = pageName;

            // Fechar sidebar no mobile
            if (window.innerWidth <= 1024) {
                this.isSidebarOpen = false;
                this.updateSidebar();
            }

        } catch (error) {
            console.error(`Erro ao carregar página ${pageName}:`, error);
            this.showPageError(error.message);
        }
    }

    // Carregar página dinamicamente
    async loadPage(pageName) {
        // Mapear nomes de página para classes ou funções de renderização
        const pageClasses = {
            'dashboard': 'DashboardPage',
            'ordens-servico': 'WorkOrdersPage',
            'preventivas': 'PreventivasPage',
            'backlog': 'BacklogPage',
            'equipamentos': 'EquipmentsPage',
            'tipos-equipamento': 'EquipmentTypesPage',
            'estoque': 'InventoryPage',
            'grupos-item': 'ItemGroupsPage',
            'movimentacoes': 'MovementsPage',
            'importacao': 'ImportPage',
            'pneus': 'TiresPage',
            'mecanicos': 'MechanicsPage',
            'usuarios': 'UsersPage',
            'tipos-manutencao': 'MaintenanceTypesPage',
            'analise-oleo': 'OilAnalysisPage'
        };

        const pageClass = pageClasses[pageName];
        if (!pageClass) {
            throw new Error(`Página ${pageName} não encontrada`);
        }

        // Verificar se a classe existe ou se há uma função de renderização no window.pages
        if (window.pages && window.pages[pageName]) {
            // Usar sistema de páginas modular
            const page = {
                render: window.pages[pageName].render
            };
            this.pages.set(pageName, page);
            return page;
        } else if (window[pageClass]) {
            // Usar classe tradicional
            const page = new window[pageClass]();
            this.pages.set(pageName, page);
            return page;
        } else {
            throw new Error(`Classe ${pageClass} não carregada`);
        }
    }

    // Atualizar navegação ativa
    updateActiveNavigation(pageName) {
        // Remover classe active de todos os links
        const navLinks = this.sidebar.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.remove('active'));

        // Adicionar classe active ao link atual
        const activeLink = this.sidebar.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');

            // Expandir grupo pai se necessário
            const navGroup = activeLink.closest('.nav-group');
            if (navGroup) {
                navGroup.classList.add('expanded');
            }
        }
    }

    // Mostrar loading da página
    showPageLoading() {
        this.mainContent.innerHTML = `
            <div class="page-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando página...</p>
            </div>
        `;
    }

    // Mostrar erro da página
    showPageError(message) {
        this.mainContent.innerHTML = `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar página</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    Recarregar
                </button>
            </div>
        `;
    }

    // Mostrar perfil do usuário
    showUserProfile() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const content = `
            <div class="user-profile">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" class="form-input" value="${user.nome_completo}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" value="${user.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cargo</label>
                        <input type="text" class="form-input" value="${user.cargo}" readonly>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nível de Acesso</label>
                        <input type="text" class="form-input" value="${user.nivel_acesso}" readonly>
                    </div>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Perfil do Usuário',
            content,
            size: 'md'
        });
    }

    // Mostrar configurações
    showUserSettings() {
        const content = `
            <div class="user-settings">
                <p class="text-gray-600 mb-4">
                    Configurações do sistema em desenvolvimento.
                </p>
                <div class="form-group">
                    <label class="form-label">Tema</label>
                    <select class="form-select">
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="auto">Automático</option>
                    </select>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Configurações',
            content,
            size: 'md'
        });
    }

    // Fazer logout
    async handleLogout() {
        const confirmed = await Modal.confirm(
            'Tem certeza que deseja sair do sistema?',
            'Confirmar Logout'
        );

        if (confirmed) {
            Loading.show('Fazendo logout...');
            await auth.logout();
            Loading.hide();
            location.reload();
        }
    }

    // Obter página atual
    getCurrentPage() {
        return this.currentPage;
    }

    // Verificar se página existe
    hasPage(pageName) {
        return this.pages.has(pageName);
    }
}

// Exportar classe para uso global
window.NavigationManager = NavigationManager;

// Gerenciar expansão dos grupos de navegação com React
function NavGroupManager() {
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        const groups = document.querySelectorAll('.nav-group');
        const initialState = {};

        groups.forEach((group, index) => {
            initialState[index] = group.classList.contains('expanded');

            const header = group.querySelector('.nav-group-header');
            if (header) {
                header.onclick = (e) => {
                    e.stopPropagation();
                    setExpandedGroups(prev => ({
                        ...prev,
                        [index]: !prev[index]
                    }));
                };
            }
        });

        setExpandedGroups(initialState);
    }, []);

    useEffect(() => {
        const groups = document.querySelectorAll('.nav-group');
        groups.forEach((group, index) => {
            const expanded = !!expandedGroups[index];
            group.classList.toggle('expanded', expanded);
        });
    }, [expandedGroups]);

    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const rootEl = document.createElement('div');
    document.body.appendChild(rootEl);
    const root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(NavGroupManager));
});

})();

// Aplicação principal CMMS
class CMSApp {
    constructor() {
        this.initialized = false;
        this.loadingScreen = null;
        this.loginScreen = null;
        this.appContainer = null;
        Utils.setupFormObserver();

        this.init();
    }

    async init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        try {
            // Obter elementos da interface
            this.loadingScreen = document.getElementById('loading-screen');
            this.loginScreen = document.getElementById('login-screen');
            this.appContainer = document.getElementById('app');

            // Mostrar tela de loading
            this.showLoading();

            // Verificar autenticação
            const isAuthenticated = await this.checkAuthentication();

            if (isAuthenticated) {
                // Usuário autenticado - mostrar aplicação
                await this.showApp();
            } else {
                // Usuário não autenticado - mostrar login
                this.showLogin();
            }

            // Configurar callbacks de autenticação
            this.setupAuthCallbacks();

            this.initialized = true;

        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            this.showError('Erro ao carregar aplicação. Recarregue a página.');
        }
    }

    async checkAuthentication() {
        try {
            // Verificar se há token salvo
            const token = localStorage.getItem('token');
            if (!token) {
                return false;
            }

            // Verificar se token é válido
            return await auth.checkAuth();
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }

    showLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
        if (this.loginScreen) {
            this.loginScreen.style.display = 'none';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'none';
        }
    }

    showLogin() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
        if (this.loginScreen) {
            this.loginScreen.style.display = 'flex';
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'none';
        }
    }

    async showApp() {
        try {
            // Atualizar informações do usuário na interface
            this.updateUserInterface();

            // Mostrar aplicação
            if (this.loadingScreen) {
                this.loadingScreen.style.display = 'none';
            }
            if (this.loginScreen) {
                this.loginScreen.style.display = 'none';
            }
            if (this.appContainer) {
                this.appContainer.style.display = 'grid';
            }

            // Carregar notificações
            await this.loadNotifications();

        } catch (error) {
            console.error('Erro ao mostrar aplicação:', error);
            Toast.error('Erro ao carregar aplicação');
        }
    }

    updateUserInterface() {
        const user = auth.getCurrentUser();
        if (!user) return;

        // Atualizar nome do usuário no header
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.nome_completo || user.username;
        }

        // Atualizar saudação se existir
        const greetingElement = document.querySelector('.greeting');
        if (greetingElement) {
            greetingElement.textContent = `${Utils.getGreeting()}, ${user.nome_completo?.split(' ')[0] || user.username}!`;
        }

        // Mostrar/ocultar elementos baseado em permissões
        this.updatePermissionBasedElements();
    }

    updatePermissionBasedElements() {
        // Elementos que requerem permissão de administrador
        const adminElements = document.querySelectorAll('[data-permission="admin"]');
        adminElements.forEach(element => {
            element.style.display = auth.hasPermission('admin') ? 'block' : 'none';
        });

        // Elementos que requerem permissão de supervisor
        const supervisorElements = document.querySelectorAll('[data-permission="supervisor"]');
        supervisorElements.forEach(element => {
            element.style.display = auth.hasPermission('supervisor') ? 'block' : 'none';
        });

        // Elementos que requerem permissão de almoxarife
        const almoxarifeElements = document.querySelectorAll('[data-permission="almoxarife"]');
        almoxarifeElements.forEach(element => {
            element.style.display = auth.hasPermission('almoxarife') ? 'block' : 'none';
        });
    }

    async loadNotifications() {
        try {
            let total = 0;

            if (auth.hasPermission('mecanico')) {
                const alerts = await API.workOrders.getMechanicAlerts();
                total += alerts.total_alertas || 0;
            }

            if (auth.hasPermission('supervisor') || auth.hasPermission('admin')) {
                const tireAlerts = await API.tires.getAlerts();
                total += tireAlerts.total_alertas || 0;
            }

            this.updateNotificationBadge(total);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    setupAuthCallbacks() {
        // Callback de login bem-sucedido
        auth.onLogin((user) => {
            console.log('Login realizado:', user);
            this.showApp();
        });

        // Callback de logout
        auth.onLogout(() => {
            console.log('Logout realizado');
            this.showLogin();
        });
    }

    showError(message) {
        // Mostrar erro na tela de loading
        if (this.loadingScreen) {
            const loadingContent = this.loadingScreen.querySelector('p');
            if (loadingContent) {
                loadingContent.textContent = message;
                loadingContent.style.color = '#ef4444';
            }

            // Adicionar botão de recarregar
            const reloadBtn = document.createElement('button');
            reloadBtn.className = 'btn btn-primary mt-4';
            reloadBtn.innerHTML = '<i class="fas fa-refresh"></i> Recarregar';
            reloadBtn.onclick = () => location.reload();
            
            this.loadingScreen.appendChild(reloadBtn);
        }
    }

    // Método para reinicializar a aplicação
    async restart() {
        this.initialized = false;
        await this.start();
    }

    // Método para obter informações da aplicação
    getInfo() {
        return {
            initialized: this.initialized,
            currentUser: auth.getCurrentUser(),
            currentPage: navigation.getCurrentPage()
        };
    }
}

// Event listeners globais
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tooltips se necessário
    initializeTooltips();
    
    // Configurar atalhos de teclado
    setupKeyboardShortcuts();
    
    // Configurar tratamento de erros globais
    setupGlobalErrorHandling();
});

// Inicializar tooltips
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    if (!document.getElementById('tooltip-style')) {
        const style = document.createElement('style');
        style.id = 'tooltip-style';
        style.textContent = `
            .tooltip{position:absolute;padding:4px 8px;background:#333;color:#fff;border-radius:4px;font-size:12px;z-index:10000;pointer-events:none;white-space:nowrap;}
        `;
        document.head.appendChild(style);
    }

    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            const text = element.dataset.tooltip;
            if (!text) return;
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = text;
            document.body.appendChild(tooltip);
            const rect = element.getBoundingClientRect();
            const tipRect = tooltip.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2 - tipRect.width / 2 + window.scrollX}px`;
            tooltip.style.top = `${rect.top - tipRect.height - 8 + window.scrollY}px`;
            element._tooltip = tooltip;
        });
        element.addEventListener('mouseleave', () => {
            if (element._tooltip) {
                element._tooltip.remove();
                element._tooltip = null;
            }
        });
    });
}

// Configurar atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-bar input');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Esc para fechar modals
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal-overlay');
            if (activeModal) {
                Modal.close(activeModal);
            }
        }
    });
}

// Configurar tratamento de erros globais
function setupGlobalErrorHandling() {
    // Capturar erros JavaScript não tratados
    window.addEventListener('error', (e) => {
        console.error('Erro global:', e.error);
        
        // Não mostrar toast para erros de script externo
        if (e.filename && !e.filename.includes(window.location.origin)) {
            return;
        }
        
        Toast.error('Ocorreu um erro inesperado. Recarregue a página se o problema persistir.');
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Promise rejeitada:', e.reason);
        
        // Prevenir que o erro apareça no console do browser
        e.preventDefault();
        
        Toast.error('Erro de comunicação. Verifique sua conexão.');
    });
}

// Inicializar aplicação
const app = new CMSApp();

// Exportar para uso global
window.app = app;
window.CMSApp = CMSApp;


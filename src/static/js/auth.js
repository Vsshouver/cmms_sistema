// Gerenciador de autenticação
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.loginCallbacks = [];
        this.logoutCallbacks = [];
    }

    // Verificar se usuário está logado
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }

    // Fazer login
    async login(credentials) {
        try {
            const response = await API.auth.login(credentials);

            // Depuração da resposta recebida
            console.log('login response', response);

            // Alguns backends retornam dados aninhados em `data`
            const token = response.token || response.data?.token;
            const user = response.user || response.data?.user;

            if (token) {
                this.token = token;
                this.currentUser = user;

                // Salvar token localmente para persistência
                api.setToken(this.token);

                // Executar callbacks de login registrados
                this.loginCallbacks.forEach(callback => callback(this.currentUser));

                return { success: true, user: this.currentUser };
            } else {
                throw new Error('Token não recebido');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    // Fazer logout
    async logout(skipServer = false) {
        try {
            // Tentar fazer logout no servidor, caso seja uma ação voluntária
            if (!skipServer) {
                await API.auth.logout();
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            // Limpar dados locais
            this.token = null;
            this.currentUser = null;

            // Remover token
            api.setToken(null);

            // Executar callbacks de logout
            this.logoutCallbacks.forEach(callback => callback());
        }
    }

    // Verificar dados do usuário atual
    async checkAuth() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await API.auth.me();
            this.currentUser = response.user;
            return true;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            this.logout();
            return false;
        }
    }

    // Verificar permissão
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const userLevel = this.currentUser.nivel_acesso;
        
        // Hierarquia de permissões
        const hierarchy = {
            'ADM': 5,
            'Supervisor': 4,
            'PCM': 3,
            'Almoxarife': 2,
            'Mecanico': 1
        };
        
        const permissionLevels = {
            'admin': 5,
            'supervisor': 4,
            'pcm': 3,
            'almoxarife': 2,
            'mecanico': 1,
            'read': 1
        };
        
        const userLevelValue = hierarchy[userLevel] || 0;
        const requiredLevel = permissionLevels[permission] || 0;
        
        return userLevelValue >= requiredLevel;
    }

    // Adicionar callback de login
    onLogin(callback) {
        this.loginCallbacks.push(callback);
    }

    // Adicionar callback de logout
    onLogout(callback) {
        this.logoutCallbacks.push(callback);
    }

    // Remover callback
    removeCallback(callback, type = 'login') {
        const callbacks = type === 'login' ? this.loginCallbacks : this.logoutCallbacks;
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }
}

// Instância global do gerenciador de autenticação
const auth = new AuthManager();

// Gerenciador do formulário de login
class LoginForm {
    constructor() {
        this.form = null;
        this.emailInput = null;
        this.passwordInput = null;
        this.submitButton = null;
        this.errorDiv = null;
        this.togglePasswordButton = null;
        
        this.init();
    }

    init() {
        // Aguardar DOM carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupForm());
        } else {
            this.setupForm();
        }
    }

    setupForm() {
        this.form = document.getElementById('login-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.submitButton = this.form?.querySelector('button[type="submit"]');
        this.errorDiv = document.getElementById('login-error');
        this.togglePasswordButton = document.querySelector('.toggle-password');

        if (!this.form) return;

        // Event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        if (this.togglePasswordButton) {
            this.togglePasswordButton.addEventListener('click', () => this.togglePassword());
        }

        // Auto-focus no campo de email
        if (this.emailInput) {
            this.emailInput.focus();
        }

        Utils.applyFormStyles(this.form);
    }

    async handleSubmit(e) {
        e.preventDefault();
        Utils.clearFormErrors(this.form);

        const email = this.emailInput?.value.trim();
        const senha = this.passwordInput?.value;

        const errors = {};
        if (!email) errors.email = 'Campo obrigatório';
        if (!senha) errors.password = 'Campo obrigatório';
        if (Object.keys(errors).length) {
            Utils.showFormErrors(this.form, errors);
            return;
        }

        this.setLoading(true);
        this.hideError();

        const result = await auth.login({ email, senha });

        if (result.success) {
            // Login bem-sucedido - a aplicação será carregada pelos callbacks
            this.showSuccess('Login realizado com sucesso!');

            // Redirecionar/inicializar app após breve atraso
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } else {
            this.showError(result.error || 'Erro ao fazer login. Verifique suas credenciais.');
            Utils.showFormErrors(this.form, { password: result.error || 'Credenciais inválidas' });
        }

        this.setLoading(false);
    }

    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.togglePasswordButton.querySelector('i');
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    }

    setLoading(loading) {
        if (this.submitButton) {
            this.submitButton.disabled = loading;
            
            const icon = this.submitButton.querySelector('i');
            if (icon) {
                icon.className = loading ? 'fas fa-spinner fa-spin' : 'fas fa-sign-in-alt';
            }
        }
    }

    showError(message) {
        if (this.errorDiv) {
            this.errorDiv.textContent = message;
            this.errorDiv.style.display = 'block';
        }
    }

    hideError() {
        if (this.errorDiv) {
            this.errorDiv.style.display = 'none';
        }
        Utils.clearFormErrors(this.form);
    }

    showSuccess(message) {
        // Mostrar mensagem de sucesso (pode usar toast)
        if (window.Toast) {
            Toast.show(message, 'success');
        }
    }
}

// Inicializar formulário de login
const loginForm = new LoginForm();

// Exportar para uso global
window.auth = auth;
window.AuthManager = AuthManager;


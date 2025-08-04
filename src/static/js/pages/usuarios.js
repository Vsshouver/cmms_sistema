class UsersPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = '';
        this.statusFilter = '';
        this.accessLevelFilter = '';
    }

    async render(container) {
        try {
            container.innerHTML = this.getLoadingHTML();
            await this.loadData();
            container.innerHTML = this.getMainHTML();
            this.bindEvents();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.users.getAll();
            this.data = Array.isArray(response) ? response : (response.data || []);
            this.filteredData = [...this.data];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            this.filteredData = [];
            throw error;
        }
    }

    getLoadingHTML() {
        return `
            <div class="page-loading">
                <div class="loading-spinner"></div>
                <p>Carregando usuários...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">⚠️</div>
                <h3>Erro ao carregar usuários</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Tentar novamente</button>
            </div>
        `;
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-users"></i> Usuários</h1>
                    <p>Gerencie os usuários do sistema</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="this.refreshData()">
                        <i class="icon-refresh"></i> Atualizar
                    </button>
                    <button class="btn btn-primary" onclick="this.openCreateModal()">
                        <i class="icon-plus"></i> Novo Usuário
                    </button>
                </div>
            </div>

            <div class="page-filters">
                <div class="filter-group">
                    <label>Status</label>
                    <select onchange="this.handleStatusFilter(event)">
                        <option value="">Todos</option>
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Nível de Acesso</label>
                    <select onchange="this.handleAccessLevelFilter(event)">
                        <option value="">Todos</option>
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="pcm">PCM</option>
                        <option value="almoxarife">Almoxarife</option>
                        <option value="mecanico">Mecânico</option>
                        <option value="operador">Operador</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Buscar</label>
                    <div class="search-input">
                        <input type="text" 
                               placeholder="Nome, email, cargo..." 
                               value="${this.searchTerm}"
                               onkeyup="this.handleSearch(event)">
                        <i class="icon-search"></i>
                    </div>
                </div>
                <button class="btn btn-outline" onclick="this.clearFilters()">
                    <i class="icon-x"></i> Limpar
                </button>
            </div>

            <div class="page-content">
                ${this.getStatsHTML()}
                ${this.getTableHTML()}
                ${this.getPaginationHTML()}
            </div>
        `;
    }

    getStatsHTML() {
        const total = this.data.length;
        const ativos = this.data.filter(item => item.ativo === true).length;
        const inativos = this.data.filter(item => item.ativo === false).length;
        const admins = this.data.filter(item => item.nivel_acesso === 'admin').length;
        
        return `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success-light);">
                        <i class="icon-user-check" style="color: var(--success);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${ativos}</div>
                        <div class="stat-label">Ativos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--danger-light);">
                        <i class="icon-user-x" style="color: var(--danger);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${inativos}</div>
                        <div class="stat-label">Inativos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning-light);">
                        <i class="icon-shield" style="color: var(--warning);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${admins}</div>
                        <div class="stat-label">Administradores</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--primary-light);">
                        <i class="icon-users" style="color: var(--primary);"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${total}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>
            </div>
        `;
    }

    getTableHTML() {
        if (this.filteredData.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <h3>Nenhum usuário encontrado</h3>
                    <p>Tente ajustar os filtros ou adicionar novos usuários</p>
                </div>
            `;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Cargo</th>
                            <th>Nível de Acesso</th>
                            <th>Status</th>
                            <th>Último Login</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(item => this.getTableRowHTML(item)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getTableRowHTML(item) {
        const statusBadge = item.ativo === true ? 
            '<span class="badge badge-success">Ativo</span>' : 
            '<span class="badge badge-secondary">Inativo</span>';

        const accessLevelBadges = {
            'admin': '<span class="badge badge-danger">Administrador</span>',
            'supervisor': '<span class="badge badge-warning">Supervisor</span>',
            'pcm': '<span class="badge badge-info">PCM</span>',
            'almoxarife': '<span class="badge badge-primary">Almoxarife</span>',
            'mecanico': '<span class="badge badge-success">Mecânico</span>',
            'operador': '<span class="badge badge-secondary">Operador</span>'
        };

        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="icon-user"></i>
                        </div>
                        <div class="user-details">
                            <strong>${item.nome_completo || item.username || '-'}</strong>
                            <small>${item.username || '-'}</small>
                        </div>
                    </div>
                </td>
                <td>${item.email || '-'}</td>
                <td>${item.cargo || '-'}</td>
                <td>${accessLevelBadges[item.nivel_acesso] || '<span class="badge badge-secondary">Não definido</span>'}</td>
                <td>${statusBadge}</td>
                <td>${Utils.formatDateTime(item.ultimo_login) || 'Nunca'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="this.viewItem(${item.id})" title="Visualizar">
                            <i class="icon-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.editItem(${item.id})" title="Editar">
                            <i class="icon-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="this.resetPassword(${item.id})" title="Resetar Senha">
                            <i class="icon-key"></i>
                        </button>
                        <button class="btn btn-sm btn-outline ${item.ativo ? 'btn-warning' : 'btn-success'}" 
                                onclick="this.toggleStatus(${item.id})" 
                                title="${item.ativo ? 'Desativar' : 'Ativar'}">
                            <i class="icon-${item.ativo ? 'user-x' : 'user-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-danger" onclick="this.deleteItem(${item.id})" title="Excluir">
                            <i class="icon-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getPaginationHTML() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';

        return `
            <div class="pagination-container">
                <div class="pagination-info">
                    Mostrando ${((this.currentPage - 1) * this.itemsPerPage) + 1} a ${Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length)} de ${this.filteredData.length} registros
                </div>
                <div class="pagination">
                    <button class="btn btn-sm btn-outline" 
                            onclick="this.goToPage(${this.currentPage - 1})"
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="icon-chevron-left"></i>
                    </button>
                    
                    ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                        const page = i + 1;
                        const isActive = page === this.currentPage;
                        return `
                            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}"
                                    onclick="this.goToPage(${page})">
                                ${page}
                            </button>
                        `;
                    }).join('')}
                    
                    <button class="btn btn-sm btn-outline" 
                            onclick="this.goToPage(${this.currentPage + 1})"
                            ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="icon-chevron-right"></i>
                    </button>
                </div>
                <select class="form-select" onchange="this.changeItemsPerPage(event)">
                    <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 por página</option>
                    <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25 por página</option>
                    <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 por página</option>
                </select>
            </div>
        `;
    }

    bindEvents() {
        // Bind dos eventos será feito via onclick nos elementos HTML
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.applyFilters();
    }

    handleStatusFilter(event) {
        this.statusFilter = event.target.value;
        this.applyFilters();
    }

    handleAccessLevelFilter(event) {
        this.accessLevelFilter = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            const searchMatch = !this.searchTerm || 
                (item.nome_completo && item.nome_completo.toLowerCase().includes(this.searchTerm)) ||
                (item.username && item.username.toLowerCase().includes(this.searchTerm)) ||
                (item.email && item.email.toLowerCase().includes(this.searchTerm)) ||
                (item.cargo && item.cargo.toLowerCase().includes(this.searchTerm));

            const statusMatch = !this.statusFilter || item.ativo.toString() === this.statusFilter;
            const accessLevelMatch = !this.accessLevelFilter || item.nivel_acesso === this.accessLevelFilter;

            return searchMatch && statusMatch && accessLevelMatch;
        });

        this.currentPage = 1;
        this.updateContent();
    }

    clearFilters() {
        this.searchTerm = '';
        this.statusFilter = '';
        this.accessLevelFilter = '';
        this.filteredData = [...this.data];
        this.currentPage = 1;
        this.updateContent();
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateContent();
        }
    }

    changeItemsPerPage(event) {
        this.itemsPerPage = parseInt(event.target.value);
        this.currentPage = 1;
        this.updateContent();
    }

    updateContent() {
        const container = document.querySelector('.page-content');
        if (container) {
            container.innerHTML = `
                ${this.getStatsHTML()}
                ${this.getTableHTML()}
                ${this.getPaginationHTML()}
            `;
        }
    }

    async refreshData() {
        try {
            await this.loadData();
            this.applyFilters();
            Utils.showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            Utils.showNotification('Erro ao atualizar dados', 'error');
        }
    }

    openCreateModal() {
        const modalContent = `
            <form id="user-form" class="form-grid">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" name="nome" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">E-mail *</label>
                    <input type="email" name="email" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Senha *</label>
                    <input type="password" name="senha" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Confirmar Senha *</label>
                    <input type="password" name="confirmar_senha" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cargo</label>
                    <input type="text" name="cargo" class="form-input">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nível de Acesso *</label>
                    <select name="nivel_acesso" class="form-select" required>
                        <option value="">Selecione um nível</option>
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="pcm">PCM</option>
                        <option value="almoxarife">Almoxarife</option>
                        <option value="mecanico">Mecânico</option>
                        <option value="operador">Operador</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select name="ativo" class="form-select" required>
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Telefone</label>
                    <input type="tel" name="telefone" class="form-input">
                </div>
            </form>
        `;

        const modal = Modal.show({
            title: 'Novo Usuário',
            content: modalContent,
            size: 'lg'
        });

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" data-action="save">Salvar</button>
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'cancel') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'save') {
                await this.saveUser(modal);
            }
        });
    }

    viewItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.showViewModal(item);
        }
    }

    editItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            this.openEditModal(item);
        }
    }

    openEditModal(user) {
        const modalContent = `
            <form id="user-form" class="form-grid">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" name="nome" class="form-input" value="${user.nome_completo || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">E-mail *</label>
                    <input type="email" name="email" class="form-input" value="${user.email || ''}" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nova Senha</label>
                    <input type="password" name="senha" class="form-input" placeholder="Deixe em branco para manter a atual">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Confirmar Nova Senha</label>
                    <input type="password" name="confirmar_senha" class="form-input" placeholder="Deixe em branco para manter a atual">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Cargo</label>
                    <input type="text" name="cargo" class="form-input" value="${user.cargo || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Nível de Acesso *</label>
                    <select name="nivel_acesso" class="form-select" required>
                        <option value="">Selecione um nível</option>
                        <option value="admin" ${user.nivel_acesso === 'admin' ? 'selected' : ''}>Administrador</option>
                        <option value="supervisor" ${user.nivel_acesso === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                        <option value="pcm" ${user.nivel_acesso === 'pcm' ? 'selected' : ''}>PCM</option>
                        <option value="almoxarife" ${user.nivel_acesso === 'almoxarife' ? 'selected' : ''}>Almoxarife</option>
                        <option value="mecanico" ${user.nivel_acesso === 'mecanico' ? 'selected' : ''}>Mecânico</option>
                        <option value="operador" ${user.nivel_acesso === 'operador' ? 'selected' : ''}>Operador</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Status *</label>
                    <select name="ativo" class="form-select" required>
                        <option value="true" ${user.ativo ? 'selected' : ''}>Ativo</option>
                        <option value="false" ${!user.ativo ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Telefone</label>
                    <input type="tel" name="telefone" class="form-input" value="${user.telefone || ''}">
                </div>
            </form>
        `;

        const modal = Modal.show({
            title: 'Editar Usuário',
            content: modalContent,
            size: 'lg'
        });

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
            <button type="button" class="btn btn-primary" data-action="save">Salvar</button>
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'cancel') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'save') {
                await this.updateUser(modal, user.id);
            }
        });
    }

    async saveUser(modal) {
        try {
            const form = modal.querySelector('#user-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validação básica
            if (!data.nome || !data.email || !data.senha || !data.nivel_acesso) {
                Toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            if (data.senha !== data.confirmar_senha) {
                Toast.error('As senhas não coincidem');
                return;
            }

            // Remover campo de confirmação
            delete data.confirmar_senha;

            // Converter ativo para boolean
            data.ativo = data.ativo === 'true';

            Loading.show('Salvando usuário...');

            await API.users.create(data);
            
            Loading.hide();
            Modal.close(modal);
            Toast.success('Usuário criado com sucesso!');
            
            // Recarregar dados
            await this.refreshData();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao salvar usuário:', error);
            Toast.error('Erro ao salvar usuário: ' + (error.message || 'Erro desconhecido'));
        }
    }

    async updateUser(modal, userId) {
        try {
            const form = modal.querySelector('#user-form');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validação básica
            if (!data.nome || !data.email || !data.nivel_acesso) {
                Toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            // Validar senhas se foram preenchidas
            if (data.senha || data.confirmar_senha) {
                if (data.senha !== data.confirmar_senha) {
                    Toast.error('As senhas não coincidem');
                    return;
                }
            } else {
                // Remover campos de senha se estão vazios
                delete data.senha;
            }

            // Remover campo de confirmação
            delete data.confirmar_senha;

            // Converter ativo para boolean
            data.ativo = data.ativo === 'true';

            Loading.show('Atualizando usuário...');

            await API.users.update(userId, data);
            
            Loading.hide();
            Modal.close(modal);
            Toast.success('Usuário atualizado com sucesso!');
            
            // Recarregar dados
            await this.refreshData();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao atualizar usuário:', error);
            Toast.error('Erro ao atualizar usuário: ' + (error.message || 'Erro desconhecido'));
        }
    }

    async deleteItem(userId) {
        const user = this.data.find(u => u.id === userId);
        if (!user) return;

        try {
            const confirmed = await Modal.confirm(
                `Tem certeza que deseja excluir o usuário "${user.nome_completo || user.username}"?`,
                'Confirmar Exclusão'
            );

            if (!confirmed) return;

            Loading.show('Excluindo usuário...');

            await API.users.delete(userId);
            
            Loading.hide();
            Toast.success('Usuário excluído com sucesso!');
            
            // Recarregar dados
            await this.refreshData();

        } catch (error) {
            Loading.hide();
            console.error('Erro ao excluir usuário:', error);
            Toast.error('Erro ao excluir usuário: ' + (error.message || 'Erro desconhecido'));
        }
    }

    showViewModal(user) {
        const modalContent = `
            <div class="user-details">
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Nome:</label>
                        <span>${user.nome_completo || user.username || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>E-mail:</label>
                        <span>${user.email || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Cargo:</label>
                        <span>${user.cargo || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Nível de Acesso:</label>
                        <span class="badge badge-info">${this.getAccessLevelLabel(user.nivel_acesso)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="badge badge-${user.ativo ? 'success' : 'error'}">${user.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Telefone:</label>
                        <span>${user.telefone || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Criado em:</label>
                        <span>${user.created_at ? Utils.formatDate(user.created_at) : '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Último acesso:</label>
                        <span>${user.ultimo_login ? Utils.formatDate(user.ultimo_login) : 'Nunca'}</span>
                    </div>
                </div>
            </div>
        `;

        const modal = Modal.show({
            title: `Detalhes do Usuário: ${user.nome_completo || user.username}`,
            content: modalContent,
            size: 'lg'
        });

        // Adicionar botões no footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        footer.innerHTML = `
            <button type="button" class="btn btn-secondary" data-action="close">Fechar</button>
            ${auth.hasPermission('admin') ? `
                <button type="button" class="btn btn-warning" data-action="edit">Editar</button>
                <button type="button" class="btn btn-danger" data-action="delete">Excluir</button>
            ` : ''}
        `;
        modal.querySelector('.modal-body').appendChild(footer);

        // Event listeners
        modal.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'close') {
                Modal.close(modal);
            } else if (e.target.dataset.action === 'edit') {
                Modal.close(modal);
                this.openEditModal(user);
            } else if (e.target.dataset.action === 'delete') {
                Modal.close(modal);
                await this.deleteItem(user.id);
            }
        });
    }

    getAccessLevelLabel(level) {
        const labels = {
            'admin': 'Administrador',
            'supervisor': 'Supervisor',
            'pcm': 'PCM',
            'almoxarife': 'Almoxarife',
            'mecanico': 'Mecânico',
            'operador': 'Operador'
        };
        return labels[level] || level;
    }

    resetPassword(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja resetar a senha do usuário "${item.nome_completo || item.username}"?`)) {
            Utils.showNotification(`Senha resetada para: ${item.nome_completo || item.username}`, 'success');
        }
    }

    toggleStatus(id) {
        const item = this.data.find(item => item.id === id);
        if (item) {
            const action = item.ativo ? 'desativar' : 'ativar';
            if (confirm(`Deseja ${action} o usuário "${item.nome_completo || item.username}"?`)) {
                Utils.showNotification(`Usuário ${action}do: ${item.nome_completo || item.username}`, 'success');
            }
        }
    }

    deleteItem(id) {
        const item = this.data.find(item => item.id === id);
        if (item && confirm(`Deseja realmente excluir o usuário "${item.nome_completo || item.username}"?`)) {
            Utils.showNotification(`Excluindo: ${item.nome_completo || item.username}`, 'info');
        }
    }
}

window.UsersPage = UsersPage;


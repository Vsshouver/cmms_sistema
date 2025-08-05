// Página de Usuários com AG-Grid
class UsersPage {
    constructor() {
        this.gridApi = null;
        this.gridColumnApi = null;
        this.data = [];
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar AG-Grid
            this.setupGrid(container);

            // Configurar eventos
            this.setupEvents(container);

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.users.getAll();
            this.data = Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            throw error;
        }
    }

    getLoadingHTML() {
        return `
            <div class="page-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando usuários...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar usuários</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('usuarios')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="users-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-user-cog"></i>
                        <div>
                            <h1>Usuários</h1>
                            <p>Gerencie os usuários do sistema</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-data">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-user" ${!auth.hasPermission('admin') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Novo Usuário
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-ativos">0</div>
                            <div class="stat-label">Ativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-user-times"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-inativos">0</div>
                            <div class="stat-label">Inativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-user-shield"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-admins">0</div>
                            <div class="stat-label">Administradores</div>
                        </div>
                    </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="users-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
                </div>
            </div>
        `;
    }

    setupGrid(container) {
        const gridContainer = container.querySelector('#users-grid');
        
        const columnDefs = [
            {
                headerName: 'Usuário',
                field: 'nome',
                minWidth: 200,
                cellRenderer: (params) => {
                    const avatar = params.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(params.value || '')}&background=random`;
                    return `
                        <div class="user-cell">
                            <img src="${avatar}" alt="${params.value}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(params.value || '')}&background=random'">
                            <div class="user-info">
                                <div class="user-name">${params.value || ''}</div>
                                <div class="user-email">${params.data.email || ''}</div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                headerName: 'Perfil',
                field: 'perfil',
                minWidth: 120,
                cellRenderer: (params) => {
                    const perfilMap = {
                        'admin': '<span class="role-badge role-admin">Administrador</span>',
                        'pcm': '<span class="role-badge role-pcm">PCM</span>',
                        'mecanico': '<span class="role-badge role-mechanic">Mecânico</span>',
                        'almoxarife': '<span class="role-badge role-warehouse">Almoxarife</span>',
                        'operador': '<span class="role-badge role-operator">Operador</span>',
                        'visualizador': '<span class="role-badge role-viewer">Visualizador</span>'
                    };
                    return perfilMap[params.value] || params.value;
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['admin', 'pcm', 'mecanico', 'almoxarife', 'operador', 'visualizador'],
                    valueFormatter: (params) => {
                        const perfilMap = {
                            'admin': 'Administrador',
                            'pcm': 'PCM',
                            'mecanico': 'Mecânico',
                            'almoxarife': 'Almoxarife',
                            'operador': 'Operador',
                            'visualizador': 'Visualizador'
                        };
                        return perfilMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Status',
                field: 'ativo',
                minWidth: 100,
                cellRenderer: (params) => {
                    return params.value 
                        ? '<span class="status-badge status-success">Ativo</span>'
                        : '<span class="status-badge status-danger">Inativo</span>';
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: [true, false],
                    valueFormatter: (params) => params.value ? 'Ativo' : 'Inativo'
                }
            },
            {
                headerName: 'Telefone',
                field: 'telefone',
                minWidth: 130
            },
            {
                headerName: 'Departamento',
                field: 'departamento',
                minWidth: 150
            },
            {
                headerName: 'Último Acesso',
                field: 'ultimo_acesso',
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '-';
                    return AGGridConfig.formatters.datetime(params);
                },
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Criado em',
                field: 'created_at',
                minWidth: 130,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter',
                hide: true
            },
            {
                headerName: 'Ações',
                field: 'actions',
                minWidth: 150,
                maxWidth: 150,
                sortable: false,
                filter: false,
                resizable: false,
                pinned: 'right',
                cellRenderer: (params) => {
                    const canEdit = auth.hasPermission('admin');
                    const canDelete = auth.hasPermission('admin') && params.data.id !== auth.getCurrentUser()?.id;
                    
                    let html = '<div class="ag-actions">';
                    
                    html += `<button class="btn-action btn-view" onclick="usersPage.viewUser(${params.data.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    
                    if (canEdit) {
                        html += `<button class="btn-action btn-edit" onclick="usersPage.editUser(${params.data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>`;
                        
                        html += `<button class="btn-action btn-key" onclick="usersPage.resetPassword(${params.data.id})" title="Redefinir Senha">
                            <i class="fas fa-key"></i>
                        </button>`;
                    }
                    
                    if (canDelete) {
                        html += `<button class="btn-action btn-delete" onclick="usersPage.deleteUser(${params.data.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>`;
                    }
                    
                    html += '</div>';
                    return html;
                }
            }
        ];

        const gridOptions = {
            ...AGGridConfig.getDefaultOptions(),
            columnDefs: columnDefs,
            rowData: this.data,
            onGridReady: (params) => {
                this.gridApi = params.api;
                this.gridColumnApi = params.columnApi;
                this.updateStats();
                
                // Auto-size columns
                params.api.sizeColumnsToFit();
            },
            onSelectionChanged: () => {
                this.updateSelectionInfo();
            },
            onFilterChanged: () => {
                this.updateStats();
            },
            // Configurações específicas
            rowSelection: 'multiple',
            suppressRowClickSelection: true,
            enableRangeSelection: true,
            enableCharts: true,
            sideBar: {
                toolPanels: [
                    {
                        id: 'columns',
                        labelDefault: 'Colunas',
                        labelKey: 'columns',
                        iconKey: 'columns',
                        toolPanel: 'agColumnsToolPanel'
                    },
                    {
                        id: 'filters',
                        labelDefault: 'Filtros',
                        labelKey: 'filters',
                        iconKey: 'filter',
                        toolPanel: 'agFiltersToolPanel'
                    }
                ],
                defaultToolPanel: 'columns'
            }
        };

        this.grid = AGGridConfig.createGrid(gridContainer, gridOptions);
    }

    setupEvents(container) {
        // Botão de refresh
        const refreshBtn = container.querySelector('#refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Botão de exportar
        const exportBtn = container.querySelector('#export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Botão de novo usuário
        const createBtn = container.querySelector('#create-user');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }
    }

    async refresh() {
        try {
            await this.loadData();
            if (this.gridApi) {
                this.gridApi.setRowData(this.data);
                this.updateStats();
            }
            Utils.showToast('Dados atualizados com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            Utils.showToast('Erro ao atualizar dados', 'error');
        }
    }

    exportData() {
        if (this.gridApi) {
            this.gridApi.exportDataAsCsv({
                fileName: `usuarios_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';'
            });
        }
    }

    updateStats() {
        const stats = {
            total: this.data.length,
            ativos: this.data.filter(user => user.ativo).length,
            inativos: this.data.filter(user => !user.ativo).length,
            admins: this.data.filter(user => user.perfil === 'admin').length
        };

        // Se há filtros aplicados, usar dados filtrados
        if (this.gridApi) {
            const filteredData = [];
            this.gridApi.forEachNodeAfterFilter(node => {
                filteredData.push(node.data);
            });
            
            if (filteredData.length !== this.data.length) {
                stats.total = filteredData.length;
                stats.ativos = filteredData.filter(user => user.ativo).length;
                stats.inativos = filteredData.filter(user => !user.ativo).length;
                stats.admins = filteredData.filter(user => user.perfil === 'admin').length;
            }
        }

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-ativos').textContent = stats.ativos;
        document.getElementById('stat-inativos').textContent = stats.inativos;
        document.getElementById('stat-admins').textContent = stats.admins;
    }

    updateSelectionInfo() {
        if (this.gridApi) {
            const selectedRows = this.gridApi.getSelectedRows();
            console.log('Usuários selecionados:', selectedRows.length);
        }
    }

    // Métodos de ação
    viewUser(id) {
        const user = this.data.find(user => user.id === id);
        if (user) {
            this.showViewModal(user);
        }
    }

    editUser(id) {
        const user = this.data.find(user => user.id === id);
        if (user) {
            this.showEditModal(user);
        }
    }

    async resetPassword(id) {
        const user = this.data.find(user => user.id === id);
        if (!user) return;

        const confirmed = await Utils.showConfirm(
            'Redefinir Senha',
            `Tem certeza que deseja redefinir a senha do usuário "${user.nome}"?`,
            'Redefinir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                const newPassword = await API.users.resetPassword(id);
                Utils.showAlert(
                    'Senha Redefinida',
                    `Nova senha para ${user.nome}: <strong>${newPassword}</strong><br><br>Anote esta senha, ela não será exibida novamente.`,
                    'info'
                );
            } catch (error) {
                console.error('Erro ao redefinir senha:', error);
                Utils.showToast('Erro ao redefinir senha', 'error');
            }
        }
    }

    async deleteUser(id) {
        const user = this.data.find(user => user.id === id);
        if (!user) return;

        const confirmed = await Utils.showConfirm(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir o usuário "${user.nome}"?`,
            'Excluir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await API.users.delete(id);
                await this.refresh();
                Utils.showToast('Usuário excluído com sucesso', 'success');
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                Utils.showToast('Erro ao excluir usuário', 'error');
            }
        }
    }

    showCreateModal() {
        const modal = new UserModal();
        modal.show({
            title: 'Novo Usuário',
            user: null,
            onSave: async (data) => {
                try {
                    await API.users.create(data);
                    await this.refresh();
                    Utils.showToast('Usuário criado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao criar usuário:', error);
                    Utils.showToast('Erro ao criar usuário', 'error');
                }
            }
        });
    }

    showEditModal(user) {
        const modal = new UserModal();
        modal.show({
            title: 'Editar Usuário',
            user: user,
            onSave: async (data) => {
                try {
                    await API.users.update(user.id, data);
                    await this.refresh();
                    Utils.showToast('Usuário atualizado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao atualizar usuário:', error);
                    Utils.showToast('Erro ao atualizar usuário', 'error');
                }
            }
        });
    }

    showViewModal(user) {
        const modal = new UserViewModal();
        modal.show(user);
    }
}

// Modal de Usuário
class UserModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { title, user } = this.options;
        const isEdit = !!user;

        const modalHTML = `
            <div class="modal-overlay" id="user-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="user-form" class="form-grid">
                            <div class="form-group">
                                <label for="nome">Nome Completo *</label>
                                <input type="text" id="nome" name="nome" class="form-input" required 
                                       value="${user?.nome || ''}" placeholder="Nome completo do usuário">
                            </div>
                            
                            <div class="form-group">
                                <label for="email">E-mail *</label>
                                <input type="email" id="email" name="email" class="form-input" required 
                                       value="${user?.email || ''}" placeholder="email@exemplo.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="perfil">Perfil *</label>
                                <select id="perfil" name="perfil" class="form-select" required>
                                    <option value="">Selecione o perfil</option>
                                    <option value="admin" ${user?.perfil === 'admin' ? 'selected' : ''}>Administrador</option>
                                    <option value="pcm" ${user?.perfil === 'pcm' ? 'selected' : ''}>PCM</option>
                                    <option value="mecanico" ${user?.perfil === 'mecanico' ? 'selected' : ''}>Mecânico</option>
                                    <option value="almoxarife" ${user?.perfil === 'almoxarife' ? 'selected' : ''}>Almoxarife</option>
                                    <option value="operador" ${user?.perfil === 'operador' ? 'selected' : ''}>Operador</option>
                                    <option value="visualizador" ${user?.perfil === 'visualizador' ? 'selected' : ''}>Visualizador</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="telefone">Telefone</label>
                                <input type="tel" id="telefone" name="telefone" class="form-input" 
                                       value="${user?.telefone || ''}" placeholder="(11) 99999-9999">
                            </div>
                            
                            <div class="form-group">
                                <label for="departamento">Departamento</label>
                                <input type="text" id="departamento" name="departamento" class="form-input" 
                                       value="${user?.departamento || ''}" placeholder="Departamento">
                            </div>
                            
                            <div class="form-group">
                                <label for="cargo">Cargo</label>
                                <input type="text" id="cargo" name="cargo" class="form-input" 
                                       value="${user?.cargo || ''}" placeholder="Cargo">
                            </div>
                            
                            ${!isEdit ? `
                            <div class="form-group">
                                <label for="senha">Senha *</label>
                                <input type="password" id="senha" name="senha" class="form-input" required 
                                       placeholder="Senha do usuário" minlength="6">
                            </div>
                            
                            <div class="form-group">
                                <label for="confirmar_senha">Confirmar Senha *</label>
                                <input type="password" id="confirmar_senha" name="confirmar_senha" class="form-input" required 
                                       placeholder="Confirme a senha" minlength="6">
                            </div>
                            ` : ''}
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="ativo" name="ativo" ${user?.ativo !== false ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    Usuário ativo
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="pode_alterar_senha" name="pode_alterar_senha" ${user?.pode_alterar_senha !== false ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    Pode alterar própria senha
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="user-form" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Atualizar' : 'Criar'} Usuário
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Converter checkboxes
        data.ativo = form.querySelector('#ativo').checked;
        data.pode_alterar_senha = form.querySelector('#pode_alterar_senha').checked;
        
        // Validações
        if (!data.nome.trim()) {
            Utils.showToast('Nome é obrigatório', 'error');
            return;
        }
        
        if (!data.email.trim()) {
            Utils.showToast('E-mail é obrigatório', 'error');
            return;
        }
        
        if (!data.perfil) {
            Utils.showToast('Perfil é obrigatório', 'error');
            return;
        }
        
        // Validação de senha para novos usuários
        if (!this.options.user) {
            if (!data.senha || data.senha.length < 6) {
                Utils.showToast('Senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            if (data.senha !== data.confirmar_senha) {
                Utils.showToast('Senhas não conferem', 'error');
                return;
            }
        }

        // Remover confirmação de senha antes de enviar
        delete data.confirmar_senha;

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('user-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Modal de Visualização
class UserViewModal {
    show(user) {
        this.render(user);
    }

    render(user) {
        const modalHTML = `
            <div class="modal-overlay" id="user-view-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>Detalhes do Usuário</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="user-details">
                            <div class="user-header">
                                <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome || '')}&background=random`}" 
                                     alt="${user.nome}" class="user-avatar-large">
                                <div class="user-header-info">
                                    <h4>${user.nome}</h4>
                                    <p>${user.email}</p>
                                    <div class="user-badges">
                                        ${this.getRoleBadge(user.perfil)}
                                        ${user.ativo 
                                            ? '<span class="status-badge status-success">Ativo</span>'
                                            : '<span class="status-badge status-danger">Inativo</span>'
                                        }
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informações Pessoais</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome Completo:</label>
                                        <span>${user.nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>E-mail:</label>
                                        <span>${user.email || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Telefone:</label>
                                        <span>${user.telefone || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Departamento:</label>
                                        <span>${user.departamento || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Cargo:</label>
                                        <span>${user.cargo || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informações do Sistema</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Perfil:</label>
                                        <span>${this.getRoleBadge(user.perfil)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Status:</label>
                                        <span>${user.ativo 
                                            ? '<span class="status-badge status-success">Ativo</span>'
                                            : '<span class="status-badge status-danger">Inativo</span>'
                                        }</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Pode Alterar Senha:</label>
                                        <span>${AGGridConfig.formatters.boolean({value: user.pode_alterar_senha})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Último Acesso:</label>
                                        <span>${user.ultimo_acesso ? AGGridConfig.formatters.datetime({value: user.ultimo_acesso}) : 'Nunca'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Criado em:</label>
                                        <span>${AGGridConfig.formatters.datetime({value: user.created_at})}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Fechar
                        </button>
                        ${auth.hasPermission('admin') ? 
                            `<button type="button" class="btn btn-primary" onclick="usersPage.editUser(${user.id}); this.closest('.modal-overlay').remove();">
                                <i class="fas fa-edit"></i>
                                Editar
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
    }

    getRoleBadge(perfil) {
        const perfilMap = {
            'admin': '<span class="role-badge role-admin">Administrador</span>',
            'pcm': '<span class="role-badge role-pcm">PCM</span>',
            'mecanico': '<span class="role-badge role-mechanic">Mecânico</span>',
            'almoxarife': '<span class="role-badge role-warehouse">Almoxarife</span>',
            'operador': '<span class="role-badge role-operator">Operador</span>',
            'visualizador': '<span class="role-badge role-viewer">Visualizador</span>'
        };
        return perfilMap[perfil] || perfil;
    }
}

// Instância global
let usersPage = null;

// Registrar página
window.pages = window.pages || {};
window.pages.usuarios = {
    render: async (container) => {
        usersPage = new UsersPage();
        await usersPage.render(container);
    }
};


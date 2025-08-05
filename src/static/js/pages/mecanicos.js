// Página de Mecânicos com AG-Grid
class MechanicsPage {
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
            console.error('Erro ao carregar mecânicos:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.mechanics.getAll();
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
                <p>Carregando mecânicos...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar mecânicos</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('mecanicos')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="mechanics-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-users"></i>
                        <div>
                            <h1>Mecânicos</h1>
                            <p>Gerencie a equipe de mecânicos</p>
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
                        <button class="btn btn-primary" id="create-mechanic" ${!auth.hasPermission('admin') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Novo Mecânico
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
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-ocupados">0</div>
                            <div class="stat-label">Ocupados</div>
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
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="mechanics-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
                </div>
            </div>
        `;
    }

    setupGrid(container) {
        const gridContainer = container.querySelector('#mechanics-grid');
        
        const columnDefs = [
            {
                headerName: 'Mecânico',
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
                headerName: 'Especialidade',
                field: 'especialidade',
                minWidth: 150,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['Mecânica Geral', 'Hidráulica', 'Elétrica', 'Soldas', 'Pneus', 'Motor', 'Transmissão', 'Freios']
                }
            },
            {
                headerName: 'Nível',
                field: 'nivel',
                minWidth: 120,
                cellRenderer: (params) => {
                    const nivelMap = {
                        'junior': '<span class="level-badge level-junior">Júnior</span>',
                        'pleno': '<span class="level-badge level-pleno">Pleno</span>',
                        'senior': '<span class="level-badge level-senior">Sênior</span>',
                        'especialista': '<span class="level-badge level-especialista">Especialista</span>'
                    };
                    return nivelMap[params.value] || params.value;
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['junior', 'pleno', 'senior', 'especialista'],
                    valueFormatter: (params) => {
                        const nivelMap = {
                            'junior': 'Júnior',
                            'pleno': 'Pleno',
                            'senior': 'Sênior',
                            'especialista': 'Especialista'
                        };
                        return nivelMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Status',
                field: 'status',
                minWidth: 120,
                cellRenderer: (params) => {
                    const statusMap = {
                        'ativo': '<span class="status-badge status-success">Ativo</span>',
                        'inativo': '<span class="status-badge status-danger">Inativo</span>',
                        'ocupado': '<span class="status-badge status-warning">Ocupado</span>',
                        'ferias': '<span class="status-badge status-info">Férias</span>',
                        'afastado': '<span class="status-badge status-secondary">Afastado</span>'
                    };
                    return statusMap[params.value] || params.value;
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['ativo', 'inativo', 'ocupado', 'ferias', 'afastado'],
                    valueFormatter: (params) => {
                        const statusMap = {
                            'ativo': 'Ativo',
                            'inativo': 'Inativo',
                            'ocupado': 'Ocupado',
                            'ferias': 'Férias',
                            'afastado': 'Afastado'
                        };
                        return statusMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Telefone',
                field: 'telefone',
                minWidth: 130
            },
            {
                headerName: 'Turno',
                field: 'turno',
                minWidth: 100,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['Manhã', 'Tarde', 'Noite', 'Integral']
                }
            },
            {
                headerName: 'OSs Ativas',
                field: 'os_ativas',
                minWidth: 100,
                type: 'numericColumn',
                cellRenderer: (params) => {
                    const count = params.value || 0;
                    let className = 'os-count-normal';
                    if (count > 5) {
                        className = 'os-count-high';
                    } else if (count > 2) {
                        className = 'os-count-medium';
                    }
                    return `<span class="${className}">${count}</span>`;
                },
                filter: 'agNumberColumnFilter'
            },
            {
                headerName: 'Última Atividade',
                field: 'ultima_atividade',
                minWidth: 150,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
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
                    const canEdit = auth.hasPermission('admin') || auth.hasPermission('edit');
                    const canDelete = auth.hasPermission('admin');
                    
                    let html = '<div class="ag-actions">';
                    
                    html += `<button class="btn-action btn-view" onclick="mechanicsPage.viewMechanic(${params.data.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    
                    html += `<button class="btn-action btn-view" onclick="mechanicsPage.viewWorkOrders(${params.data.id})" title="Ver OSs">
                        <i class="fas fa-clipboard-list"></i>
                    </button>`;
                    
                    if (canEdit) {
                        html += `<button class="btn-action btn-edit" onclick="mechanicsPage.editMechanic(${params.data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>`;
                    }
                    
                    if (canDelete) {
                        html += `<button class="btn-action btn-delete" onclick="mechanicsPage.deleteMechanic(${params.data.id})" title="Excluir">
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

        // Botão de novo mecânico
        const createBtn = container.querySelector('#create-mechanic');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }
    }

    async refresh() {
        try {
            await this.loadData();
            if (this.gridApi) {
                this.gridApi.setGridOption('rowData', this.data);
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
                fileName: `mecanicos_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';'
            });
        }
    }

    updateStats() {
        const stats = {
            total: this.data.length,
            ativos: this.data.filter(mechanic => mechanic.status === 'ativo').length,
            ocupados: this.data.filter(mechanic => mechanic.status === 'ocupado').length,
            inativos: this.data.filter(mechanic => mechanic.status === 'inativo').length
        };

        // Se há filtros aplicados, usar dados filtrados
        if (this.gridApi) {
            const filteredData = [];
            this.gridApi.forEachNodeAfterFilter(node => {
                filteredData.push(node.data);
            });
            
            if (filteredData.length !== this.data.length) {
                stats.total = filteredData.length;
                stats.ativos = filteredData.filter(mechanic => mechanic.status === 'ativo').length;
                stats.ocupados = filteredData.filter(mechanic => mechanic.status === 'ocupado').length;
                stats.inativos = filteredData.filter(mechanic => mechanic.status === 'inativo').length;
            }
        }

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-ativos').textContent = stats.ativos;
        document.getElementById('stat-ocupados').textContent = stats.ocupados;
        document.getElementById('stat-inativos').textContent = stats.inativos;
    }

    updateSelectionInfo() {
        if (this.gridApi) {
            const selectedRows = this.gridApi.getSelectedRows();
            console.log('Mecânicos selecionados:', selectedRows.length);
        }
    }

    // Métodos de ação
    viewMechanic(id) {
        const mechanic = this.data.find(mechanic => mechanic.id === id);
        if (mechanic) {
            this.showViewModal(mechanic);
        }
    }

    viewWorkOrders(id) {
        // Navegar para ordens de serviço filtradas por mecânico
        navigation.navigateTo('ordens-servico', { mechanic_id: id });
    }

    editMechanic(id) {
        const mechanic = this.data.find(mechanic => mechanic.id === id);
        if (mechanic) {
            this.showEditModal(mechanic);
        }
    }

    async deleteMechanic(id) {
        const mechanic = this.data.find(mechanic => mechanic.id === id);
        if (!mechanic) return;

        const confirmed = await Utils.showConfirm(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir o mecânico "${mechanic.nome}"?`,
            'Excluir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await API.mechanics.delete(id);
                await this.refresh();
                Utils.showToast('Mecânico excluído com sucesso', 'success');
            } catch (error) {
                console.error('Erro ao excluir mecânico:', error);
                Utils.showToast('Erro ao excluir mecânico', 'error');
            }
        }
    }

    showCreateModal() {
        const modal = new MechanicModal();
        modal.show({
            title: 'Novo Mecânico',
            mechanic: null,
            onSave: async (data) => {
                try {
                    await API.mechanics.create(data);
                    await this.refresh();
                    Utils.showToast('Mecânico criado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao criar mecânico:', error);
                    Utils.showToast('Erro ao criar mecânico', 'error');
                }
            }
        });
    }

    showEditModal(mechanic) {
        const modal = new MechanicModal();
        modal.show({
            title: 'Editar Mecânico',
            mechanic: mechanic,
            onSave: async (data) => {
                try {
                    await API.mechanics.update(mechanic.id, data);
                    await this.refresh();
                    Utils.showToast('Mecânico atualizado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao atualizar mecânico:', error);
                    Utils.showToast('Erro ao atualizar mecânico', 'error');
                }
            }
        });
    }

    showViewModal(mechanic) {
        const modal = new MechanicViewModal();
        modal.show(mechanic);
    }
}

// Modal de Mecânico
class MechanicModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { title, mechanic } = this.options;
        const isEdit = !!mechanic;

        const modalHTML = `
            <div class="modal-overlay" id="mechanic-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="mechanic-form" class="form-grid">
                            <div class="form-group">
                                <label for="nome">Nome Completo *</label>
                                <input type="text" id="nome" name="nome" class="form-input" required 
                                       value="${mechanic?.nome || ''}" placeholder="Nome completo do mecânico">
                            </div>
                            
                            <div class="form-group">
                                <label for="email">E-mail</label>
                                <input type="email" id="email" name="email" class="form-input" 
                                       value="${mechanic?.email || ''}" placeholder="email@exemplo.com">
                            </div>
                            
                            <div class="form-group">
                                <label for="telefone">Telefone *</label>
                                <input type="tel" id="telefone" name="telefone" class="form-input" required 
                                       value="${mechanic?.telefone || ''}" placeholder="(11) 99999-9999">
                            </div>
                            
                            <div class="form-group">
                                <label for="especialidade">Especialidade *</label>
                                <select id="especialidade" name="especialidade" class="form-select" required>
                                    <option value="">Selecione a especialidade</option>
                                    <option value="Mecânica Geral" ${mechanic?.especialidade === 'Mecânica Geral' ? 'selected' : ''}>Mecânica Geral</option>
                                    <option value="Hidráulica" ${mechanic?.especialidade === 'Hidráulica' ? 'selected' : ''}>Hidráulica</option>
                                    <option value="Elétrica" ${mechanic?.especialidade === 'Elétrica' ? 'selected' : ''}>Elétrica</option>
                                    <option value="Soldas" ${mechanic?.especialidade === 'Soldas' ? 'selected' : ''}>Soldas</option>
                                    <option value="Pneus" ${mechanic?.especialidade === 'Pneus' ? 'selected' : ''}>Pneus</option>
                                    <option value="Motor" ${mechanic?.especialidade === 'Motor' ? 'selected' : ''}>Motor</option>
                                    <option value="Transmissão" ${mechanic?.especialidade === 'Transmissão' ? 'selected' : ''}>Transmissão</option>
                                    <option value="Freios" ${mechanic?.especialidade === 'Freios' ? 'selected' : ''}>Freios</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="nivel">Nível *</label>
                                <select id="nivel" name="nivel" class="form-select" required>
                                    <option value="">Selecione o nível</option>
                                    <option value="junior" ${mechanic?.nivel === 'junior' ? 'selected' : ''}>Júnior</option>
                                    <option value="pleno" ${mechanic?.nivel === 'pleno' ? 'selected' : ''}>Pleno</option>
                                    <option value="senior" ${mechanic?.nivel === 'senior' ? 'selected' : ''}>Sênior</option>
                                    <option value="especialista" ${mechanic?.nivel === 'especialista' ? 'selected' : ''}>Especialista</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="turno">Turno *</label>
                                <select id="turno" name="turno" class="form-select" required>
                                    <option value="">Selecione o turno</option>
                                    <option value="Manhã" ${mechanic?.turno === 'Manhã' ? 'selected' : ''}>Manhã</option>
                                    <option value="Tarde" ${mechanic?.turno === 'Tarde' ? 'selected' : ''}>Tarde</option>
                                    <option value="Noite" ${mechanic?.turno === 'Noite' ? 'selected' : ''}>Noite</option>
                                    <option value="Integral" ${mechanic?.turno === 'Integral' ? 'selected' : ''}>Integral</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="status">Status *</label>
                                <select id="status" name="status" class="form-select" required>
                                    <option value="ativo" ${mechanic?.status === 'ativo' || !mechanic ? 'selected' : ''}>Ativo</option>
                                    <option value="inativo" ${mechanic?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                                    <option value="ocupado" ${mechanic?.status === 'ocupado' ? 'selected' : ''}>Ocupado</option>
                                    <option value="ferias" ${mechanic?.status === 'ferias' ? 'selected' : ''}>Férias</option>
                                    <option value="afastado" ${mechanic?.status === 'afastado' ? 'selected' : ''}>Afastado</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="data_admissao">Data de Admissão</label>
                                <input type="date" id="data_admissao" name="data_admissao" class="form-input" 
                                       value="${mechanic?.data_admissao ? mechanic.data_admissao.split('T')[0] : ''}">
                            </div>
                            
                            <div class="form-group form-group-full">
                                <label for="observacoes">Observações</label>
                                <textarea id="observacoes" name="observacoes" class="form-textarea" rows="3" 
                                          placeholder="Observações sobre o mecânico">${mechanic?.observacoes || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="mechanic-form" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Atualizar' : 'Criar'} Mecânico
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('mechanic-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validações
        if (!data.nome.trim()) {
            Utils.showToast('Nome é obrigatório', 'error');
            return;
        }
        
        if (!data.telefone.trim()) {
            Utils.showToast('Telefone é obrigatório', 'error');
            return;
        }
        
        if (!data.especialidade) {
            Utils.showToast('Especialidade é obrigatória', 'error');
            return;
        }
        
        if (!data.nivel) {
            Utils.showToast('Nível é obrigatório', 'error');
            return;
        }
        
        if (!data.turno) {
            Utils.showToast('Turno é obrigatório', 'error');
            return;
        }

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('mechanic-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Modal de Visualização
class MechanicViewModal {
    show(mechanic) {
        this.render(mechanic);
    }

    render(mechanic) {
        const modalHTML = `
            <div class="modal-overlay" id="mechanic-view-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>Detalhes do Mecânico</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="mechanic-details">
                            <div class="user-header">
                                <img src="${mechanic.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mechanic.nome || '')}&background=random`}" 
                                     alt="${mechanic.nome}" class="user-avatar-large">
                                <div class="user-header-info">
                                    <h4>${mechanic.nome}</h4>
                                    <p>${mechanic.email || 'E-mail não informado'}</p>
                                    <div class="user-badges">
                                        ${this.getLevelBadge(mechanic.nivel)}
                                        ${this.getStatusBadge(mechanic.status)}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informações Pessoais</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome Completo:</label>
                                        <span>${mechanic.nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>E-mail:</label>
                                        <span>${mechanic.email || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Telefone:</label>
                                        <span>${mechanic.telefone || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Data de Admissão:</label>
                                        <span>${mechanic.data_admissao ? AGGridConfig.formatters.date({value: mechanic.data_admissao}) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informações Profissionais</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Especialidade:</label>
                                        <span>${mechanic.especialidade || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Nível:</label>
                                        <span>${this.getLevelBadge(mechanic.nivel)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Turno:</label>
                                        <span>${mechanic.turno || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Status:</label>
                                        <span>${this.getStatusBadge(mechanic.status)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Estatísticas</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>OSs Ativas:</label>
                                        <span>${mechanic.os_ativas || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>OSs Concluídas:</label>
                                        <span>${mechanic.os_concluidas || 0}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Última Atividade:</label>
                                        <span>${mechanic.ultima_atividade ? AGGridConfig.formatters.date({value: mechanic.ultima_atividade}) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${mechanic.observacoes ? `
                            <div class="detail-section">
                                <h4>Observações</h4>
                                <div class="detail-grid">
                                    <div class="detail-item detail-item-full">
                                        <span>${mechanic.observacoes}</span>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Fechar
                        </button>
                        <button type="button" class="btn btn-outline" onclick="mechanicsPage.viewWorkOrders(${mechanic.id}); this.closest('.modal-overlay').remove();">
                            <i class="fas fa-clipboard-list"></i>
                            Ver OSs
                        </button>
                        ${auth.hasPermission('admin') || auth.hasPermission('edit') ? 
                            `<button type="button" class="btn btn-primary" onclick="mechanicsPage.editMechanic(${mechanic.id}); this.closest('.modal-overlay').remove();">
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

    getLevelBadge(nivel) {
        const nivelMap = {
            'junior': '<span class="level-badge level-junior">Júnior</span>',
            'pleno': '<span class="level-badge level-pleno">Pleno</span>',
            'senior': '<span class="level-badge level-senior">Sênior</span>',
            'especialista': '<span class="level-badge level-especialista">Especialista</span>'
        };
        return nivelMap[nivel] || nivel;
    }

    getStatusBadge(status) {
        const statusMap = {
            'ativo': '<span class="status-badge status-success">Ativo</span>',
            'inativo': '<span class="status-badge status-danger">Inativo</span>',
            'ocupado': '<span class="status-badge status-warning">Ocupado</span>',
            'ferias': '<span class="status-badge status-info">Férias</span>',
            'afastado': '<span class="status-badge status-secondary">Afastado</span>'
        };
        return statusMap[status] || status;
    }
}

// Expose the page class globally
window.MechanicsPage = MechanicsPage;

// Instância global
let mechanicsPage = null;

// Registrar página
window.pages = window.pages || {};
window.pages.mecanicos = {
    render: async (container) => {
        mechanicsPage = new MechanicsPage();
        await mechanicsPage.render(container);
    }
};


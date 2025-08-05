// Página de Ordens de Serviço com AG-Grid
class WorkOrdersPage {
    constructor() {
        this.gridApi = null;
        this.gridColumnApi = null;
        this.data = [];
        this.equipments = [];
        this.mechanics = [];
        this.maintenanceTypes = [];
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();
            await this.loadRelatedData();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar AG-Grid
            this.setupGrid(container);

            // Configurar eventos
            this.setupEvents(container);

        } catch (error) {
            console.error('Erro ao carregar ordens de serviço:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.workOrders.getAll();
            this.data = Array.isArray(response) 
                ? response 
                : (response.ordens_servico || response.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            throw error;
        }
    }

    async loadRelatedData() {
        try {
            const [equipments, mechanics, maintenanceTypes] = await Promise.all([
                API.equipments.getAll(),
                API.mechanics.getAll(),
                API.maintenanceTypes.getAll()
            ]);

            this.equipments = Array.isArray(equipments) ? equipments : (equipments.data || []);
            this.mechanics = Array.isArray(mechanics) ? mechanics : (mechanics.data || []);
            this.maintenanceTypes = Array.isArray(maintenanceTypes) ? maintenanceTypes : (maintenanceTypes.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados relacionados:', error);
        }
    }

    getLoadingHTML() {
        return `
            <div class="page-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando ordens de serviço...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar ordens de serviço</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('ordens-servico')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="work-orders-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-clipboard-list"></i>
                        <div>
                            <h1>Ordens de Serviço</h1>
                            <p>Gerencie as ordens de serviço de manutenção</p>
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
                        <button class="btn btn-primary" id="create-work-order" ${!auth.hasPermission('pcm') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Nova OS
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-pendentes">0</div>
                            <div class="stat-label">Pendentes</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-andamento">0</div>
                            <div class="stat-label">Em Andamento</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-check"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-concluidas">0</div>
                            <div class="stat-label">Concluídas</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-times"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-canceladas">0</div>
                            <div class="stat-label">Canceladas</div>
                        </div>
                    </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="work-orders-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
                </div>
            </div>
        `;
    }

    setupGrid(container) {
        const gridContainer = container.querySelector('#work-orders-grid');
        
        const columnDefs = [
            {
                headerName: 'OS',
                field: 'numero',
                minWidth: 100,
                maxWidth: 120,
                cellRenderer: (params) => {
                    const priority = params.data.prioridade || 'normal';
                    const priorityClass = {
                        'baixa': 'priority-low',
                        'normal': 'priority-normal',
                        'alta': 'priority-high',
                        'critica': 'priority-critical'
                    }[priority] || 'priority-normal';
                    
                    return `
                        <div class="os-cell">
                            <div class="os-number">${params.value || ''}</div>
                            <div class="os-priority ${priorityClass}"></div>
                        </div>
                    `;
                }
            },
            {
                headerName: 'Equipamento',
                field: 'equipamento_nome',
                minWidth: 200,
                cellRenderer: (params) => {
                    return `
                        <div class="equipment-cell">
                            <div class="equipment-name">${params.value || ''}</div>
                            <div class="equipment-code">${params.data.equipamento_codigo || ''}</div>
                        </div>
                    `;
                }
            },
            {
                headerName: 'Tipo',
                field: 'tipo_manutencao_nome',
                minWidth: 120,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: this.maintenanceTypes.map(type => type.nome)
                }
            },
            {
                headerName: 'Status',
                field: 'status',
                minWidth: 120,
                cellRenderer: (params) => {
                    const statusMap = {
                        'pendente': '<span class="status-badge status-info">Pendente</span>',
                        'andamento': '<span class="status-badge status-warning">Em Andamento</span>',
                        'concluida': '<span class="status-badge status-success">Concluída</span>',
                        'cancelada': '<span class="status-badge status-danger">Cancelada</span>',
                        'pausada': '<span class="status-badge status-secondary">Pausada</span>'
                    };
                    return statusMap[params.value] || params.value;
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['pendente', 'andamento', 'concluida', 'cancelada', 'pausada'],
                    valueFormatter: (params) => {
                        const statusMap = {
                            'pendente': 'Pendente',
                            'andamento': 'Em Andamento',
                            'concluida': 'Concluída',
                            'cancelada': 'Cancelada',
                            'pausada': 'Pausada'
                        };
                        return statusMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Prioridade',
                field: 'prioridade',
                minWidth: 100,
                cellRenderer: (params) => {
                    const priorityMap = {
                        'baixa': '<span class="priority-badge priority-low">Baixa</span>',
                        'normal': '<span class="priority-badge priority-normal">Normal</span>',
                        'alta': '<span class="priority-badge priority-high">Alta</span>',
                        'critica': '<span class="priority-badge priority-critical">Crítica</span>'
                    };
                    return priorityMap[params.value] || params.value;
                },
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['baixa', 'normal', 'alta', 'critica'],
                    valueFormatter: (params) => {
                        const priorityMap = {
                            'baixa': 'Baixa',
                            'normal': 'Normal',
                            'alta': 'Alta',
                            'critica': 'Crítica'
                        };
                        return priorityMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Mecânico',
                field: 'mecanico_nome',
                minWidth: 150,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: this.mechanics.map(mechanic => mechanic.nome)
                }
            },
            {
                headerName: 'Data Abertura',
                field: 'data_abertura',
                minWidth: 130,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Data Prevista',
                field: 'data_prevista',
                minWidth: 130,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Data Conclusão',
                field: 'data_conclusao',
                minWidth: 130,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Descrição',
                field: 'descricao',
                minWidth: 200,
                cellRenderer: (params) => {
                    const text = params.value || '';
                    const truncated = text.length > 50 ? text.substring(0, 50) + '...' : text;
                    return `<span title="${text}">${truncated}</span>`;
                }
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
                    const canEdit = auth.hasPermission('pcm') || auth.hasPermission('edit');
                    const canDelete = auth.hasPermission('admin');
                    const canExecute = auth.hasPermission('mecanico') || auth.hasPermission('pcm');
                    
                    let html = '<div class="ag-actions">';
                    
                    html += `<button class="btn-action btn-view" onclick="workOrdersPage.viewWorkOrder(${params.data.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    
                    if (canEdit && params.data.status !== 'concluida' && params.data.status !== 'cancelada') {
                        html += `<button class="btn-action btn-edit" onclick="workOrdersPage.editWorkOrder(${params.data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>`;
                    }
                    
                    if (canExecute && params.data.status === 'pendente') {
                        html += `<button class="btn-action btn-play" onclick="workOrdersPage.startWorkOrder(${params.data.id})" title="Iniciar">
                            <i class="fas fa-play"></i>
                        </button>`;
                    }
                    
                    if (canExecute && params.data.status === 'andamento') {
                        html += `<button class="btn-action btn-check" onclick="workOrdersPage.completeWorkOrder(${params.data.id})" title="Concluir">
                            <i class="fas fa-check"></i>
                        </button>`;
                    }
                    
                    if (canDelete && params.data.status === 'pendente') {
                        html += `<button class="btn-action btn-delete" onclick="workOrdersPage.deleteWorkOrder(${params.data.id})" title="Excluir">
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
            },
            // Ordenação padrão por data de abertura (mais recentes primeiro)
            sortingOrder: ['desc', 'asc'],
            defaultColDef: {
                ...AGGridConfig.getDefaultOptions().defaultColDef,
                sortable: true,
                filter: true,
                resizable: true
            }
        };

        this.grid = AGGridConfig.createGrid(gridContainer, gridOptions);
        
        // Aplicar ordenação inicial
        setTimeout(() => {
            if (this.gridApi) {
                this.gridApi.applyColumnState({
                    state: [{ colId: 'data_abertura', sort: 'desc' }]
                });
            }
        }, 100);
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

        // Botão de nova OS
        const createBtn = container.querySelector('#create-work-order');
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
                fileName: `ordens_servico_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';'
            });
        }
    }

    updateStats() {
        const stats = {
            pendentes: this.data.filter(item => item.status === 'pendente').length,
            andamento: this.data.filter(item => item.status === 'andamento').length,
            concluidas: this.data.filter(item => item.status === 'concluida').length,
            canceladas: this.data.filter(item => item.status === 'cancelada').length
        };

        // Se há filtros aplicados, usar dados filtrados
        if (this.gridApi) {
            const filteredData = [];
            this.gridApi.forEachNodeAfterFilter(node => {
                filteredData.push(node.data);
            });
            
            if (filteredData.length !== this.data.length) {
                stats.pendentes = filteredData.filter(item => item.status === 'pendente').length;
                stats.andamento = filteredData.filter(item => item.status === 'andamento').length;
                stats.concluidas = filteredData.filter(item => item.status === 'concluida').length;
                stats.canceladas = filteredData.filter(item => item.status === 'cancelada').length;
            }
        }

        document.getElementById('stat-pendentes').textContent = stats.pendentes;
        document.getElementById('stat-andamento').textContent = stats.andamento;
        document.getElementById('stat-concluidas').textContent = stats.concluidas;
        document.getElementById('stat-canceladas').textContent = stats.canceladas;
    }

    updateSelectionInfo() {
        if (this.gridApi) {
            const selectedRows = this.gridApi.getSelectedRows();
            console.log('OSs selecionadas:', selectedRows.length);
        }
    }

    // Métodos de ação
    viewWorkOrder(id) {
        const workOrder = this.data.find(item => item.id === id);
        if (workOrder) {
            this.showViewModal(workOrder);
        }
    }

    editWorkOrder(id) {
        const workOrder = this.data.find(item => item.id === id);
        if (workOrder) {
            this.showEditModal(workOrder);
        }
    }

    async startWorkOrder(id) {
        try {
            await API.workOrders.updateStatus(id, 'andamento');
            await this.refresh();
            Utils.showToast('OS iniciada com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao iniciar OS:', error);
            Utils.showToast('Erro ao iniciar OS', 'error');
        }
    }

    async completeWorkOrder(id) {
        const workOrder = this.data.find(item => item.id === id);
        if (workOrder) {
            this.showCompleteModal(workOrder);
        }
    }

    async deleteWorkOrder(id) {
        const workOrder = this.data.find(item => item.id === id);
        if (!workOrder) return;

        const confirmed = await Utils.showConfirm(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir a OS ${workOrder.numero}?`,
            'Excluir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await API.workOrders.delete(id);
                await this.refresh();
                Utils.showToast('OS excluída com sucesso', 'success');
            } catch (error) {
                console.error('Erro ao excluir OS:', error);
                Utils.showToast('Erro ao excluir OS', 'error');
            }
        }
    }

    showCreateModal() {
        const modal = new WorkOrderModal();
        modal.show({
            title: 'Nova Ordem de Serviço',
            workOrder: null,
            equipments: this.equipments,
            mechanics: this.mechanics,
            maintenanceTypes: this.maintenanceTypes,
            onSave: async (data) => {
                try {
                    await API.workOrders.create(data);
                    await this.refresh();
                    Utils.showToast('OS criada com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao criar OS:', error);
                    Utils.showToast('Erro ao criar OS', 'error');
                }
            }
        });
    }

    showEditModal(workOrder) {
        const modal = new WorkOrderModal();
        modal.show({
            title: 'Editar Ordem de Serviço',
            workOrder: workOrder,
            equipments: this.equipments,
            mechanics: this.mechanics,
            maintenanceTypes: this.maintenanceTypes,
            onSave: async (data) => {
                try {
                    await API.workOrders.update(workOrder.id, data);
                    await this.refresh();
                    Utils.showToast('OS atualizada com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao atualizar OS:', error);
                    Utils.showToast('Erro ao atualizar OS', 'error');
                }
            }
        });
    }

    showViewModal(workOrder) {
        const modal = new WorkOrderViewModal();
        modal.show(workOrder);
    }

    showCompleteModal(workOrder) {
        const modal = new WorkOrderCompleteModal();
        modal.show({
            workOrder: workOrder,
            onComplete: async (data) => {
                try {
                    await API.workOrders.complete(workOrder.id, data);
                    await this.refresh();
                    Utils.showToast('OS concluída com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao concluir OS:', error);
                    Utils.showToast('Erro ao concluir OS', 'error');
                }
            }
        });
    }
}

// Modal de Ordem de Serviço
class WorkOrderModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { title, workOrder, equipments, mechanics, maintenanceTypes } = this.options;
        const isEdit = !!workOrder;

        const modalHTML = `
            <div class="modal-overlay" id="work-order-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="work-order-form" class="form-grid">
                            <div class="form-group">
                                <label for="equipamento_id">Equipamento *</label>
                                <select id="equipamento_id" name="equipamento_id" class="form-select" required>
                                    <option value="">Selecione o equipamento</option>
                                    ${equipments.map(equipment => 
                                        `<option value="${equipment.id}" ${workOrder?.equipamento_id == equipment.id ? 'selected' : ''}>
                                            ${equipment.nome} - ${equipment.codigo || ''}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="tipo_manutencao_id">Tipo de Manutenção *</label>
                                <select id="tipo_manutencao_id" name="tipo_manutencao_id" class="form-select" required>
                                    <option value="">Selecione o tipo</option>
                                    ${maintenanceTypes.map(type => 
                                        `<option value="${type.id}" ${workOrder?.tipo_manutencao_id == type.id ? 'selected' : ''}>
                                            ${type.nome}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="prioridade">Prioridade *</label>
                                <select id="prioridade" name="prioridade" class="form-select" required>
                                    <option value="baixa" ${workOrder?.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                                    <option value="normal" ${workOrder?.prioridade === 'normal' || !workOrder ? 'selected' : ''}>Normal</option>
                                    <option value="alta" ${workOrder?.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                                    <option value="critica" ${workOrder?.prioridade === 'critica' ? 'selected' : ''}>Crítica</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="mecanico_id">Mecânico</label>
                                <select id="mecanico_id" name="mecanico_id" class="form-select">
                                    <option value="">Selecione o mecânico</option>
                                    ${mechanics.map(mechanic => 
                                        `<option value="${mechanic.id}" ${workOrder?.mecanico_id == mechanic.id ? 'selected' : ''}>
                                            ${mechanic.nome}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="data_prevista">Data Prevista</label>
                                <input type="date" id="data_prevista" name="data_prevista" class="form-input" 
                                       value="${workOrder?.data_prevista ? workOrder.data_prevista.split('T')[0] : ''}">
                            </div>
                            
                            <div class="form-group">
                                <label for="status">Status</label>
                                <select id="status" name="status" class="form-select">
                                    <option value="pendente" ${workOrder?.status === 'pendente' || !workOrder ? 'selected' : ''}>Pendente</option>
                                    <option value="andamento" ${workOrder?.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                                    <option value="pausada" ${workOrder?.status === 'pausada' ? 'selected' : ''}>Pausada</option>
                                    <option value="concluida" ${workOrder?.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                                    <option value="cancelada" ${workOrder?.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                                </select>
                            </div>
                            
                            <div class="form-group form-group-full">
                                <label for="descricao">Descrição *</label>
                                <textarea id="descricao" name="descricao" class="form-textarea" rows="3" required 
                                          placeholder="Descreva o problema ou serviço a ser realizado">${workOrder?.descricao || ''}</textarea>
                            </div>
                            
                            <div class="form-group form-group-full">
                                <label for="observacoes">Observações</label>
                                <textarea id="observacoes" name="observacoes" class="form-textarea" rows="2" 
                                          placeholder="Observações adicionais">${workOrder?.observacoes || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="work-order-form" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Atualizar' : 'Criar'} OS
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('work-order-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validações
        if (!data.equipamento_id) {
            Utils.showToast('Equipamento é obrigatório', 'error');
            return;
        }
        
        if (!data.tipo_manutencao_id) {
            Utils.showToast('Tipo de manutenção é obrigatório', 'error');
            return;
        }
        
        if (!data.descricao.trim()) {
            Utils.showToast('Descrição é obrigatória', 'error');
            return;
        }

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('work-order-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Modal de Visualização
class WorkOrderViewModal {
    show(workOrder) {
        this.render(workOrder);
    }

    render(workOrder) {
        const modalHTML = `
            <div class="modal-overlay" id="work-order-view-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>Ordem de Serviço #${workOrder.numero}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="work-order-details">
                            <div class="detail-section">
                                <h4>Informações Básicas</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Número:</label>
                                        <span>${workOrder.numero || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Status:</label>
                                        <span>${AGGridConfig.formatters.status({value: workOrder.status})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Prioridade:</label>
                                        <span>${workOrder.prioridade || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Tipo:</label>
                                        <span>${workOrder.tipo_manutencao_nome || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Equipamento e Responsável</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Equipamento:</label>
                                        <span>${workOrder.equipamento_nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Código:</label>
                                        <span>${workOrder.equipamento_codigo || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Mecânico:</label>
                                        <span>${workOrder.mecanico_nome || 'Não atribuído'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Datas</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Data de Abertura:</label>
                                        <span>${AGGridConfig.formatters.datetime({value: workOrder.data_abertura})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Data Prevista:</label>
                                        <span>${workOrder.data_prevista ? AGGridConfig.formatters.date({value: workOrder.data_prevista}) : '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Data de Conclusão:</label>
                                        <span>${workOrder.data_conclusao ? AGGridConfig.formatters.datetime({value: workOrder.data_conclusao}) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Descrição e Observações</h4>
                                <div class="detail-grid">
                                    <div class="detail-item detail-item-full">
                                        <label>Descrição:</label>
                                        <span>${workOrder.descricao || '-'}</span>
                                    </div>
                                    <div class="detail-item detail-item-full">
                                        <label>Observações:</label>
                                        <span>${workOrder.observacoes || '-'}</span>
                                    </div>
                                    ${workOrder.solucao ? `
                                    <div class="detail-item detail-item-full">
                                        <label>Solução:</label>
                                        <span>${workOrder.solucao}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Fechar
                        </button>
                        ${(auth.hasPermission('pcm') || auth.hasPermission('edit')) && workOrder.status !== 'concluida' && workOrder.status !== 'cancelada' ? 
                            `<button type="button" class="btn btn-primary" onclick="workOrdersPage.editWorkOrder(${workOrder.id}); this.closest('.modal-overlay').remove();">
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
}

// Modal de Conclusão
class WorkOrderCompleteModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { workOrder } = this.options;

        const modalHTML = `
            <div class="modal-overlay" id="work-order-complete-modal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3>Concluir OS #${workOrder.numero}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="work-order-complete-form">
                            <div class="form-group">
                                <label for="solucao">Solução Aplicada *</label>
                                <textarea id="solucao" name="solucao" class="form-textarea" rows="4" required 
                                          placeholder="Descreva a solução aplicada e os procedimentos realizados"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="tempo_execucao">Tempo de Execução (horas)</label>
                                <input type="number" id="tempo_execucao" name="tempo_execucao" class="form-input" 
                                       step="0.5" min="0" placeholder="Ex: 2.5">
                            </div>
                            
                            <div class="form-group">
                                <label for="observacoes_conclusao">Observações</label>
                                <textarea id="observacoes_conclusao" name="observacoes_conclusao" class="form-textarea" rows="2" 
                                          placeholder="Observações sobre a conclusão"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="work-order-complete-form" class="btn btn-success">
                            <i class="fas fa-check"></i>
                            Concluir OS
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('work-order-complete-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(form);
        });
    }

    handleSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validações
        if (!data.solucao.trim()) {
            Utils.showToast('Solução aplicada é obrigatória', 'error');
            return;
        }

        this.options.onComplete(data);
    }

    hide() {
        const modal = document.getElementById('work-order-complete-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Instância global
let workOrdersPage = null;

// Registrar página
window.pages = window.pages || {};
window.pages['ordens-servico'] = {
    render: async (container) => {
        workOrdersPage = new WorkOrdersPage();
        await workOrdersPage.render(container);
    }
};


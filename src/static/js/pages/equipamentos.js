// Página de Equipamentos com AG-Grid
class EquipmentsPage {
    constructor() {
        this.gridApi = null;
        this.gridColumnApi = null;
        this.data = [];
        this.equipmentTypes = [];
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();
            await this.loadEquipmentTypes();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar AG-Grid
            this.setupGrid(container);

            // Configurar eventos
            this.setupEvents(container);

        } catch (error) {
            console.error('Erro ao carregar equipamentos:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            const response = await API.equipments.getAll();
            this.data = Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.data = [];
            throw error;
        }
    }

    async loadEquipmentTypes() {
        try {
            const response = await API.equipmentTypes.getAll();
            this.equipmentTypes = Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erro ao carregar tipos de equipamento:', error);
            this.equipmentTypes = [];
        }
    }

    getLoadingHTML() {
        return `
            <div class="page-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando equipamentos...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar equipamentos</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('equipamentos')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        return `
            <div class="equipments-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-truck"></i>
                        <div>
                            <h1>Equipamentos</h1>
                            <p>Gerencie os equipamentos da operação</p>
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
                        <button class="btn btn-primary" id="create-equipment" ${!auth.hasPermission('admin') ? 'style="display: none;"' : ''}>
                            <i class="fas fa-plus"></i>
                            Novo Equipamento
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-ativos">0</div>
                            <div class="stat-label">Ativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-wrench"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-manutencao">0</div>
                            <div class="stat-label">Em Manutenção</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-inativos">0</div>
                            <div class="stat-label">Inativos</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-cogs"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="equipments-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
                </div>
            </div>
        `;
    }

    setupGrid(container) {
        const gridContainer = container.querySelector('#equipments-grid');
        
        const columnDefs = [
            {
                headerName: 'Equipamento',
                field: 'nome',
                minWidth: 200,
                cellRenderer: (params) => {
                    return `
                        <div class="equipment-cell">
                            <div class="equipment-name">${params.value || ''}</div>
                            <div class="equipment-code">${params.data.codigo || ''}</div>
                        </div>
                    `;
                }
            },
            {
                headerName: 'Tipo',
                field: 'tipo_nome',
                minWidth: 150,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: this.equipmentTypes.map(type => type.nome)
                }
            },
            {
                headerName: 'Modelo',
                field: 'modelo',
                minWidth: 150
            },
            {
                headerName: 'Número Série',
                field: 'numero_serie',
                minWidth: 150
            },
            {
                headerName: 'Status',
                field: 'status',
                minWidth: 120,
                cellRenderer: AGGridConfig.formatters.status,
                filter: 'agSetColumnFilter',
                filterParams: {
                    values: ['ativo', 'inativo', 'manutencao'],
                    valueFormatter: (params) => {
                        const statusMap = {
                            'ativo': 'Ativo',
                            'inativo': 'Inativo',
                            'manutencao': 'Em Manutenção'
                        };
                        return statusMap[params.value] || params.value;
                    }
                }
            },
            {
                headerName: 'Localização',
                field: 'localizacao',
                minWidth: 150
            },
            {
                headerName: 'Última Manutenção',
                field: 'ultima_manutencao',
                minWidth: 150,
                cellRenderer: AGGridConfig.formatters.date,
                filter: 'agDateColumnFilter'
            },
            {
                headerName: 'Criado em',
                field: 'created_at',
                minWidth: 150,
                cellRenderer: AGGridConfig.formatters.datetime,
                filter: 'agDateColumnFilter',
                hide: true
            },
            {
                headerName: 'Ações',
                field: 'actions',
                minWidth: 120,
                maxWidth: 120,
                sortable: false,
                filter: false,
                resizable: false,
                pinned: 'right',
                cellRenderer: (params) => {
                    const canEdit = auth.hasPermission('admin') || auth.hasPermission('edit');
                    const canDelete = auth.hasPermission('admin');
                    
                    let html = '<div class="ag-actions">';
                    
                    html += `<button class="btn-action btn-view" onclick="equipmentsPage.viewEquipment(${params.data.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>`;
                    
                    if (canEdit) {
                        html += `<button class="btn-action btn-edit" onclick="equipmentsPage.editEquipment(${params.data.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>`;
                    }
                    
                    if (canDelete) {
                        html += `<button class="btn-action btn-delete" onclick="equipmentsPage.deleteEquipment(${params.data.id})" title="Excluir">
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
                        toolPanel: 'agColumnsToolPanel',
                        toolPanelParams: {
                            suppressRowGroups: true,
                            suppressValues: true,
                            suppressPivots: true,
                            suppressPivotMode: true,
                            suppressColumnFilter: false,
                            suppressColumnSelectAll: false,
                            suppressColumnExpandAll: false
                        }
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

        // Botão de novo equipamento
        const createBtn = container.querySelector('#create-equipment');
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
                fileName: `equipamentos_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';'
            });
        }
    }

    updateStats() {
        const stats = {
            total: this.data.length,
            ativos: this.data.filter(item => item.status === 'ativo').length,
            manutencao: this.data.filter(item => item.status === 'manutencao').length,
            inativos: this.data.filter(item => item.status === 'inativo').length
        };

        // Se há filtros aplicados, usar dados filtrados
        if (this.gridApi) {
            const filteredData = [];
            this.gridApi.forEachNodeAfterFilter(node => {
                filteredData.push(node.data);
            });
            
            if (filteredData.length !== this.data.length) {
                stats.total = filteredData.length;
                stats.ativos = filteredData.filter(item => item.status === 'ativo').length;
                stats.manutencao = filteredData.filter(item => item.status === 'manutencao').length;
                stats.inativos = filteredData.filter(item => item.status === 'inativo').length;
            }
        }

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-ativos').textContent = stats.ativos;
        document.getElementById('stat-manutencao').textContent = stats.manutencao;
        document.getElementById('stat-inativos').textContent = stats.inativos;
    }

    updateSelectionInfo() {
        if (this.gridApi) {
            const selectedRows = this.gridApi.getSelectedRows();
            console.log('Equipamentos selecionados:', selectedRows.length);
        }
    }

    // Métodos de ação
    viewEquipment(id) {
        const equipment = this.data.find(item => item.id === id);
        if (equipment) {
            this.showViewModal(equipment);
        }
    }

    editEquipment(id) {
        const equipment = this.data.find(item => item.id === id);
        if (equipment) {
            this.showEditModal(equipment);
        }
    }

    async deleteEquipment(id) {
        const equipment = this.data.find(item => item.id === id);
        if (!equipment) return;

        const confirmed = await Utils.showConfirm(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir o equipamento "${equipment.nome}"?`,
            'Excluir',
            'Cancelar'
        );

        if (confirmed) {
            try {
                await API.equipments.delete(id);
                await this.refresh();
                Utils.showToast('Equipamento excluído com sucesso', 'success');
            } catch (error) {
                console.error('Erro ao excluir equipamento:', error);
                Utils.showToast('Erro ao excluir equipamento', 'error');
            }
        }
    }

    showCreateModal() {
        const modal = new EquipmentModal();
        modal.show({
            title: 'Novo Equipamento',
            equipment: null,
            equipmentTypes: this.equipmentTypes,
            onSave: async (data) => {
                try {
                    await API.equipments.create(data);
                    await this.refresh();
                    Utils.showToast('Equipamento criado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao criar equipamento:', error);
                    Utils.showToast('Erro ao criar equipamento', 'error');
                }
            }
        });
    }

    showEditModal(equipment) {
        const modal = new EquipmentModal();
        modal.show({
            title: 'Editar Equipamento',
            equipment: equipment,
            equipmentTypes: this.equipmentTypes,
            onSave: async (data) => {
                try {
                    await API.equipments.update(equipment.id, data);
                    await this.refresh();
                    Utils.showToast('Equipamento atualizado com sucesso', 'success');
                    modal.hide();
                } catch (error) {
                    console.error('Erro ao atualizar equipamento:', error);
                    Utils.showToast('Erro ao atualizar equipamento', 'error');
                }
            }
        });
    }

    showViewModal(equipment) {
        const modal = new EquipmentViewModal();
        modal.show(equipment);
    }
}

// Modal de Equipamento
class EquipmentModal {
    show(options) {
        this.options = options;
        this.render();
    }

    render() {
        const { title, equipment, equipmentTypes } = this.options;
        const isEdit = !!equipment;

        const modalHTML = `
            <div class="modal-overlay" id="equipment-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="equipment-form" class="form-grid">
                            <div class="form-group">
                                <label for="nome">Nome *</label>
                                <input type="text" id="nome" name="nome" class="form-input" required 
                                       value="${equipment?.nome || ''}" placeholder="Nome do equipamento">
                            </div>
                            
                            <div class="form-group">
                                <label for="codigo">Código</label>
                                <input type="text" id="codigo" name="codigo" class="form-input" 
                                       value="${equipment?.codigo || ''}" placeholder="Código do equipamento">
                            </div>
                            
                            <div class="form-group">
                                <label for="tipo_equipamento_id">Tipo *</label>
                                <select id="tipo_equipamento_id" name="tipo_equipamento_id" class="form-select" required>
                                    <option value="">Selecione o tipo</option>
                                    ${equipmentTypes.map(type => 
                                        `<option value="${type.id}" ${equipment?.tipo_equipamento_id == type.id ? 'selected' : ''}>
                                            ${type.nome}
                                        </option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="modelo">Modelo</label>
                                <input type="text" id="modelo" name="modelo" class="form-input" 
                                       value="${equipment?.modelo || ''}" placeholder="Modelo do equipamento">
                            </div>
                            
                            <div class="form-group">
                                <label for="numero_serie">Número de Série</label>
                                <input type="text" id="numero_serie" name="numero_serie" class="form-input" 
                                       value="${equipment?.numero_serie || ''}" placeholder="Número de série">
                            </div>
                            
                            <div class="form-group">
                                <label for="fabricante">Fabricante</label>
                                <input type="text" id="fabricante" name="fabricante" class="form-input" 
                                       value="${equipment?.fabricante || ''}" placeholder="Fabricante">
                            </div>
                            
                            <div class="form-group">
                                <label for="ano_fabricacao">Ano de Fabricação</label>
                                <input type="number" id="ano_fabricacao" name="ano_fabricacao" class="form-input" 
                                       value="${equipment?.ano_fabricacao || ''}" min="1900" max="2030">
                            </div>
                            
                            <div class="form-group">
                                <label for="status">Status *</label>
                                <select id="status" name="status" class="form-select" required>
                                    <option value="ativo" ${equipment?.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                                    <option value="inativo" ${equipment?.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                                    <option value="manutencao" ${equipment?.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="localizacao">Localização</label>
                                <input type="text" id="localizacao" name="localizacao" class="form-input" 
                                       value="${equipment?.localizacao || ''}" placeholder="Localização do equipamento">
                            </div>
                            
                            <div class="form-group form-group-full">
                                <label for="descricao">Descrição</label>
                                <textarea id="descricao" name="descricao" class="form-textarea" rows="3" 
                                          placeholder="Descrição do equipamento">${equipment?.descricao || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Cancelar
                        </button>
                        <button type="submit" form="equipment-form" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Atualizar' : 'Criar'} Equipamento
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modals-container').innerHTML = modalHTML;
        
        // Configurar eventos
        const form = document.getElementById('equipment-form');
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
        
        if (!data.tipo_equipamento_id) {
            Utils.showToast('Tipo de equipamento é obrigatório', 'error');
            return;
        }

        this.options.onSave(data);
    }

    hide() {
        const modal = document.getElementById('equipment-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Modal de Visualização
class EquipmentViewModal {
    show(equipment) {
        this.render(equipment);
    }

    render(equipment) {
        const modalHTML = `
            <div class="modal-overlay" id="equipment-view-modal">
                <div class="modal-container modal-lg">
                    <div class="modal-header">
                        <h3>Detalhes do Equipamento</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="equipment-details">
                            <div class="detail-section">
                                <h4>Informações Básicas</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Nome:</label>
                                        <span>${equipment.nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Código:</label>
                                        <span>${equipment.codigo || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Tipo:</label>
                                        <span>${equipment.tipo_nome || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Status:</label>
                                        <span>${AGGridConfig.formatters.status({value: equipment.status})}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Especificações</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Modelo:</label>
                                        <span>${equipment.modelo || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Número de Série:</label>
                                        <span>${equipment.numero_serie || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Fabricante:</label>
                                        <span>${equipment.fabricante || '-'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Ano de Fabricação:</label>
                                        <span>${equipment.ano_fabricacao || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Localização e Descrição</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Localização:</label>
                                        <span>${equipment.localizacao || '-'}</span>
                                    </div>
                                    <div class="detail-item detail-item-full">
                                        <label>Descrição:</label>
                                        <span>${equipment.descricao || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h4>Informações do Sistema</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Criado em:</label>
                                        <span>${AGGridConfig.formatters.datetime({value: equipment.created_at})}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Última Manutenção:</label>
                                        <span>${equipment.ultima_manutencao ? AGGridConfig.formatters.date({value: equipment.ultima_manutencao}) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                            Fechar
                        </button>
                        ${auth.hasPermission('admin') || auth.hasPermission('edit') ? 
                            `<button type="button" class="btn btn-primary" onclick="equipmentsPage.editEquipment(${equipment.id}); this.closest('.modal-overlay').remove();">
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

// Instância global
let equipmentsPage = null;

// Registrar página
window.pages = window.pages || {};
window.pages.equipamentos = {
    render: async (container) => {
        equipmentsPage = new EquipmentsPage();
        await equipmentsPage.render(container);
    }
};


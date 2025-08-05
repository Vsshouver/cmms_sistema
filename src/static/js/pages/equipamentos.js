// Página de Equipamentos com AG-Grid (padrão sistema de estoque)
let equipmentsGridApi = null;
let equipmentsInitialColumnState = [];
let equipmentsData = [];
let equipmentTypes = [];

const SYNC_EQUIPMENTS_GRID_DATA = async () => {
    if (!equipmentsGridApi) return;
    
    equipmentsGridApi.showLoadingOverlay();

    try {
        const response = await fetch('/api/equipamentos', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        equipmentsData = data.equipamentos || [];
        
        equipmentsGridApi.setGridOption("rowData", equipmentsData);
        updateEquipmentsStats();
    } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
        Utils.showToast('Erro ao carregar equipamentos', 'error');
        equipmentsGridApi.setGridOption("rowData", []);
    }
};

const SAVE_EQUIPMENTS_COLUMN_STATE = () => {
    if (!equipmentsGridApi) return;
    
    let columnState = equipmentsGridApi.getColumnState();
    let columnPositions = columnState.map((col, index) => ({
        colId: col.colId,
        hide: col.hide,
        width: col.width,
        position: index,
        sort: col.sort,
        sortIndex: col.sortIndex,
    }));

    localStorage.setItem("equipmentsColumnPositions", JSON.stringify(columnPositions));
};

const EQUIPMENTS_FORMDATA = (container) => {
    let object = {};
    let inputs = container.querySelectorAll("input, select, textarea");

    inputs.forEach((input) => {
        if (input.name) {
            if (input.type === "checkbox") {
                object[input.name] = input.checked;
            } else if (input.type === "radio") {
                if (input.checked) object[input.name] = input.value;
            } else {
                object[input.name] = input.value;
            }
        }
    });

    return object;
};

const ADD_EQUIPAMENTO = async () => {
    const modal = document.querySelector("#dynamicModal");
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    // Carregar tipos de equipamento
    await loadEquipmentTypes();

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Código Interno *</label>
                <input type="text" class="form-control" name="codigo_interno" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Nome *</label>
                <input type="text" class="form-control" name="nome" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Tipo de Equipamento *</label>
                <select class="form-control" name="tipo_equipamento_id" required>
                    <option value="">Selecione...</option>
                    ${equipmentTypes.map(type => `<option value="${type.id}">${type.nome}</option>`).join('')}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Modelo *</label>
                <input type="text" class="form-control" name="modelo" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Fabricante *</label>
                <input type="text" class="form-control" name="fabricante" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Número de Série *</label>
                <input type="text" class="form-control" name="numero_serie" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Localização *</label>
                <input type="text" class="form-control" name="localizacao" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Data de Aquisição *</label>
                <input type="date" class="form-control" name="data_aquisicao" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Status</label>
                <select class="form-control" name="status">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="manutencao">Em Manutenção</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Horímetro Atual</label>
                <input type="number" class="form-control" name="horimetro_atual" step="0.1" min="0">
            </div>
            <div class="form-group col-sm-6">
                <label>Valor de Aquisição</label>
                <input type="number" class="form-control" name="valor_aquisicao" step="0.01" min="0">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3"></textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Novo Equipamento";

    $(modal).modal('show');
    
    // Configurar botão de salvar
    $(buttons[0]).off("click").on("click", async () => {
        const formData = EQUIPMENTS_FORMDATA(modalBody);
        
        // Validação básica
        if (!formData.codigo_interno || !formData.nome || !formData.tipo_equipamento_id || 
            !formData.modelo || !formData.fabricante || !formData.numero_serie || 
            !formData.localizacao || !formData.data_aquisicao) {
            Utils.showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            const response = await fetch('/api/equipamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar equipamento');
            }

            await SYNC_EQUIPMENTS_GRID_DATA();
            $(modal).modal('hide');
            Utils.showToast('Equipamento criado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar equipamento:', error);
            Utils.showToast(error.message, 'error');
        }
    });
};

const EDIT_EQUIPAMENTO = async (params) => {
    const rowData = params.node.data;
    const modal = document.querySelector("#dynamicModal");
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    // Carregar tipos de equipamento
    await loadEquipmentTypes();

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Código Interno *</label>
                <input type="text" class="form-control" name="codigo_interno" value="${rowData.codigo_interno || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Nome *</label>
                <input type="text" class="form-control" name="nome" value="${rowData.nome || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Tipo de Equipamento *</label>
                <select class="form-control" name="tipo_equipamento_id" required>
                    <option value="">Selecione...</option>
                    ${equipmentTypes.map(type => 
                        `<option value="${type.id}" ${type.id == rowData.tipo_equipamento_id ? 'selected' : ''}>${type.nome}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Modelo *</label>
                <input type="text" class="form-control" name="modelo" value="${rowData.modelo || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Fabricante *</label>
                <input type="text" class="form-control" name="fabricante" value="${rowData.fabricante || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Número de Série *</label>
                <input type="text" class="form-control" name="numero_serie" value="${rowData.numero_serie || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Localização *</label>
                <input type="text" class="form-control" name="localizacao" value="${rowData.localizacao || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Data de Aquisição *</label>
                <input type="date" class="form-control" name="data_aquisicao" value="${rowData.data_aquisicao || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Status</label>
                <select class="form-control" name="status">
                    <option value="ativo" ${rowData.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                    <option value="inativo" ${rowData.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                    <option value="manutencao" ${rowData.status === 'manutencao' ? 'selected' : ''}>Em Manutenção</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Horímetro Atual</label>
                <input type="number" class="form-control" name="horimetro_atual" value="${rowData.horimetro_atual || ''}" step="0.1" min="0">
            </div>
            <div class="form-group col-sm-6">
                <label>Valor de Aquisição</label>
                <input type="number" class="form-control" name="valor_aquisicao" value="${rowData.valor_aquisicao || ''}" step="0.01" min="0">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3">${rowData.observacoes || ''}</textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Editar Equipamento";

    $(modal).modal('show');
    
    // Configurar botão de salvar
    $(buttons[0]).off("click").on("click", async () => {
        const formData = EQUIPMENTS_FORMDATA(modalBody);

        try {
            const response = await fetch(`/api/equipamentos/${rowData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar equipamento');
            }

            await SYNC_EQUIPMENTS_GRID_DATA();
            $(modal).modal('hide');
            Utils.showToast('Equipamento atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar equipamento:', error);
            Utils.showToast(error.message, 'error');
        }
    });
};

const DELETE_EQUIPAMENTO = async (params) => {
    const rowData = params.node.data;

    const confirmed = await Utils.showConfirm(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir o equipamento "${rowData.nome}"?`,
        'Excluir',
        'Cancelar'
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/equipamentos/${rowData.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir equipamento');
        }

        params.api.applyTransaction({ remove: [rowData] });
        params.api.refreshCells({ force: true });
        updateEquipmentsStats();
        Utils.showToast('Equipamento excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        Utils.showToast(error.message, 'error');
    }
};

const loadEquipmentTypes = async () => {
    try {
        const response = await fetch('/api/tipos-equipamento', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            equipmentTypes = data.tipos_equipamento || [];
        }
    } catch (error) {
        console.error('Erro ao carregar tipos de equipamento:', error);
        equipmentTypes = [];
    }
};

const updateEquipmentsStats = () => {
    const stats = {
        total: equipmentsData.length,
        ativos: equipmentsData.filter(item => item.status === 'ativo').length,
        manutencao: equipmentsData.filter(item => item.status === 'manutencao').length,
        inativos: equipmentsData.filter(item => item.status === 'inativo').length
    };

    // Se há filtros aplicados, usar dados filtrados
    if (equipmentsGridApi) {
        const filteredData = [];
        equipmentsGridApi.forEachNodeAfterFilter(node => {
            filteredData.push(node.data);
        });
        
        if (filteredData.length !== equipmentsData.length) {
            stats.total = filteredData.length;
            stats.ativos = filteredData.filter(item => item.status === 'ativo').length;
            stats.manutencao = filteredData.filter(item => item.status === 'manutencao').length;
            stats.inativos = filteredData.filter(item => item.status === 'inativo').length;
        }
    }

    const statElements = {
        total: document.getElementById('stat-total'),
        ativos: document.getElementById('stat-ativos'),
        manutencao: document.getElementById('stat-manutencao'),
        inativos: document.getElementById('stat-inativos')
    };

    Object.keys(statElements).forEach(key => {
        if (statElements[key]) {
            statElements[key].textContent = stats[key];
        }
    });
};

const EQUIPMENTS_GRID_INIT = () => {
    const gridOptions = {
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
            floatingFilter: true,
        },
        onGridReady: async () => {
            const savedColumnPositions = JSON.parse(localStorage.getItem("equipmentsColumnPositions"));
            equipmentsInitialColumnState = equipmentsGridApi.getColumnState();

            if (savedColumnPositions) {
                try {
                    equipmentsGridApi.applyColumnState({ state: savedColumnPositions, applyOrder: true });
                } catch (error) {
                    console.error(error);
                }
            }
        },
        pagination: true,
        paginationPageSize: 50,
        tooltipShowDelay: 500,
        tooltipInteraction: true,
        overlayLoadingTemplate: "",
        loadingOverlayComponent: 'customLoadingOverlay',
        loadingOverlayComponentParams: {
            loadingMessage: "Carregando equipamentos...",
        },
        animateRows: true,
        onColumnMoved: SAVE_EQUIPMENTS_COLUMN_STATE,
        onColumnResized: SAVE_EQUIPMENTS_COLUMN_STATE,
        onColumnVisible: SAVE_EQUIPMENTS_COLUMN_STATE,
        onFilterChanged: updateEquipmentsStats,
        getContextMenuItems(params) {
            const options = [
                {
                    name: "Editar",
                    action: () => EDIT_EQUIPAMENTO(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    `,
                },
                {
                    name: "Excluir",
                    action: () => DELETE_EQUIPAMENTO(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                        </svg>
                    `,
                },
            ];

            return [...options, ...params.defaultItems.filter((item) => 
                !["export", "copy", "paste", "cut", "copyWithHeaders", "copyWithGroupHeaders"].includes(item)
            )];
        },
        columnDefs: [
            { 
                headerName: "Código", 
                field: "codigo_interno",
                minWidth: 120,
                maxWidth: 150
            },
            { 
                headerName: "Nome do Equipamento", 
                field: "nome",
                minWidth: 200
            },
            { 
                headerName: "Tipo", 
                field: "tipo_equipamento_nome",
                minWidth: 150
            },
            { 
                headerName: "Modelo", 
                field: "modelo",
                minWidth: 150
            },
            { 
                headerName: "Fabricante", 
                field: "fabricante",
                minWidth: 150
            },
            { 
                headerName: "Número Série", 
                field: "numero_serie",
                minWidth: 150
            },
            { 
                headerName: "Status", 
                field: "status",
                minWidth: 120,
                cellRenderer: (params) => {
                    const statusMap = {
                        'ativo': '<span class="badge badge-success">Ativo</span>',
                        'inativo': '<span class="badge badge-danger">Inativo</span>',
                        'manutencao': '<span class="badge badge-warning">Em Manutenção</span>'
                    };
                    return statusMap[params.value] || params.value;
                }
            },
            { 
                headerName: "Localização", 
                field: "localizacao",
                minWidth: 150
            },
            { 
                headerName: "Data Aquisição", 
                field: "data_aquisicao",
                minWidth: 130,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleDateString('pt-BR');
                }
            }
        ],
    };

    const gridDiv = document.querySelector("#equipments-grid");
    if (!gridDiv) {
        console.error('Grid container não encontrado');
        return;
    }

    gridDiv.innerHTML = "";
    gridDiv.style.height = "calc(75vh - 40px)";
    gridDiv.className = "ag-theme-alpine";

    equipmentsGridApi = agGrid.createGrid(gridDiv, gridOptions);
};

// Classe para compatibilidade com o sistema existente
class EquipmentsPage {
    constructor() {
        this.gridApi = null;
        this.data = [];
    }

    async render(container) {
        try {
            container.innerHTML = this.getHTML();
            await this.init();
        } catch (error) {
            console.error('Erro ao renderizar página de equipamentos:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async init() {
        EQUIPMENTS_GRID_INIT();
        await loadEquipmentTypes();
        await SYNC_EQUIPMENTS_GRID_DATA();
        this.setupEvents();
    }

    setupEvents() {
        // Botão de refresh
        const refreshBtn = document.querySelector('#refresh-equipments');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => SYNC_EQUIPMENTS_GRID_DATA());
        }

        // Botão de novo equipamento
        const createBtn = document.querySelector('#create-equipment');
        if (createBtn) {
            createBtn.addEventListener('click', () => ADD_EQUIPAMENTO());
        }

        // Botão de exportar
        const exportBtn = document.querySelector('#export-equipments');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (equipmentsGridApi) {
                    equipmentsGridApi.exportDataAsCsv({
                        fileName: `equipamentos_${new Date().toISOString().split('T')[0]}.csv`,
                        columnSeparator: ';'
                    });
                }
            });
        }
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
                        <button class="btn btn-outline" id="refresh-equipments">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-equipments">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-equipment">
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
}

// Export the class to the global scope
window.EquipmentsPage = EquipmentsPage;


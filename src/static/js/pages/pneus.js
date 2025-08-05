// Página de Pneus com AG-Grid (padrão sistema de estoque)
let tiresGridApi = null;
let tiresInitialColumnState = [];
let tiresData = [];

const SYNC_TIRES_GRID_DATA = async () => {
    if (!tiresGridApi) return;
    
    tiresGridApi.showLoadingOverlay();

    try {
        const response = await fetch("/api/pneus", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        tiresData = data.pneus || [];
        
        tiresGridApi.setGridOption("rowData", tiresData);
        updateTiresStats();
    } catch (error) {
        console.error("Erro ao carregar pneus:", error);
        Utils.showToast("Erro ao carregar pneus", "error");
        tiresGridApi.setGridOption("rowData", []);
    }
};

const SAVE_TIRES_COLUMN_STATE = () => {
    if (!tiresGridApi) return;
    
    let columnState = tiresGridApi.getColumnState();
    let columnPositions = columnState.map((col, index) => ({
        colId: col.colId,
        hide: col.hide,
        width: col.width,
        position: index,
        sort: col.sort,
        sortIndex: col.sortIndex,
    }));

    localStorage.setItem("tiresColumnPositions", JSON.stringify(columnPositions));
};

const TIRES_FORMDATA = (container) => {
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

const ADD_TIRE = async () => {
    const modal = document.querySelector("#dynamicModal");
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Número de Fogo *</label>
                <input type="text" class="form-control" name="numero_fogo" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Marca *</label>
                <input type="text" class="form-control" name="marca" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Modelo *</label>
                <input type="text" class="form-control" name="modelo" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Medida *</label>
                <input type="text" class="form-control" name="medida" required>
            </div>
            <div class="form-group col-sm-6">
                <label>DOT</label>
                <input type="text" class="form-control" name="dot">
            </div>
            <div class="form-group col-sm-6">
                <label>Status *</label>
                <select class="form-control" name="status" required>
                    <option value="em_uso">Em Uso</option>
                    <option value="estoque">Estoque</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="recapagem">Recapagem</option>
                    <option value="descarte">Descarte</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Sulco Inicial (mm) *</label>
                <input type="number" class="form-control" name="sulco_inicial" step="0.1" min="0" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Sulco Atual (mm) *</label>
                <input type="number" class="form-control" name="sulco_atual" step="0.1" min="0" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Posição</label>
                <input type="text" class="form-control" name="posicao">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3"></textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Novo Pneu";

    $(modal).modal("show");
    
    $(buttons[0]).off("click").on("click", async () => {
        const formData = TIRES_FORMDATA(modalBody);
        
        if (!formData.numero_fogo || !formData.marca || !formData.modelo || 
            !formData.medida || !formData.status || !formData.sulco_inicial || 
            !formData.sulco_atual) {
            Utils.showToast("Preencha todos os campos obrigatórios", "error");
            return;
        }

        try {
            const response = await fetch("/api/pneus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao criar pneu");
            }

            await SYNC_TIRES_GRID_DATA();
            $(modal).modal("hide");
            Utils.showToast("Pneu criado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao criar pneu:", error);
            Utils.showToast(error.message, "error");
        }
    });
};

const EDIT_TIRE = async (params) => {
    const rowData = params.node.data;
    const modal = document.querySelector("#dynamicModal");
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Número de Fogo *</label>
                <input type="text" class="form-control" name="numero_fogo" value="${rowData.numero_fogo || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Marca *</label>
                <input type="text" class="form-control" name="marca" value="${rowData.marca || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Modelo *</label>
                <input type="text" class="form-control" name="modelo" value="${rowData.modelo || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Medida *</label>
                <input type="text" class="form-control" name="medida" value="${rowData.medida || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>DOT</label>
                <input type="text" class="form-control" name="dot" value="${rowData.dot || ''}">
            </div>
            <div class="form-group col-sm-6">
                <label>Status *</label>
                <select class="form-control" name="status" required>
                    <option value="em_uso" ${rowData.status === 'em_uso' ? 'selected' : ''}>Em Uso</option>
                    <option value="estoque" ${rowData.status === 'estoque' ? 'selected' : ''}>Estoque</option>
                    <option value="manutencao" ${rowData.status === 'manutencao' ? 'selected' : ''}>Manutenção</option>
                    <option value="recapagem" ${rowData.status === 'recapagem' ? 'selected' : ''}>Recapagem</option>
                    <option value="descarte" ${rowData.status === 'descarte' ? 'selected' : ''}>Descarte</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Sulco Inicial (mm) *</label>
                <input type="number" class="form-control" name="sulco_inicial" value="${rowData.sulco_inicial || ''}" step="0.1" min="0" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Sulco Atual (mm) *</label>
                <input type="number" class="form-control" name="sulco_atual" value="${rowData.sulco_atual || ''}" step="0.1" min="0" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Posição</label>
                <input type="text" class="form-control" name="posicao" value="${rowData.posicao || ''}">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3">${rowData.observacoes || ''}</textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Editar Pneu";

    $(modal).modal("show");
    
    $(buttons[0]).off("click").on("click", async () => {
        const formData = TIRES_FORMDATA(modalBody);

        try {
            const response = await fetch(`/api/pneus/${rowData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao atualizar pneu");
            }

            await SYNC_TIRES_GRID_DATA();
            $(modal).modal("hide");
            Utils.showToast("Pneu atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar pneu:", error);
            Utils.showToast(error.message, "error");
        }
    });
};

const DELETE_TIRE = async (params) => {
    const rowData = params.node.data;

    const confirmed = await Utils.showConfirm(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir o pneu "${rowData.numero_fogo}"?`,
        "Excluir",
        "Cancelar"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/pneus/${rowData.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao excluir pneu");
        }

        params.api.applyTransaction({ remove: [rowData] });
        params.api.refreshCells({ force: true });
        updateTiresStats();
        Utils.showToast("Pneu excluído com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir pneu:", error);
        Utils.showToast(error.message, "error");
    }
};

const updateTiresStats = () => {
    const stats = {
        total: tiresData.length,
        em_uso: tiresData.filter(item => item.status === "em_uso").length,
        estoque: tiresData.filter(item => item.status === "estoque").length,
        manutencao: tiresData.filter(item => item.status === "manutencao").length,
        recapagem: tiresData.filter(item => item.status === "recapagem").length,
        descarte: tiresData.filter(item => item.status === "descarte").length,
        sulco_baixo: tiresData.filter(item => item.sulco_atual < 5 && item.status !== "descarte").length // Exemplo de sulco baixo
    };

    if (tiresGridApi) {
        const filteredData = [];
        tiresGridApi.forEachNodeAfterFilter(node => {
            filteredData.push(node.data);
        });
        
        if (filteredData.length !== tiresData.length) {
            stats.total = filteredData.length;
            stats.em_uso = filteredData.filter(item => item.status === "em_uso").length;
            stats.estoque = filteredData.filter(item => item.status === "estoque").length;
            stats.manutencao = filteredData.filter(item => item.status === "manutencao").length;
            stats.recapagem = filteredData.filter(item => item.status === "recapagem").length;
            stats.descarte = filteredData.filter(item => item.status === "descarte").length;
            stats.sulco_baixo = filteredData.filter(item => item.sulco_atual < 5 && item.status !== "descarte").length;
        }
    }

    const statElements = {
        total: document.getElementById("stat-total"),
        em_uso: document.getElementById("stat-em-uso"),
        estoque: document.getElementById("stat-estoque"),
        manutencao: document.getElementById("stat-manutencao"),
        recapagem: document.getElementById("stat-recapagem"),
        descarte: document.getElementById("stat-descarte"),
        sulco_baixo: document.getElementById("stat-sulco-baixo")
    };

    Object.keys(statElements).forEach(key => {
        if (statElements[key]) {
            statElements[key].textContent = stats[key];
        }
    });
};

const TIRES_GRID_INIT = () => {
    const gridOptions = {
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
            floatingFilter: true,
        },
        onGridReady: async () => {
            const savedColumnPositions = JSON.parse(localStorage.getItem("tiresColumnPositions"));
            tiresInitialColumnState = tiresGridApi.getColumnState();

            if (savedColumnPositions) {
                try {
                    tiresGridApi.applyColumnState({ state: savedColumnPositions, applyOrder: true });
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
        loadingOverlayComponent: "customLoadingOverlay",
        loadingOverlayComponentParams: {
            loadingMessage: "Carregando pneus...",
        },
        animateRows: true,
        onColumnMoved: SAVE_TIRES_COLUMN_STATE,
        onColumnResized: SAVE_TIRES_COLUMN_STATE,
        onColumnVisible: SAVE_TIRES_COLUMN_STATE,
        onFilterChanged: updateTiresStats,
        getContextMenuItems(params) {
            const options = [
                {
                    name: "Editar",
                    action: () => EDIT_TIRE(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    `,
                },
                {
                    name: "Excluir",
                    action: () => DELETE_TIRE(params),
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
                headerName: "Número de Fogo", 
                field: "numero_fogo",
                minWidth: 150
            },
            { 
                headerName: "Marca", 
                field: "marca",
                minWidth: 150
            },
            { 
                headerName: "Modelo", 
                field: "modelo",
                minWidth: 150
            },
            { 
                headerName: "Medida", 
                field: "medida",
                minWidth: 120
            },
            { 
                headerName: "DOT", 
                field: "dot",
                minWidth: 120
            },
            {
                headerName: "Status",
                field: "status",
                minWidth: 120,
                cellRenderer: (params) => {
                    const statusMap = {
                        "em_uso": "<span class=\"badge badge-success\">Em Uso</span>",
                        "estoque": "<span class=\"badge badge-info\">Estoque</span>",
                        "manutencao": "<span class=\"badge badge-warning\">Manutenção</span>",
                        "recapagem": "<span class=\"badge badge-primary\">Recapagem</span>",
                        "descarte": "<span class=\"badge badge-danger\">Descarte</span>"
                    };
                    return statusMap[params.value] || params.value;
                }
            },
            { 
                headerName: "Sulco Inicial (mm)", 
                field: "sulco_inicial",
                minWidth: 150
            },
            { 
                headerName: "Sulco Atual (mm)", 
                field: "sulco_atual",
                minWidth: 150
            },
            { 
                headerName: "Posição", 
                field: "posicao",
                minWidth: 120
            },
            { 
                headerName: "Criado em", 
                field: "created_at",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return "";
                    return new Date(params.value).toLocaleString("pt-BR");
                }
            }
        ],
    };

    const gridDiv = document.querySelector("#tires-grid");
    if (!gridDiv) {
        console.error("Grid container não encontrado");
        return;
    }

    gridDiv.innerHTML = "";
    gridDiv.style.height = "calc(75vh - 40px)";
    gridDiv.className = "ag-theme-alpine";

    tiresGridApi = agGrid.createGrid(gridDiv, gridOptions);
};

class TiresPage {
    constructor() {
        this.gridApi = null;
        this.data = [];
    }

    async render(container) {
        try {
            container.innerHTML = this.getHTML();
            await this.init();
        } catch (error) {
            console.error("Erro ao renderizar página de pneus:", error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async init() {
        TIRES_GRID_INIT();
        await SYNC_TIRES_GRID_DATA();
        this.setupEvents();
    }

    setupEvents() {
        const refreshBtn = document.querySelector("#refresh-tires");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => SYNC_TIRES_GRID_DATA());
        }

        const createBtn = document.querySelector("#create-tire");
        if (createBtn) {
            createBtn.addEventListener("click", () => ADD_TIRE());
        }

        const exportBtn = document.querySelector("#export-tires");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                if (tiresGridApi) {
                    tiresGridApi.exportDataAsCsv({
                        fileName: `pneus_${new Date().toISOString().split("T")[0]}.csv`,
                        columnSeparator: ";"
                    });
                }
            });
        }
    }

    getHTML() {
        return `
            <div class="tires-page">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-circle"></i>
                        <div>
                            <h1>Gestão de Pneus</h1>
                            <p>Controle completo de pneus com tratativas e medição de sulcos</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-tires">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-tires">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-tire">
                            <i class="fas fa-plus"></i>
                            Novo Pneu
                        </button>
                    </div>
                </div>

                <!-- Estatísticas rápidas -->
                <div class="quick-stats">
                    <div class="stat-card stat-card-success">
                        <div class="stat-icon">
                            <i class="fas fa-cog"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-em-uso">0</div>
                            <div class="stat-label">Em Uso</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-info">
                        <div class="stat-icon">
                            <i class="fas fa-box"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-estoque">0</div>
                            <div class="stat-label">Estoque</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-warning">
                        <div class="stat-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-sulco-baixo">0</div>
                            <div class="stat-label">Sulco Baixo</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-danger">
                        <div class="stat-icon">
                            <i class="fas fa-recycle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-recapagem">0</div>
                            <div class="stat-label">Recapagem</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-secondary">
                        <div class="stat-icon">
                            <i class="fas fa-trash"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-descarte">0</div>
                            <div class="stat-label">Descarte</div>
                        </div>
                    </div>
                    <div class="stat-card stat-card-primary">
                        <div class="stat-icon">
                            <i class="fas fa-road"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                </div>

                <!-- Grid Container -->
                <div class="grid-container">
                    <div id="tires-grid" class="ag-theme-alpine" style="height: 600px; width: 100%;"></div>
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
                <h3>Erro ao carregar pneus</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo(\'pneus\')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Expose the page class globally
window.TiresPage = TiresPage;


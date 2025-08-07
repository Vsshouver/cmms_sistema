// Página de Usuários com AG-Grid (padrão sistema de estoque)
let usersGridApi = null;
let usersInitialColumnState = [];
let usersData = [];

const SYNC_USERS_GRID_DATA = async () => {
    if (!usersGridApi) return;
    
    usersGridApi.showLoadingOverlay();

    try {
        const response = await fetch("/api/usuarios", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        usersData = data.usuarios || [];
        
        usersGridApi.setGridOption("rowData", usersData);
        updateUsersStats();
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
        Utils.showToast("Erro ao carregar usuários", "error");
        usersGridApi.setGridOption("rowData", []);
    }
};

const SAVE_USERS_COLUMN_STATE = () => {
    if (!usersGridApi) return;
    
    let columnState = usersGridApi.getColumnState();
    let columnPositions = columnState.map((col, index) => ({
        colId: col.colId,
        hide: col.hide,
        width: col.width,
        position: index,
        sort: col.sort,
        sortIndex: col.sortIndex,
    }));

    localStorage.setItem("usersColumnPositions", JSON.stringify(columnPositions));
};

const USERS_FORMDATA = (container) => {
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

const ADD_USER = async () => {
    const modal = document.querySelector("#dynamicModal");
    if (!modal) {
        console.error("Modal container não encontrado");
        return;
    }
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Nome Completo *</label>
                <input type="text" class="form-control" name="nome_completo" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Email *</label>
                <input type="email" class="form-control" name="email" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Senha *</label>
                <input type="password" class="form-control" name="senha" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Perfil *</label>
                <select class="form-control" name="perfil" required>
                    <option value="">Selecione...</option>
                    <option value="admin">Administrador</option>
                    <option value="pcm">PCM</option>
                    <option value="mecanico">Mecânico</option>
                    <option value="almoxarife">Almoxarife</option>
                    <option value="operador">Operador</option>
                    <option value="visualizador">Visualizador</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Telefone</label>
                <input type="text" class="form-control" name="telefone">
            </div>
            <div class="form-group col-sm-6">
                <label>Departamento</label>
                <input type="text" class="form-control" name="departamento">
            </div>
            <div class="form-group col-sm-6">
                <label>Ativo</label>
                <input type="checkbox" name="ativo" checked>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Novo Usuário";

    $(modal).modal("show");
    
    $(buttons[0]).off("click").on("click", async () => {
        const formData = USERS_FORMDATA(modalBody);
        
        if (!formData.nome_completo || !formData.email || !formData.senha || !formData.perfil) {
            Utils.showToast("Preencha todos os campos obrigatórios", "error");
            return;
        }

        try {
            const response = await fetch("/api/usuarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao criar usuário");
            }

            await SYNC_USERS_GRID_DATA();
            $(modal).modal("hide");
            Utils.showToast("Usuário criado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            Utils.showToast(error.message, "error");
        }
    });
};

const EDIT_USER = async (params) => {
    const rowData = params.node.data;
    const modal = document.querySelector("#dynamicModal");
    if (!modal) {
        console.error("Modal container não encontrado");
        return;
    }
    const modalBody = modal.querySelector(".modal-body");
    const modalTitle = modal.querySelector(".modal-title");
    const buttons = modal.querySelectorAll(".modal-footer button");

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Nome Completo *</label>
                <input type="text" class="form-control" name="nome_completo" value="${rowData.nome_completo || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Email *</label>
                <input type="email" class="form-control" name="email" value="${rowData.email || ''}" required>
            </div>
            <div class="form-group col-sm-6">
                <label>Perfil *</label>
                <select class="form-control" name="perfil" required>
                    <option value="">Selecione...</option>
                    <option value="admin" ${rowData.perfil === 'admin' ? 'selected' : ''}>Administrador</option>
                    <option value="pcm" ${rowData.perfil === 'pcm' ? 'selected' : ''}>PCM</option>
                    <option value="mecanico" ${rowData.perfil === 'mecanico' ? 'selected' : ''}>Mecânico</option>
                    <option value="almoxarife" ${rowData.perfil === 'almoxarife' ? 'selected' : ''}>Almoxarife</option>
                    <option value="operador" ${rowData.perfil === 'operador' ? 'selected' : ''}>Operador</option>
                    <option value="visualizador" ${rowData.perfil === 'visualizador' ? 'selected' : ''}>Visualizador</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Telefone</label>
                <input type="text" class="form-control" name="telefone" value="${rowData.telefone || ''}">
            </div>
            <div class="form-group col-sm-6">
                <label>Departamento</label>
                <input type="text" class="form-control" name="departamento" value="${rowData.departamento || ''}">
            </div>
            <div class="form-group col-sm-6">
                <label>Ativo</label>
                <input type="checkbox" name="ativo" ${rowData.ativo ? 'checked' : ''}>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = "Editar Usuário";

    $(modal).modal("show");
    
    $(buttons[0]).off("click").on("click", async () => {
        const formData = USERS_FORMDATA(modalBody);

        try {
            const response = await fetch(`/api/usuarios/${rowData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Erro ao atualizar usuário");
            }

            await SYNC_USERS_GRID_DATA();
            $(modal).modal("hide");
            Utils.showToast("Usuário atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            Utils.showToast(error.message, "error");
        }
    });
};

const DELETE_USER = async (params) => {
    const rowData = params.node.data;

    const confirmed = await Utils.showConfirm(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir o usuário "${rowData.nome_completo}"?`,
        "Excluir",
        "Cancelar"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/usuarios/${rowData.id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao excluir usuário");
        }

        params.api.applyTransaction({ remove: [rowData] });
        params.api.refreshCells({ force: true });
        updateUsersStats();
        Utils.showToast("Usuário excluído com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        Utils.showToast(error.message, "error");
    }
};

const RESET_PASSWORD = async (params) => {
    const rowData = params.node.data;

    const confirmed = await Utils.showConfirm(
        "Redefinir Senha",
        `Tem certeza que deseja redefinir a senha do usuário "${rowData.nome_completo}"? Uma senha temporária será gerada.`, 
        "Redefinir",
        "Cancelar"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/usuarios/${rowData.id}/reset-password`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Erro ao redefinir senha");
        }

        const result = await response.json();
        Utils.showToast(`Senha redefinida com sucesso! Nova senha: ${result.nova_senha}`, "success");
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        Utils.showToast(error.message, "error");
    }
};

const updateUsersStats = () => {
    const stats = {
        total: usersData.length,
        ativos: usersData.filter(user => user.ativo).length,
        inativos: usersData.filter(user => !user.ativo).length,
        admins: usersData.filter(user => user.perfil === "admin").length
    };

    if (usersGridApi) {
        const filteredData = [];
        usersGridApi.forEachNodeAfterFilter(node => {
            filteredData.push(node.data);
        });
        
        if (filteredData.length !== usersData.length) {
            stats.total = filteredData.length;
            stats.ativos = filteredData.filter(user => user.ativo).length;
            stats.inativos = filteredData.filter(user => !user.ativo).length;
            stats.admins = filteredData.filter(user => user.perfil === "admin").length;
        }
    }

    const statElements = {
        total: document.getElementById("stat-total"),
        ativos: document.getElementById("stat-ativos"),
        inativos: document.getElementById("stat-inativos"),
        admins: document.getElementById("stat-admins")
    };

    Object.keys(statElements).forEach(key => {
        if (statElements[key]) {
            statElements[key].textContent = stats[key];
        }
    });
};

const USERS_GRID_INIT = () => {
    const initGrid = () => {
        const gridOptions = {
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
            floatingFilter: true,
        },
        onGridReady: async () => {
            const savedColumnPositions = JSON.parse(localStorage.getItem("usersColumnPositions"));
            usersInitialColumnState = usersGridApi.getColumnState();

            if (savedColumnPositions) {
                try {
                    usersGridApi.applyColumnState({ state: savedColumnPositions, applyOrder: true });
                } catch (error) {
                    console.error(error);
                }
            }
        },
        pagination: true,
        paginationPageSize: 50,
        tooltipShowDelay: 500,
        tooltipInteraction: true,
        animateRows: true,
        onColumnMoved: SAVE_USERS_COLUMN_STATE,
        onColumnResized: SAVE_USERS_COLUMN_STATE,
        onColumnVisible: SAVE_USERS_COLUMN_STATE,
        onFilterChanged: updateUsersStats,
        getContextMenuItems(params) {
            const options = [
                {
                    name: "Editar",
                    action: () => EDIT_USER(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    `,
                },
                {
                    name: "Redefinir Senha",
                    action: () => RESET_PASSWORD(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                    `,
                },
                {
                    name: "Excluir",
                    action: () => DELETE_USER(params),
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
                headerName: "Nome", 
                field: "nome_completo",
                minWidth: 200,
                cellRenderer: (params) => {
                    const avatar = params.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(params.value || '')}&background=random`;
                    return `
                        <div class="user-cell">
                            <img src="${avatar}" alt="${params.value}" class="user-avatar" onerror="this.src=\'https://ui-avatars.com/api/?name=${encodeURIComponent(params.value || '')}&background=random\'\">
                            <div class="user-info">
                                <div class="user-name">${params.value || ''}</div>
                                <div class="user-email">${params.data.email || ''}</div>
                            </div>
                        </div>
                    `;
                }
            },
            { 
                headerName: "Email", 
                field: "email",
                minWidth: 200
            },
            { 
                headerName: "Perfil", 
                field: "perfil",
                minWidth: 120,
                cellRenderer: (params) => {
                    const perfilMap = {
                        "admin": "<span class=\"badge badge-primary\">Administrador</span>",
                        "pcm": "<span class=\"badge badge-info\">PCM</span>",
                        "mecanico": "<span class=\"badge badge-warning\">Mecânico</span>",
                        "almoxarife": "<span class=\"badge badge-success\">Almoxarife</span>",
                        "operador": "<span class=\"badge badge-secondary\">Operador</span>",
                        "visualizador": "<span class=\"badge badge-light\">Visualizador</span>"
                    };
                    return perfilMap[params.value] || params.value;
                }
            },
            { 
                headerName: "Telefone", 
                field: "telefone",
                minWidth: 150
            },
            { 
                headerName: "Departamento", 
                field: "departamento",
                minWidth: 150
            },
            { 
                headerName: "Ativo", 
                field: "ativo",
                minWidth: 100,
                cellRenderer: (params) => {
                    return params.value 
                        ? "<span class=\"badge badge-success\">Sim</span>"
                        : "<span class=\"badge badge-danger\">Não</span>";
                }
            },
            { 
                headerName: "Último Acesso", 
                field: "ultimo_acesso",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleString("pt-BR");
                }
            },
            { 
                headerName: "Criado em", 
                field: "created_at",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleString("pt-BR");
                }
            }
        ],
    };

    const gridDiv = document.querySelector("#users-grid");
    if (!gridDiv) {
        console.error("Grid container não encontrado");
        return;
    }

    gridDiv.innerHTML = "";
    gridDiv.style.height = "calc(75vh - 40px)";
    gridDiv.className = "ag-theme-alpine";

    usersGridApi = agGrid.createGrid(gridDiv, gridOptions);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGrid);
    } else {
        initGrid();
    }
};

class UsersPage {
    constructor() {
        this.gridApi = null;
        this.data = [];
    }

    async render(container) {
        try {
            container.innerHTML = this.getHTML();
            await this.init();
        } catch (error) {
            console.error("Erro ao renderizar página de usuários:", error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async init() {
        USERS_GRID_INIT();
        await SYNC_USERS_GRID_DATA();
        this.setupEvents();
    }

    setupEvents() {
        const refreshBtn = document.querySelector("#refresh-users");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => SYNC_USERS_GRID_DATA());
        }

        const createBtn = document.querySelector("#create-user");
        if (createBtn) {
            createBtn.addEventListener("click", () => ADD_USER());
        }

        const exportBtn = document.querySelector("#export-users");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                if (usersGridApi) {
                    usersGridApi.exportDataAsCsv({
                        fileName: `usuarios_${new Date().toISOString().split("T")[0]}.csv`,
                        columnSeparator: ";"
                    });
                }
            });
        }
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
                        <button class="btn btn-outline" id="refresh-users">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-users">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-user">
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

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar usuários</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="appNavigation.navigateTo(\'usuarios\')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Expose the page class globally
window.UsersPage = UsersPage;


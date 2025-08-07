// Página de Ordens de Serviço com AG-Grid (padrão sistema de estoque)
let workOrdersGridApi = null;
let workOrdersInitialColumnState = [];
let workOrdersData = [];
let workOrdersEquipments = [];
let workOrdersMechanics = [];
let workOrdersMaintenanceTypes = [];

const SYNC_WORK_ORDERS_GRID_DATA = async () => {
    if (!workOrdersGridApi) return;
    
    workOrdersGridApi.showLoadingOverlay();

    try {
        const data = await API.workOrders.getAll();
        workOrdersData = data.ordens_servico || data.data || data || [];
        
        workOrdersGridApi.setGridOption("rowData", workOrdersData);
        updateWorkOrdersStats();
    } catch (error) {
        console.error("Erro ao carregar ordens de serviço:", error);
        Utils.showToast("Erro ao carregar ordens de serviço", "error");
        workOrdersGridApi.setGridOption("rowData", []);
    }
};

const SAVE_WORK_ORDERS_COLUMN_STATE = () => {
    if (!workOrdersGridApi) return;
    
    let columnState = workOrdersGridApi.getColumnState();
    let columnPositions = columnState.map((col, index) => ({
        colId: col.colId,
        hide: col.hide,
        width: col.width,
        position: index,
        sort: col.sort,
        sortIndex: col.sortIndex,
    }));

    localStorage.setItem("workOrdersColumnPositions", JSON.stringify(columnPositions));
};

const WORK_ORDERS_FORMDATA = (container) => {
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

const ADD_WORK_ORDER = async () => {
    const modal = document.querySelector('#modal-ordem-servico');
    if (!modal) return;
    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = modal.querySelector('.modal-title');
    const buttons = modal.querySelectorAll('.modal-footer button');

    await loadWorkOrdersRelatedData();

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Equipamento *</label>
                <select class="form-control" name="equipamento_id" required>
                    <option value="">Selecione...</option>
                    ${workOrdersEquipments.map(eq => `<option value="${eq.id}">${eq.nome} (${eq.codigo_interno})</option>`).join("")}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Tipo de Manutenção *</label>
                <select class="form-control" name="tipo" required>
                    <option value="">Selecione...</option>
                    ${workOrdersMaintenanceTypes.map(type => `<option value="${type.id}">${type.nome}</option>`).join("")}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Prioridade *</label>
                <select class="form-control" name="prioridade" required>
                    <option value="baixa">Baixa</option>
                    <option value="normal" selected>Normal</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Mecânico Responsável</label>
                <select class="form-control" name="mecanico_id">
                    <option value="">Selecione...</option>
                    ${workOrdersMechanics.map(mech => `<option value="${mech.id}">${mech.nome_completo}</option>`).join("")}
                </select>
            </div>
            <div class="form-group col-sm-12">
                <label>Descrição do Problema *</label>
                <textarea class="form-control" name="descricao_problema" rows="3" required></textarea>
            </div>
            <div class="form-group col-sm-6">
                <label>Data Prevista de Conclusão</label>
                <input type="datetime-local" class="form-control" name="data_prevista">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3"></textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = 'Nova Ordem de Serviço';

    modal.classList.remove('hidden');

    buttons[1]?.addEventListener('click', () => modal.classList.add('hidden'));

    $(buttons[0]).off('click').on('click', async () => {
        const formData = WORK_ORDERS_FORMDATA(modalBody);
        
        if (!formData.equipamento_id || !formData.tipo || !formData.prioridade || !formData.descricao_problema) {
            Utils.showToast("Preencha todos os campos obrigatórios", "error");
            return;
        }

        try {
            await API.workOrders.create(formData);
            await SYNC_WORK_ORDERS_GRID_DATA();
            modal.classList.add('hidden');
            Utils.showToast('Ordem de serviço criada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao criar ordem de serviço:', error);
            Utils.showToast(error.message, 'error');
        }
    });
};

const EDIT_WORK_ORDER = async (params) => {
    const rowData = params.node.data;
    const modal = document.querySelector('#modal-ordem-servico');
    if (!modal) return;
    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = modal.querySelector('.modal-title');
    const buttons = modal.querySelectorAll('.modal-footer button');

    await loadWorkOrdersRelatedData();

    const template = /*html*/ `
        <div class="row">
            <div class="form-group col-sm-6">
                <label>Número da OS</label>
                <input type="text" class="form-control" value="${rowData.numero_os || ''}" disabled>
            </div>
            <div class="form-group col-sm-6">
                <label>Equipamento *</label>
                <select class="form-control" name="equipamento_id" required>
                    <option value="">Selecione...</option>
                    ${workOrdersEquipments.map(eq => 
                        `<option value="${eq.id}" ${eq.id == rowData.equipamento_id ? 'selected' : ''}>${eq.nome} (${eq.codigo_interno})</option>`
                    ).join("")}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Tipo de Manutenção *</label>
                <select class="form-control" name="tipo" required>
                    <option value="">Selecione...</option>
                    ${workOrdersMaintenanceTypes.map(type => 
                        `<option value="${type.id}" ${type.id == rowData.tipo_manutencao_id ? 'selected' : ''}>${type.nome}</option>`
                    ).join("")}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Prioridade *</label>
                <select class="form-control" name="prioridade" required>
                    <option value="baixa" ${rowData.prioridade === 'baixa' ? 'selected' : ''}>Baixa</option>
                    <option value="normal" ${rowData.prioridade === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="alta" ${rowData.prioridade === 'alta' ? 'selected' : ''}>Alta</option>
                    <option value="critica" ${rowData.prioridade === 'critica' ? 'selected' : ''}>Crítica</option>
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Mecânico Responsável</label>
                <select class="form-control" name="mecanico_id">
                    <option value="">Selecione...</option>
                    ${workOrdersMechanics.map(mech => 
                        `<option value="${mech.id}" ${mech.id == rowData.mecanico_id ? 'selected' : ''}>${mech.nome_completo}</option>`
                    ).join("")}
                </select>
            </div>
            <div class="form-group col-sm-6">
                <label>Status</label>
                <select class="form-control" name="status">
                    <option value="pendente" ${rowData.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="andamento" ${rowData.status === 'andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="concluida" ${rowData.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                    <option value="cancelada" ${rowData.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                    <option value="pausada" ${rowData.status === 'pausada' ? 'selected' : ''}>Pausada</option>
                </select>
            </div>
            <div class="form-group col-sm-12">
                <label>Descrição do Problema *</label>
                <textarea class="form-control" name="descricao_problema" rows="3" required>${rowData.descricao_problema || ''}</textarea>
            </div>
            <div class="form-group col-sm-12">
                <label>Descrição da Solução</label>
                <textarea class="form-control" name="descricao_solucao" rows="3">${rowData.descricao_solucao || ''}</textarea>
            </div>
            <div class="form-group col-sm-6">
                <label>Data Prevista de Conclusão</label>
                <input type="datetime-local" class="form-control" name="data_prevista" value="${rowData.data_prevista ? new Date(rowData.data_prevista).toISOString().slice(0,16) : ''}">
            </div>
            <div class="form-group col-sm-12">
                <label>Observações</label>
                <textarea class="form-control" name="observacoes" rows="3">${rowData.observacoes || ''}</textarea>
            </div>
        </div>
    `;

    modalBody.innerHTML = template;
    modalTitle.textContent = 'Editar Ordem de Serviço';

    modal.classList.remove('hidden');

    buttons[1]?.addEventListener('click', () => modal.classList.add('hidden'));

    $(buttons[0]).off('click').on('click', async () => {
        const formData = WORK_ORDERS_FORMDATA(modalBody);

        try {
            await API.workOrders.update(rowData.id, formData);
            await SYNC_WORK_ORDERS_GRID_DATA();
            modal.classList.add('hidden');
            Utils.showToast('Ordem de serviço atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao atualizar ordem de serviço:', error);
            Utils.showToast(error.message, 'error');
        }
    });
};

const DELETE_WORK_ORDER = async (params) => {
    const rowData = params.node.data;

    const confirmed = await Utils.showConfirm(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir a Ordem de Serviço "${rowData.numero_os}"?`,
        "Excluir",
        "Cancelar"
    );

    if (!confirmed) return;

    try {
        await API.workOrders.delete(rowData.id);
        params.api.applyTransaction({ remove: [rowData] });
        params.api.refreshCells({ force: true });
        updateWorkOrdersStats();
        Utils.showToast("Ordem de serviço excluída com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao excluir ordem de serviço:", error);
        Utils.showToast(error.message, "error");
    }
};

const VIEW_WORK_ORDER = async (params) => {
    const id = params.node.data.id;
    const modal = document.querySelector('#modal-ordem-servico');
    if (!modal) return;
    const modalBody = modal.querySelector('.modal-body');
    const modalTitle = modal.querySelector('.modal-title');
    const buttons = modal.querySelectorAll('.modal-footer button');

    try {
        const data = await API.workOrders.get(id);

        const template = /*html*/`
            <div class="space-y-2">
                <p><strong>Número:</strong> ${data.numero_os}</p>
                <p><strong>Equipamento:</strong> ${data.equipamento ? `${data.equipamento.nome} (${data.equipamento.codigo_interno})` : ''}</p>
                <p><strong>Tipo:</strong> ${data.tipo_manutencao ? data.tipo_manutencao.nome : data.tipo}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Mecânico:</strong> ${data.mecanico ? data.mecanico.nome_completo : ''}</p>
                <p><strong>Data Abertura:</strong> ${data.data_abertura ? new Date(data.data_abertura).toLocaleString('pt-BR') : ''}</p>
                <p><strong>Data Prevista:</strong> ${data.data_prevista ? new Date(data.data_prevista).toLocaleString('pt-BR') : ''}</p>
                <p><strong>Descrição:</strong><br>${data.descricao_problema || ''}</p>
                <div class="mt-4">
                    <label>Assinatura:</label>
                    <canvas id="os-signature" style="border:1px solid #ccc;width:100%;height:150px;"></canvas>
                    <button type="button" class="btn btn-sm btn-outline mt-2" id="clear-signature">Limpar</button>
                </div>
            </div>
        `;

        modalBody.innerHTML = template;
        modalTitle.textContent = 'Visualizar Ordem de Serviço';

        const [closeBtn, printBtn] = buttons;
        closeBtn.textContent = 'Fechar';
        $(printBtn).off('click');
        printBtn.textContent = 'Imprimir';

        const canvas = modalBody.querySelector('#os-signature');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        let drawing = false;
        canvas.addEventListener('mousedown', e => { drawing = true; ctx.moveTo(e.offsetX, e.offsetY); });
        canvas.addEventListener('mousemove', e => { if (drawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); }});
        ['mouseup','mouseleave'].forEach(ev => canvas.addEventListener(ev, () => drawing = false));
        modalBody.querySelector('#clear-signature').addEventListener('click', () => ctx.clearRect(0,0,canvas.width,canvas.height));

        $(printBtn).on('click', () => {
            const signature = canvas.toDataURL();
            PRINT_WORK_ORDER(data, signature);
        });

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao visualizar OS:', error);
        Utils.showToast('Erro ao carregar OS', 'error');
    }
};

const PRINT_WORK_ORDER = (data, signature) => {
    const win = window.open('', '_blank');
    const html = `<!DOCTYPE html><html><head><title>OS ${data.numero_os}</title>
        <style>
            body { font-family: Arial, sans-serif; padding:20px; }
            .section { margin-bottom: 8px; }
            .signature { margin-top:40px; }
            @media print { .no-print { display:none; } }
        </style>
    </head><body>
        <h1>Ordem de Serviço ${data.numero_os}</h1>
        <div class="section"><strong>Equipamento:</strong> ${data.equipamento ? `${data.equipamento.nome} (${data.equipamento.codigo_interno})` : ''}</div>
        <div class="section"><strong>Tipo:</strong> ${data.tipo_manutencao ? data.tipo_manutencao.nome : data.tipo}</div>
        <div class="section"><strong>Status:</strong> ${data.status}</div>
        <div class="section"><strong>Mecânico:</strong> ${data.mecanico ? data.mecanico.nome_completo : ''}</div>
        <div class="section"><strong>Descrição:</strong> ${data.descricao_problema || ''}</div>
        <div class="signature">
            ${signature ? `<img src="${signature}" style="width:200px;height:80px;"/>` : '<div style="width:200px;height:80px;border-bottom:1px solid #000;"></div>'}
            <div>Assinatura</div>
        </div>
        <button class="no-print" onclick="window.print()">Imprimir</button>
    </body></html>`;
    win.document.write(html);
    win.document.close();
};

const loadWorkOrdersRelatedData = async () => {
    try {
        const [equipamentos, mecanicos, tipos] = await Promise.all([
            API.equipments.getAll(),
            API.mechanics.getAll(),
            API.maintenanceTypes.getAll()
        ]);

        workOrdersEquipments = equipamentos.equipamentos || equipamentos.data || equipamentos || [];
        workOrdersMechanics = mecanicos.mecanicos || mecanicos.data || mecanicos || [];
        workOrdersMaintenanceTypes = tipos.tipos_manutencao || tipos.data || tipos || [];
    } catch (error) {
        console.error("Erro ao carregar dados relacionados:", error);
        workOrdersEquipments = [];
        workOrdersMechanics = [];
        workOrdersMaintenanceTypes = [];
    }
};

const updateWorkOrdersStats = () => {
    if (!workOrdersGridApi) return;

    const rows = [];
    workOrdersGridApi.forEachNodeAfterFilter(node => rows.push(node.data));

    const stats = {
        pendentes: rows.filter(item => item.status === "aberta").length,
        execucao: rows.filter(item => item.status === "em_execucao").length,
        concluidas: rows.filter(item => item.status === "concluida").length,
        canceladas: rows.filter(item => item.status === "cancelada").length
    };

    const statElements = {
        pendentes: document.getElementById("stat-pendentes"),
        execucao: document.getElementById("stat-execucao"),
        concluidas: document.getElementById("stat-concluidas"),
        canceladas: document.getElementById("stat-canceladas")
    };

    Object.keys(statElements).forEach(key => {
        if (statElements[key]) {
            statElements[key].textContent = stats[key];
        }
    });
};

const WORK_ORDERS_GRID_INIT = () => {
    const initGrid = () => {
        const gridOptions = {
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
            floatingFilter: true,
        },
        onGridReady: async () => {
            const savedColumnPositions = JSON.parse(localStorage.getItem("workOrdersColumnPositions"));
            workOrdersInitialColumnState = workOrdersGridApi.getColumnState();

            if (savedColumnPositions) {
                try {
                    workOrdersGridApi.applyColumnState({ state: savedColumnPositions, applyOrder: true });
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
        onColumnMoved: SAVE_WORK_ORDERS_COLUMN_STATE,
        onColumnResized: SAVE_WORK_ORDERS_COLUMN_STATE,
        onColumnVisible: SAVE_WORK_ORDERS_COLUMN_STATE,
        onFilterChanged: updateWorkOrdersStats,
        getContextMenuItems(params) {
            const options = [
                {
                    name: "Editar",
                    action: () => EDIT_WORK_ORDER(params),
                    icon: /*html*/ `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    `,
                },
                {
                    name: "Excluir",
                    action: () => DELETE_WORK_ORDER(params),
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
                headerName: "OS",
                field: "numero_os",
                minWidth: 120,
                maxWidth: 150
            },
            {
                headerName: "Equipamento",
                field: "equipamento.nome",
                minWidth: 200,
                valueGetter: (params) => params.data.equipamento ? `${params.data.equipamento.nome} (${params.data.equipamento.codigo_interno})` : ''
            },
            {
                headerName: "Tipo",
                field: "tipo_manutencao.nome",
                minWidth: 150,
                valueGetter: (params) => params.data.tipo_manutencao ? params.data.tipo_manutencao.nome : ''
            },
            {
                headerName: "Prioridade",
                field: "prioridade",
                minWidth: 120,
                cellRenderer: (params) => {
                    const priorityMap = {
                        "baixa": "<span class=\"badge badge-info\">Baixa</span>",
                        "normal": "<span class=\"badge badge-secondary\">Normal</span>",
                        "alta": "<span class=\"badge badge-warning\">Alta</span>",
                        "critica": "<span class=\"badge badge-danger\">Crítica</span>"
                    };
                    return priorityMap[params.value] || params.value;
                }
            },
            {
                headerName: "Status",
                field: "status",
                minWidth: 120,
                cellRenderer: (params) => {
                    const statusMap = {
                        "aberta": "<span class=\"badge badge-info\">Aberta</span>",
                        "em_execucao": "<span class=\"badge badge-warning\">Em Execução</span>",
                        "concluida": "<span class=\"badge badge-success\">Concluída</span>",
                        "cancelada": "<span class=\"badge badge-danger\">Cancelada</span>",
                        "pausada": "<span class=\"badge badge-secondary\">Pausada</span>"
                    };
                    return statusMap[params.value] || params.value;
                }
            },
            {
                headerName: "Mecânico",
                field: "mecanico.nome_completo",
                minWidth: 150,
                valueGetter: (params) => params.data.mecanico ? params.data.mecanico.nome_completo : ''
            },
            {
                headerName: "Data Abertura",
                field: "data_abertura",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleString('pt-BR');
                }
            },
            {
                headerName: "Data Prevista",
                field: "data_prevista",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleString('pt-BR');
                }
            },
            {
                headerName: "Data Conclusão",
                field: "data_encerramento",
                minWidth: 150,
                cellRenderer: (params) => {
                    if (!params.value) return '';
                    return new Date(params.value).toLocaleString('pt-BR');
                }
            },
            {
                headerName: "Descrição do Problema",
                field: "descricao_problema",
                minWidth: 250
            },
            {
                headerName: "Ações",
                field: "acoes",
                minWidth: 150,
                maxWidth: 160,
                sortable: false,
                filter: false,
                pinned: 'right',
                cellRenderer: (params) => {
                    const container = document.createElement('div');
                    container.className = 'flex gap-1';
                    container.innerHTML = `
                        <button class="btn btn-sm btn-outline view-os" title="Visualizar">👁️</button>
                        <button class="btn btn-sm btn-outline edit-os" title="Editar">✏️</button>
                        <button class="btn btn-sm btn-outline print-os" title="Imprimir">🖨️</button>
                    `;
                    container.querySelector('.view-os').addEventListener('click', (e) => { e.stopPropagation(); VIEW_WORK_ORDER(params); });
                    container.querySelector('.edit-os').addEventListener('click', (e) => { e.stopPropagation(); EDIT_WORK_ORDER(params); });
                    container.querySelector('.print-os').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        try {
                            const data = await API.workOrders.get(params.node.data.id);
                            PRINT_WORK_ORDER(data);
                        } catch {
                            Utils.showToast('Erro ao imprimir OS', 'error');
                        }
                    });
                    return container;
                }
            }
        ],
    };

    const gridDiv = document.querySelector("#work-orders-grid");
    if (!gridDiv) {
        console.error("Grid container não encontrado");
        return;
    }

    gridDiv.innerHTML = "";
    gridDiv.style.height = "calc(75vh - 40px)";
    gridDiv.className = "ag-theme-alpine";

    workOrdersGridApi = agGrid.createGrid(gridDiv, gridOptions);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGrid);
    } else {
        initGrid();
    }
};

class WorkOrdersPage {
    constructor() {
        this.gridApi = null;
        this.data = [];
    }

    async render(container) {
        try {
            container.innerHTML = this.getHTML();
            await this.init();
        } catch (error) {
            console.error("Erro ao renderizar página de ordens de serviço:", error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async init() {
        WORK_ORDERS_GRID_INIT();
        await loadWorkOrdersRelatedData();
        await SYNC_WORK_ORDERS_GRID_DATA();
        this.setupEvents();
    }

    setupEvents() {
        const refreshBtn = document.querySelector("#refresh-work-orders");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => SYNC_WORK_ORDERS_GRID_DATA());
        }

        const createBtn = document.querySelector("#create-work-order");
        if (createBtn) {
            createBtn.addEventListener("click", () => ADD_WORK_ORDER());
        }

        const exportBtn = document.querySelector("#export-work-orders");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                if (workOrdersGridApi) {
                    workOrdersGridApi.exportDataAsCsv({
                        fileName: `ordens_servico_${new Date().toISOString().split("T")[0]}.csv`,
                        columnSeparator: ";"
                    });
                }
            });
        }
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
                        <button class="btn btn-outline" id="refresh-work-orders">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                        <button class="btn btn-outline" id="export-work-orders">
                            <i class="fas fa-download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" id="create-work-order">
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
                            <div class="stat-value" id="stat-execucao">0</div>
                            <div class="stat-label">Em Execução</div>
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

    getErrorHTML(message) {
        return `
            <div class="page-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar ordens de serviço</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="appNavigation.navigateTo(\'ordens-servico\')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// Expose the page class globally
window.WorkOrdersPage = WorkOrdersPage;


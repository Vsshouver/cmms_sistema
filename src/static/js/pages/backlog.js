class BacklogPage {
    constructor() {
        this.gridApi = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="page-header flex justify-between items-center mb-4">
                <h1 class="text-2xl font-semibold">Backlog</h1>
                <div class="space-x-2">
                    <button id="new-backlog" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Novo Item</button>
                    <button id="export-backlog" class="bg-gray-200 px-4 py-2 rounded">Exportar CSV</button>
                </div>
            </div>
            <div id="backlog-grid" class="ag-theme-alpine w-full" style="height:600px;"></div>
        `;

        await this.initGrid();

        document.getElementById('new-backlog')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('export-backlog')?.addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.exportDataAsCsv();
            }
        });
    }

    async initGrid() {
        try {
            const response = await API.backlog.getAll();
            const rowData = response.backlog_items || response.data || [];

            const gridOptions = {
                columnDefs: [
                    { headerName: 'Título', field: 'titulo' },
                    { headerName: 'Categoria', field: 'categoria_display' },
                    { headerName: 'Status', field: 'status_display' },
                    { headerName: 'Prioridade', field: 'prioridade_display' },
                    { headerName: 'Responsável', field: 'responsavel' }
                ],
                rowData,
                pagination: true,
                sideBar: true,
                defaultColDef: {
                    resizable: true,
                    sortable: true,
                    filter: true
                },
                onGridReady: params => {
                    this.gridApi = params.api;
                }
            };

            agGrid.createGrid(document.getElementById('backlog-grid'), gridOptions);
        } catch (error) {
            console.error('Erro ao carregar backlog:', error);
        }
    }

    openCreateModal() {
        const content = `
            <h3 class="text-lg font-semibold mb-2">📋 Dados Gerais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Título</label>
                    <input id="backlog-titulo" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Categoria</label>
                    <input id="backlog-categoria" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Status</label>
                    <input id="backlog-status" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Prioridade</label>
                    <input id="backlog-prioridade" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Equipamento</label>
                    <select id="backlog-equipamento" class="border p-2 w-full"></select>
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">💡 Observações</h3>
            <textarea id="backlog-observacoes" class="border p-2 w-full"></textarea>
        `;

        openStandardModal({
            title: 'Novo Item de Backlog',
            content,
            onSave: async () => {
                const data = {
                    titulo: document.getElementById('backlog-titulo').value,
                    categoria: document.getElementById('backlog-categoria').value,
                    status: document.getElementById('backlog-status').value,
                    prioridade: document.getElementById('backlog-prioridade').value,
                    equipamento_id: document.getElementById('backlog-equipamento').value || null,
                    observacoes: document.getElementById('backlog-observacoes').value
                };

                try {
                    await API.backlog.create(data);
                    if (this.gridApi) {
                        const updated = await API.backlog.getAll();
                        this.gridApi.setGridOption('rowData', updated.backlog_items || updated.data || []);
                    }
                    Toast.success('Item criado com sucesso');
                } catch (error) {
                    console.error('Erro ao criar item:', error);
                    Toast.error('Erro ao salvar item');
                }
            }
        });

        // Carregar equipamentos
        API.equipamentos.getAll().then(response => {
            const equipamentos = response.equipamentos || response.data || [];
            const select = document.getElementById('backlog-equipamento');
            if (select) {
                select.innerHTML = '<option value="">Selecione</option>' +
                    equipamentos.map(eq => `<option value="${eq.id}">${eq.nome} (${eq.codigo_interno})</option>`).join('');
            }
        }).catch(error => {
            console.error('Erro ao carregar equipamentos:', error);
        });
    }
}

window.BacklogPage = BacklogPage;


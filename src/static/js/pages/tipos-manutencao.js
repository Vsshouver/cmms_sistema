class MaintenanceTypesPage {
    constructor() {
        this.gridApi = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="page-header flex justify-between items-center mb-4">
                <h1 class="text-2xl font-semibold">Tipos de Manutenção</h1>
                <div class="space-x-2">
                    <button id="new-type" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Novo Tipo</button>
                    <button id="export-types" class="bg-gray-200 px-4 py-2 rounded">Exportar CSV</button>
                </div>
            </div>
            <div id="types-grid" class="ag-theme-alpine w-full" style="height:600px;"></div>
        `;

        await this.initGrid();

        document.getElementById('new-type')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('export-types')?.addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.exportDataAsCsv();
            }
        });
    }

    async initGrid() {
        try {
            const response = await API.maintenanceTypes.getAll();
            const rowData = response.tipos_manutencao || response.data || [];

            const gridOptions = {
                columnDefs: [
                    { headerName: 'Código', field: 'codigo' },
                    { headerName: 'Nome', field: 'nome' },
                    { headerName: 'Descrição', field: 'descricao' },
                    { headerName: 'Cor', field: 'cor_identificacao' },
                    { headerName: 'Ativo', field: 'ativo' }
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

            agGrid.createGrid(document.getElementById('types-grid'), gridOptions);
        } catch (error) {
            console.error('Erro ao carregar tipos de manutenção:', error);
        }
    }

    openCreateModal() {
        const content = `
            <h3 class="text-lg font-semibold mb-2">📋 Dados Gerais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Código</label>
                    <input id="type-codigo" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Nome</label>
                    <input id="type-nome" type="text" class="border p-2 w-full" />
                </div>
                <div class="md:col-span-2">
                    <label>Descrição</label>
                    <textarea id="type-descricao" class="border p-2 w-full"></textarea>
                </div>
                <div>
                    <label>Cor</label>
                    <input id="type-cor" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Ativo</label>
                    <input id="type-ativo" type="checkbox" />
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">💡 Observações</h3>
            <textarea id="type-observacoes" class="border p-2 w-full"></textarea>
        `;

        openStandardModal({
            title: 'Novo Tipo de Manutenção',
            content,
            onSave: async () => {
                const data = {
                    codigo: document.getElementById('type-codigo').value,
                    nome: document.getElementById('type-nome').value,
                    descricao: document.getElementById('type-descricao').value,
                    cor_identificacao: document.getElementById('type-cor').value,
                    ativo: document.getElementById('type-ativo').checked,
                    observacoes: document.getElementById('type-observacoes').value
                };

                try {
                    await API.maintenanceTypes.create(data);
                    if (this.gridApi) {
                        const updated = await API.maintenanceTypes.getAll();
                        this.gridApi.setGridOption('rowData', updated.tipos_manutencao || updated.data || []);
                    }
                    Toast.success('Tipo criado com sucesso');
                } catch (error) {
                    console.error('Erro ao criar tipo:', error);
                    Toast.error('Erro ao salvar tipo');
                }
            }
        });
    }
}

window.MaintenanceTypesPage = MaintenanceTypesPage;


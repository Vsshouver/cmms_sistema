class OilAnalysisPage {
    constructor() {
        this.gridApi = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="page-header flex justify-between items-center mb-4">
                <h1 class="text-2xl font-semibold">Análise de Óleo</h1>
                <div class="space-x-2">
                    <button id="new-analysis" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Nova Análise</button>
                    <button id="export-analises" class="bg-gray-200 px-4 py-2 rounded">Exportar CSV</button>
                </div>
            </div>
            <div id="oil-grid" class="ag-theme-alpine w-full" style="height:600px;"></div>
        `;

        await this.initGrid();

        document.getElementById('new-analysis')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('export-analises')?.addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.exportDataAsCsv();
            }
        });
    }

    async initGrid() {
        try {
            const response = await API.oilAnalysis.getAll();
            const rowData = response.analises || response.data || [];

            const gridOptions = {
                columnDefs: [
                    { headerName: 'Amostra', field: 'numero_amostra' },
                    { headerName: 'Equipamento', field: 'equipamento_nome' },
                    { headerName: 'Data Coleta', field: 'data_coleta' },
                    { headerName: 'Status', field: 'status' },
                    { headerName: 'Resultado', field: 'resultado' }
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

            agGrid.createGrid(document.getElementById('oil-grid'), gridOptions);
        } catch (error) {
            console.error('Erro ao carregar análises de óleo:', error);
        }
    }

    async openCreateModal() {
        let equipmentOptions = '';
        try {
            const response = await API.equipments.getAll();
            const equipments = response.equipamentos || response.data || [];
            equipmentOptions = equipments
                .map(eq => `<option value="${eq.id}">${eq.nome}</option>`)
                .join('');
        } catch (error) {
            console.error('Erro ao carregar equipamentos:', error);
        }

        const content = `
            <h3 class="text-lg font-semibold mb-2">📋 Dados Gerais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Número da Amostra</label>
                    <input id="oil-amostra" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Equipamento</label>
                    <select id="oil-equipamento" class="border p-2 w-full">
                        <option value="">Selecione...</option>
                        ${equipmentOptions}
                    </select>
                </div>
                <div>
                    <label>Data Coleta</label>
                    <input id="oil-data" type="date" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Status</label>
                    <input id="oil-status" type="text" class="border p-2 w-full" />
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">💡 Observações</h3>
            <textarea id="oil-observacoes" class="border p-2 w-full"></textarea>
        `;

        openStandardModal({
            title: 'Nova Análise de Óleo',
            content,
            onSave: async () => {
                const data = {
                    numero_amostra: document.getElementById('oil-amostra').value,
                    equipamento_id: document.getElementById('oil-equipamento').value,
                    data_coleta: document.getElementById('oil-data').value,
                    status: document.getElementById('oil-status').value,
                    observacoes: document.getElementById('oil-observacoes').value
                };

                try {
                    await API.oilAnalysis.create(data);
                    if (this.gridApi) {
                        const updated = await API.oilAnalysis.getAll();
                        this.gridApi.setGridOption('rowData', updated.analises || updated.data || []);
                    }
                    Toast.success('Análise criada com sucesso');
                } catch (error) {
                    console.error('Erro ao criar análise:', error);
                    Toast.error('Erro ao salvar análise');
                }
            }
        });
    }
}

window.OilAnalysisPage = OilAnalysisPage;


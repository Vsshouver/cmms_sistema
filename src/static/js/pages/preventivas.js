class PreventivasPage {
    constructor() {
        this.gridApi = null;
    }

    async render(container) {
        container.innerHTML = `
            <div class="page-header flex justify-between items-center mb-4">
                <h1 class="text-2xl font-semibold">Planos de Preventiva</h1>
                <div class="space-x-2">
                    <button id="new-plan" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Novo Plano</button>
                    <button id="export-planos" class="bg-gray-200 px-4 py-2 rounded">Exportar CSV</button>
                </div>
            </div>
            <div id="preventivas-grid" class="ag-theme-alpine w-full" style="height:600px;"></div>
        `;

        await this.initGrid();

        document.getElementById('new-plan')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('export-planos')?.addEventListener('click', () => {
            if (this.gridApi) {
                this.gridApi.exportDataAsCsv();
            }
        });
    }

    async initGrid() {
        try {
            const response = await API.preventivePlans.getAll();
            const rowData = response.planos_preventiva || response.data || [];

            const gridOptions = {
                columnDefs: [
                    { headerName: 'Nome', field: 'nome' },
                    { headerName: 'Equipamento', field: 'equipamento_nome' },
                    { headerName: 'Tipo', field: 'tipo_manutencao_nome' },
                    { headerName: 'Prioridade', field: 'prioridade' },
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

            agGrid.createGrid(document.getElementById('preventivas-grid'), gridOptions);
        } catch (error) {
            console.error('Erro ao inicializar grid de preventivas:', error);
        }
    }

    async openCreateModal() {
        try {
            const [equipamentos, tipos] = await Promise.all([
                API.equipments.getAll(),
                API.maintenanceTypes.getAll()
            ]);

            const equipamentosOptions = (equipamentos.equipamentos || equipamentos.data || [])
                .map(eq => `<option value="${eq.id}">${eq.nome}</option>`) 
                .join('');
            const tiposOptions = (tipos.tipos_manutencao || tipos.data || [])
                .map(tp => `<option value="${tp.id}">${tp.nome}</option>`) 
                .join('');

            const content = `
            <h3 class="text-lg font-semibold mb-2">📋 Dados Gerais</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Nome</label>
                    <input id="plan-nome" type="text" class="border p-2 w-full" />
                </div>
                <div>
                    <label>Equipamento</label>
                    <select id="plan-equipamento" class="border p-2 w-full">
                        ${equipamentosOptions}
                    </select>
                </div>
                <div>
                    <label>Tipo de Manutenção</label>
                    <select id="plan-tipo" class="border p-2 w-full">
                        ${tiposOptions}
                    </select>
                </div>
                <div>
                    <label>Prioridade</label>
                    <input id="plan-prioridade" type="text" class="border p-2 w-full" />
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">⚙️ Configurações</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label>Descrição</label>
                    <textarea id="plan-descricao" class="border p-2 w-full"></textarea>
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">📅 Intervalos</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Intervalo (dias)</label>
                    <input id="plan-intervalo" type="number" class="border p-2 w-full" />
                </div>
            </div>
            <h3 class="text-lg font-semibold mb-2 mt-4">💡 Observações</h3>
            <textarea id="plan-observacoes" class="border p-2 w-full"></textarea>
        `;

            openStandardModal({
                title: 'Novo Plano de Preventiva',
                content,
                onSave: async () => {
                    const data = {
                        nome: document.getElementById('plan-nome').value,
                        equipamento_id: document.getElementById('plan-equipamento').value,
                        tipo_manutencao_id: document.getElementById('plan-tipo').value,
                        prioridade: document.getElementById('plan-prioridade').value,
                        descricao: document.getElementById('plan-descricao').value,
                        intervalo_dias: document.getElementById('plan-intervalo').value,
                        observacoes: document.getElementById('plan-observacoes').value
                    };

                    try {
                        await API.preventivePlans.create(data);
                        if (this.gridApi) {
                            const updated = await API.preventivePlans.getAll();
                            this.gridApi.setGridOption('rowData', updated.planos_preventiva || updated.data || []);
                        }
                        Toast.success('Plano criado com sucesso');
                    } catch (error) {
                        console.error('Erro ao criar plano:', error);
                        Toast.error('Erro ao salvar plano');
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao carregar dados para modal:', error);
            Toast.error('Erro ao carregar dados');
        }
    }
}

window.PreventivasPage = PreventivasPage;


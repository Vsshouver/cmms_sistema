class PreventivasPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.currentSort = 'nome';
        this.currentOrder = 'asc';
        this.filters = {
            equipamento: '',
            ativo: '',
            deve_gerar: '',
            search: ''
        };
    }
    async render(container) {
        try {
            await this.loadData();
            container.innerHTML = this.getHTML();
            this.setupEventListeners();
            this.applyFilters();
            window.preventivas = this;
        } catch (error) {
            console.error('Erro ao carregar página de preventivas:', error);
            container.innerHTML = '<div class="page-error">Erro ao carregar dados</div>';
        }
    }

    getHTML() {
        return `
            <div class="preventivas-page">
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-calendar-alt"></i>
                        <div>
                            <h1>Planos de Preventiva</h1>
                            <p>Gerencie os planos de manutenção preventiva</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" id="new-plan-btn">
                            <i class="fas fa-plus"></i> Novo Plano
                        </button>
                        <button class="btn btn-secondary" id="generate-os-btn">
                            <i class="fas fa-cogs"></i> Gerar OS Pendentes
                        </button>
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i> Atualizar
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon active">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-ativos">0</div>
                            <div class="stat-label">Ativos</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-pendentes">0</div>
                            <div class="stat-label">Pendentes</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon inactive">
                            <i class="fas fa-pause-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-inativos">0</div>
                            <div class="stat-label">Inativos</div>
                        </div>
                    </div>
                </div>

                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="filter-equipamento">Equipamento</label>
                            <select id="filter-equipamento">
                                <option value="">Todos os equipamentos</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-ativo">Status</label>
                            <select id="filter-ativo">
                                <option value="">Todos</option>
                                <option value="true">Ativo</option>
                                <option value="false">Inativo</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-deve-gerar">Situação</label>
                            <select id="filter-deve-gerar">
                                <option value="">Todos</option>
                                <option value="true">Pendente</option>
                                <option value="false">Em dia</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="search-input">Buscar</label>
                            <input type="text" id="search-input" placeholder="Nome, descrição...">
                        </div>
                        <div class="filter-group">
                            <button class="btn btn-outline" id="clear-filters">
                                <i class="fas fa-times"></i> Limpar
                            </button>
                        </div>
                    </div>
                </div>

                <div class="content-controls">
                    <div class="controls-left">
                        <select id="items-per-page">
                            <option value="15">15 por página</option>
                            <option value="30">30 por página</option>
                            <option value="50">50 por página</option>
                        </select>
                    </div>
                    <div class="controls-right">
                        <label for="sort-by">Ordenar por:</label>
                        <select id="sort-by">
                            <option value="nome-asc">Nome (A-Z)</option>
                            <option value="nome-desc">Nome (Z-A)</option>
                            <option value="equipamento_nome-asc">Equipamento (A-Z)</option>
                            <option value="prioridade-desc">Prioridade</option>
                            <option value="created_at-desc">Mais recentes</option>
                            <option value="created_at-asc">Mais antigos</option>
                        </select>
                    </div>
                </div>

                <div class="plans-container" id="plans-container"></div>
                <div class="pagination" id="pagination"></div>
            </div>
        `;
    }

    async loadData() {
        try {
            const [planosResp, equipamentosResp, tiposResp] = await Promise.all([
                API.preventivePlans.getAll(),
                API.equipments.getAll(),
                API.maintenanceTypes.getAll()
            ]);
            
            this.data = planosResp.planos_preventiva || planosResp.data || planosResp || [];
            this.equipamentos = equipamentosResp.equipamentos || equipamentosResp.data || equipamentosResp || [];
            this.tiposManutencao = tiposResp.tipos_manutencao || tiposResp.data || tiposResp || [];
            
            this.updateEquipmentFilter();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('filter-equipamento')?.addEventListener('change', (e) => {
            this.filters.equipamento = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-ativo')?.addEventListener('change', (e) => {
            this.filters.ativo = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-deve-gerar')?.addEventListener('change', (e) => {
            this.filters.deve_gerar = e.target.value;
            this.applyFilters();
        });

        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });

        // Botões
        document.getElementById('refresh-data')?.addEventListener('click', () => this.refresh());
        document.getElementById('new-plan-btn')?.addEventListener('click', () => this.showCreateModal());
        document.getElementById('generate-os-btn')?.addEventListener('click', () => this.generatePendingOS());
        document.getElementById('clear-filters')?.addEventListener('click', () => this.clearFilters());

        // Paginação
        document.getElementById('items-per-page')?.addEventListener('change', (e) => {
            this.itemsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.updateContent();
        });

        // Ordenação
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            const [field, order] = e.target.value.split('-');
            this.currentSort = field;
            this.currentOrder = order;
            this.applyFilters();
        });
    }

    updateEquipmentFilter() {
        const select = document.getElementById('filter-equipamento');
        if (!select) return;

        select.innerHTML = '<option value="">Todos os equipamentos</option>';
        this.equipamentos.forEach(eq => {
            const option = document.createElement('option');
            option.value = eq.id;
            option.textContent = `${eq.codigo_interno} - ${eq.nome}`;
            select.appendChild(option);
        });
    }

    applyFilters() {
        this.filteredData = this.data.filter(plano => {
            if (this.filters.equipamento && plano.equipamento_id != this.filters.equipamento) return false;
            if (this.filters.ativo && plano.ativo.toString() !== this.filters.ativo) return false;
            if (this.filters.deve_gerar && plano.deve_gerar_os.toString() !== this.filters.deve_gerar) return false;
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return plano.nome.toLowerCase().includes(search) ||
                       (plano.descricao && plano.descricao.toLowerCase().includes(search)) ||
                       (plano.equipamento_nome && plano.equipamento_nome.toLowerCase().includes(search));
            }
            return true;
        });

        this.sortData();
        this.currentPage = 1;
        this.updateContent();
        this.updateStats();
    }

    sortData() {
        this.filteredData.sort((a, b) => {
            let aVal = a[this.currentSort];
            let bVal = b[this.currentSort];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (this.currentOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    updateContent() {
        const container = document.getElementById('plans-container');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>Nenhum plano encontrado</h3>
                    <p>Não há planos de preventiva que correspondam aos filtros aplicados.</p>
                </div>
            `;
            this.updatePagination();
            return;
        }

        container.innerHTML = pageData.map(plano => this.createPlanCard(plano)).join('');
        this.updatePagination();
    }

    createPlanCard(plano) {
        const statusClass = plano.ativo ? 'ativo' : 'inativo';
        const statusText = plano.ativo ? 'Ativo' : 'Inativo';
        const alertClass = plano.deve_gerar_os ? 'alert' : '';
        
        return `
            <div class="plan-card ${statusClass} ${alertClass}" data-id="${plano.id}">
                <div class="plan-header">
                    <h3>${plano.nome}</h3>
                    <div class="plan-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        ${plano.deve_gerar_os ? '<span class="alert-badge">Pendente</span>' : ''}
                    </div>
                </div>
                
                <div class="plan-info">
                    <div class="info-row">
                        <span class="label">Equipamento:</span>
                        <span class="value">${plano.equipamento_nome || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Tipo:</span>
                        <span class="value">${plano.tipo_manutencao_nome || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Prioridade:</span>
                        <span class="value priority-${plano.prioridade}">${this.formatPriority(plano.prioridade)}</span>
                    </div>
                </div>

                <div class="plan-intervals">
                    ${plano.intervalo_dias ? `<div class="interval"><i class="fas fa-calendar"></i> ${plano.intervalo_dias} dias</div>` : ''}
                    ${plano.intervalo_horas ? `<div class="interval"><i class="fas fa-clock"></i> ${plano.intervalo_horas}h</div>` : ''}
                    ${plano.intervalo_km ? `<div class="interval"><i class="fas fa-road"></i> ${plano.intervalo_km} km</div>` : ''}
                </div>

                <div class="plan-next">
                    <div class="next-execution">
                        <span class="label">Próxima execução:</span>
                        ${this.formatNextExecution(plano)}
                    </div>
                </div>

                <div class="plan-actions">
                    <button class="btn-icon" onclick="preventivas.viewPlan(${plano.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="preventivas.editPlan(${plano.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="preventivas.executePlan(${plano.id})" title="Executar">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon danger" onclick="preventivas.deletePlan(${plano.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    formatPriority(priority) {
        const priorities = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'critica': 'Crítica'
        };
        return priorities[priority] || priority;
    }

    formatNextExecution(plano) {
        const parts = [];
        
        if (plano.proxima_execucao_data) {
            const date = new Date(plano.proxima_execucao_data);
            parts.push(`${date.toLocaleDateString('pt-BR')}`);
        }
        
        if (plano.proxima_execucao_horimetro) {
            parts.push(`${plano.proxima_execucao_horimetro}h`);
        }
        
        if (plano.proxima_execucao_km) {
            parts.push(`${plano.proxima_execucao_km} km`);
        }
        
        return parts.length > 0 ? parts.join(' | ') : 'Não definida';
    }

    updateStats() {
        const stats = {
            total: this.data.length,
            ativos: this.data.filter(p => p.ativo).length,
            pendentes: this.data.filter(p => p.deve_gerar_os).length,
            inativos: this.data.filter(p => !p.ativo).length
        };

        const totalEl = document.querySelector('#stat-total');
        if (totalEl) totalEl.textContent = stats.total;

        const ativosEl = document.querySelector('#stat-ativos');
        if (ativosEl) ativosEl.textContent = stats.ativos;

        const pendentesEl = document.querySelector('#stat-pendentes');
        if (pendentesEl) pendentesEl.textContent = stats.pendentes;

        const inativosEl = document.querySelector('#stat-inativos');
        if (inativosEl) inativosEl.textContent = stats.inativos;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Botão anterior
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="preventivas.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="active">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="preventivas.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="preventivas.goToPage(${this.currentPage + 1})">Próximo</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateContent();
        }
    }

    clearFilters() {
        this.filters = {
            equipamento: '',
            ativo: '',
            deve_gerar: '',
            search: ''
        };

        document.getElementById('filter-equipamento').value = '';
        document.getElementById('filter-ativo').value = '';
        document.getElementById('filter-deve-gerar').value = '';
        document.getElementById('search-input').value = '';

        this.applyFilters();
    }

    async refresh() {
        try {
            const refreshBtn = document.querySelector('#refresh-data');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                refreshBtn.disabled = true;
            }

            await this.loadData();
            this.applyFilters();
            Toast.success('Dados atualizados');

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            Toast.error('Erro ao atualizar dados');
        } finally {
            const refreshBtn = document.querySelector('#refresh-data');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
                refreshBtn.disabled = false;
            }
        }
    }

    async showCreateModal() {
        try {
            const overlay = document.createElement('div');
            overlay.className = 'custom-modal-overlay';
            const modal = document.createElement('div');
            modal.className = 'custom-modal large';
            modal.innerHTML = `
                <h2>Novo Plano de Preventiva</h2>
                <form id="planForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="plan-nome">Nome*</label>
                            <input type="text" id="plan-nome" name="nome" required />
                        </div>

                        <div class="form-group">
                            <label for="plan-equipamento">Equipamento*</label>
                            <select id="plan-equipamento" name="equipamento_id" required>
                                <option value="">Selecione...</option>
                                ${this.equipamentos.map(eq => `<option value="${eq.id}">${eq.codigo_interno} - ${eq.nome}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="plan-tipo">Tipo de Manutenção*</label>
                            <select id="plan-tipo" name="tipo_manutencao_id" required>
                                <option value="">Selecione...</option>
                                ${this.tiposManutencao.map(tipo => `<option value="${tipo.id}">${tipo.nome}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="plan-prioridade">Prioridade</label>
                            <select id="plan-prioridade" name="prioridade">
                                <option value="baixa">Baixa</option>
                                <option value="media" selected>Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="plan-descricao">Descrição</label>
                        <textarea id="plan-descricao" name="descricao" rows="3"></textarea>
                    </div>

                    <h3>Critérios de Execução</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="plan-intervalo-dias">Intervalo em Dias</label>
                            <input type="number" id="plan-intervalo-dias" name="intervalo_dias" min="1" />
                        </div>

                        <div class="form-group">
                            <label for="plan-intervalo-horas">Intervalo em Horas</label>
                            <input type="number" id="plan-intervalo-horas" name="intervalo_horas" min="1" />
                        </div>

                        <div class="form-group">
                            <label for="plan-intervalo-km">Intervalo em KM</label>
                            <input type="number" id="plan-intervalo-km" name="intervalo_km" min="1" step="0.1" />
                        </div>

                        <div class="form-group">
                            <label for="plan-antecedencia">Antecedência (dias)</label>
                            <input type="number" id="plan-antecedencia" name="antecedencia_dias" value="7" min="0" />
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" onclick="this.closest('.custom-modal-overlay').remove()">Cancelar</button>
                        <button type="submit">Criar Plano</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listener para o formulário
            document.getElementById('planForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createPlan(new FormData(e.target));
                overlay.remove();
            });

        } catch (error) {
            console.error('Erro ao exibir modal de criação:', error);
            Toast.error('Erro ao preparar modal');
        }
    }

    async createPlan(formData) {
        try {
            const data = Object.fromEntries(formData);
            
            // Validar se pelo menos um critério foi definido
            if (!data.intervalo_dias && !data.intervalo_horas && !data.intervalo_km) {
                Toast.error('Defina pelo menos um critério de intervalo');
                return;
            }

            // Converter valores numéricos
            ['equipamento_id', 'tipo_manutencao_id', 'intervalo_dias', 'intervalo_horas', 'intervalo_km', 'antecedencia_dias'].forEach(field => {
                if (data[field]) {
                    data[field] = parseFloat(data[field]);
                }
            });

            await API.preventivePlans.create(data);
            Toast.success('Plano criado com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao criar plano:', error);
            Toast.error('Erro ao criar plano');
        }
    }

    async generatePendingOS() {
        try {
            if (!confirm('Deseja gerar ordens de serviço para todos os planos pendentes?')) {
                return;
            }

            const result = await API.preventivePlans.generatePendingOS();
            Toast.success(result.message);
            await this.refresh();

        } catch (error) {
            console.error('Erro ao gerar OS pendentes:', error);
            Toast.error('Erro ao gerar ordens de serviço');
        }
    }

    async viewPlan(id) {
        try {
            const plano = await API.preventivePlans.get(id);
            // Implementar modal de visualização
            console.log('Visualizar plano:', plano);
        } catch (error) {
            console.error('Erro ao visualizar plano:', error);
            Toast.error('Erro ao carregar plano');
        }
    }

    async editPlan(id) {
        try {
            const plano = await API.preventivePlans.get(id);
            // Implementar modal de edição
            console.log('Editar plano:', plano);
        } catch (error) {
            console.error('Erro ao carregar plano para edição:', error);
            Toast.error('Erro ao carregar plano');
        }
    }

    async executePlan(id) {
        try {
            if (!confirm('Deseja marcar este plano como executado e gerar uma nova OS?')) {
                return;
            }

            await API.preventivePlans.execute(id);
            Toast.success('Plano executado com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao executar plano:', error);
            Toast.error('Erro ao executar plano');
        }
    }

    async deletePlan(id) {
        try {
            if (!confirm('Deseja realmente excluir este plano de preventiva?')) {
                return;
            }

            await API.preventivePlans.delete(id);
            Toast.success('Plano excluído com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao excluir plano:', error);
            Toast.error('Erro ao excluir plano');
        }
    }
}

// Exportar a classe para uso global
window.PreventivasPage = PreventivasPage;


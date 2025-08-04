class BacklogPage {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentSort = 'score_priorizacao';
        this.currentOrder = 'desc';
        this.filters = {
            categoria: '',
            status: '',
            prioridade: '',
            responsavel: '',
            equipamento: '',
            search: ''
        };
        this.stats = {};
    }
    async render(container) {
        try {
            await this.loadData();
            await this.loadStats();
            container.innerHTML = this.getHTML();
            this.setupEventListeners();
            this.applyFilters();
            window.backlog = this;
        } catch (error) {
            console.error('Erro ao carregar página de backlog:', error);
            container.innerHTML = '<div class="page-error">Erro ao carregar dados</div>';
        }
    }

    getHTML() {
        return `
            <div class="backlog-page">
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-tasks"></i>
                        <div>
                            <h1>Backlog</h1>
                            <p>Controle de pendências de manutenção</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-primary" id="new-item-btn">
                            <i class="fas fa-plus"></i> Novo Item
                        </button>
                        <button class="btn btn-secondary" id="recalc-priority-btn">
                            <i class="fas fa-calculator"></i> Recalcular Priorização
                        </button>
                        <button class="btn btn-outline" id="refresh-data">
                            <i class="fas fa-sync-alt"></i> Atualizar
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-total">0</div>
                            <div class="stat-label">Total</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon critical">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-criticos">0</div>
                            <div class="stat-label">Críticos</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-atrasados">0</div>
                            <div class="stat-label">Atrasados</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon info">
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-esforco">0h</div>
                            <div class="stat-label">Esforço Est.</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-number" id="stat-custo">R$ 0</div>
                            <div class="stat-label">Custo Est.</div>
                        </div>
                    </div>
                </div>

                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="filter-categoria">Categoria</label>
                            <select id="filter-categoria">
                                <option value="">Todas</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="melhoria">Melhoria</option>
                                <option value="projeto">Projeto</option>
                                <option value="emergencia">Emergência</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-status">Status</label>
                            <select id="filter-status">
                                <option value="">Todos</option>
                                <option value="identificado">Identificado</option>
                                <option value="analisado">Analisado</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="em_execucao">Em Execução</option>
                                <option value="concluido">Concluído</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-prioridade">Prioridade</label>
                            <select id="filter-prioridade">
                                <option value="">Todas</option>
                                <option value="baixa">Baixa</option>
                                <option value="media">Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="filter-responsavel">Responsável</label>
                            <input type="text" id="filter-responsavel" placeholder="Nome do responsável">
                        </div>
                        <div class="filter-group">
                            <label for="filter-equipamento">Equipamento</label>
                            <select id="filter-equipamento">
                                <option value="">Todos os equipamentos</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="search-input">Buscar</label>
                            <input type="text" id="search-input" placeholder="Título, descrição...">
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
                            <option value="20">20 por página</option>
                            <option value="50">50 por página</option>
                            <option value="100">100 por página</option>
                        </select>
                    </div>
                    <div class="controls-right">
                        <label for="sort-by">Ordenar por:</label>
                        <select id="sort-by">
                            <option value="score_priorizacao-desc">Score (Maior)</option>
                            <option value="score_priorizacao-asc">Score (Menor)</option>
                            <option value="titulo-asc">Título (A-Z)</option>
                            <option value="titulo-desc">Título (Z-A)</option>
                            <option value="data_identificacao-desc">Mais recentes</option>
                            <option value="data_identificacao-asc">Mais antigos</option>
                            <option value="data_prevista-asc">Data prevista</option>
                        </select>
                    </div>
                </div>

                <div class="backlog-container" id="backlog-container"></div>
                <div class="pagination" id="pagination"></div>
            </div>
        `;
    }

    async loadData() {
        try {
            const [backlogResp, equipamentosResp] = await Promise.all([
                API.backlog.getAll(),
                API.equipments.getAll()
            ]);
            
            this.data = backlogResp.backlog_items || backlogResp.data || backlogResp || [];
            this.equipamentos = equipamentosResp.equipamentos || equipamentosResp.data || equipamentosResp || [];
            
            this.updateEquipmentFilter();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            throw error;
        }
    }

    async loadStats() {
        try {
            const statsResp = await API.backlog.getStats();
            this.stats = statsResp;
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('filter-categoria')?.addEventListener('change', (e) => {
            this.filters.categoria = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-prioridade')?.addEventListener('change', (e) => {
            this.filters.prioridade = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-responsavel')?.addEventListener('input', (e) => {
            this.filters.responsavel = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-equipamento')?.addEventListener('change', (e) => {
            this.filters.equipamento = e.target.value;
            this.applyFilters();
        });

        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });

        // Botões
        document.getElementById('refresh-data')?.addEventListener('click', () => this.refresh());
        document.getElementById('new-item-btn')?.addEventListener('click', () => this.showCreateModal());
        document.getElementById('recalc-priority-btn')?.addEventListener('click', () => this.recalcularPriorizacao());
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

    updateStatsDisplay() {
        const totalEl = document.querySelector('#stat-total');
        if (totalEl) totalEl.textContent = this.stats.total || 0;

        const criticosEl = document.querySelector('#stat-criticos');
        if (criticosEl) criticosEl.textContent = this.stats.criticos || 0;

        const atrasadosEl = document.querySelector('#stat-atrasados');
        if (atrasadosEl) atrasadosEl.textContent = this.stats.atrasados || 0;

        const esforcoEl = document.querySelector('#stat-esforco');
        if (esforcoEl) esforcoEl.textContent = `${this.stats.esforco_total_estimado || 0}h`;

        const custoEl = document.querySelector('#stat-custo');
        if (custoEl) custoEl.textContent = Utils.formatCurrency(this.stats.custo_total_estimado || 0);
    }

    applyFilters() {
        this.filteredData = this.data.filter(item => {
            if (this.filters.categoria && item.categoria !== this.filters.categoria) return false;
            if (this.filters.status && item.status !== this.filters.status) return false;
            if (this.filters.prioridade && item.prioridade !== this.filters.prioridade) return false;
            if (this.filters.responsavel && (!item.responsavel || !item.responsavel.toLowerCase().includes(this.filters.responsavel.toLowerCase()))) return false;
            if (this.filters.equipamento && item.equipamento_id != this.filters.equipamento) return false;
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return item.titulo.toLowerCase().includes(search) ||
                       (item.descricao && item.descricao.toLowerCase().includes(search)) ||
                       (item.observacoes && item.observacoes.toLowerCase().includes(search));
            }
            return true;
        });

        this.sortData();
        this.currentPage = 1;
        this.updateContent();
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
        const container = document.getElementById('backlog-container');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-tasks"></i>
                    <h3>Nenhum item encontrado</h3>
                    <p>Não há itens de backlog que correspondam aos filtros aplicados.</p>
                </div>
            `;
            this.updatePagination();
            return;
        }

        container.innerHTML = pageData.map(item => this.createItemCard(item)).join('');
        this.updatePagination();
    }

    createItemCard(item) {
        const statusClass = this.getStatusClass(item.status);
        const priorityClass = this.getPriorityClass(item.prioridade);
        const isOverdue = item.data_prevista && new Date(item.data_prevista) < new Date() && !['concluido', 'cancelado'].includes(item.status);
        
        return `
            <div class="backlog-card ${statusClass} ${isOverdue ? 'overdue' : ''}" data-id="${item.id}">
                <div class="card-header">
                    <div class="card-title">
                        <h3>${item.titulo}</h3>
                        <div class="card-badges">
                            <span class="badge category-${item.categoria}">${item.categoria_display}</span>
                            <span class="badge priority-${item.prioridade}">${item.prioridade_display}</span>
                            <span class="badge status-${item.status}">${item.status_display}</span>
                            ${isOverdue ? '<span class="badge overdue">Atrasado</span>' : ''}
                        </div>
                    </div>
                    <div class="card-score">
                        <span class="score-label">Score</span>
                        <span class="score-value">${item.score_priorizacao}</span>
                    </div>
                </div>

                <div class="card-content">
                    ${item.descricao ? `<p class="description">${item.descricao}</p>` : ''}
                    
                    <div class="item-details">
                        <div class="detail-row">
                            <span class="label">Tipo:</span>
                            <span class="value">${item.tipo}</span>
                        </div>
                        ${item.equipamento_nome ? `
                            <div class="detail-row">
                                <span class="label">Equipamento:</span>
                                <span class="value">${item.equipamento_nome}</span>
                            </div>
                        ` : ''}
                        ${item.responsavel ? `
                            <div class="detail-row">
                                <span class="label">Responsável:</span>
                                <span class="value">${item.responsavel}</span>
                            </div>
                        ` : ''}
                        ${item.esforco_estimado ? `
                            <div class="detail-row">
                                <span class="label">Esforço:</span>
                                <span class="value">${item.esforco_estimado}h</span>
                            </div>
                        ` : ''}
                        ${item.custo_estimado ? `
                            <div class="detail-row">
                                <span class="label">Custo:</span>
                                <span class="value">${Utils.formatCurrency(item.custo_estimado)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="item-dates">
                        <div class="date-info">
                            <span class="label">Identificado:</span>
                            <span class="value">${new Date(item.data_identificacao).toLocaleDateString('pt-BR')}</span>
                        </div>
                        ${item.data_prevista ? `
                            <div class="date-info">
                                <span class="label">Previsto:</span>
                                <span class="value">${new Date(item.data_prevista).toLocaleDateString('pt-BR')}</span>
                            </div>
                        ` : ''}
                        <div class="date-info">
                            <span class="label">Pendente:</span>
                            <span class="value">${item.dias_pendente} dias</span>
                        </div>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn-icon" onclick="backlog.viewItem(${item.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="backlog.editItem(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${item.status === 'aprovado' ? `
                        <button class="btn-icon success" onclick="backlog.startItem(${item.id})" title="Iniciar">
                            <i class="fas fa-play"></i>
                        </button>
                    ` : ''}
                    ${item.status === 'em_execucao' ? `
                        <button class="btn-icon success" onclick="backlog.completeItem(${item.id})" title="Concluir">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon danger" onclick="backlog.deleteItem(${item.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        const classes = {
            'identificado': 'status-new',
            'analisado': 'status-analyzed',
            'aprovado': 'status-approved',
            'em_execucao': 'status-progress',
            'concluido': 'status-completed',
            'cancelado': 'status-cancelled'
        };
        return classes[status] || '';
    }

    getPriorityClass(prioridade) {
        const classes = {
            'baixa': 'priority-low',
            'media': 'priority-medium',
            'alta': 'priority-high',
            'critica': 'priority-critical'
        };
        return classes[prioridade] || '';
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
            paginationHTML += `<button onclick="backlog.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="active">${i}</button>`;
            } else {
                paginationHTML += `<button onclick="backlog.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < totalPages) {
            paginationHTML += `<button onclick="backlog.goToPage(${this.currentPage + 1})">Próximo</button>`;
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
            categoria: '',
            status: '',
            prioridade: '',
            responsavel: '',
            equipamento: '',
            search: ''
        };

        document.getElementById('filter-categoria').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-prioridade').value = '';
        document.getElementById('filter-responsavel').value = '';
        document.getElementById('filter-equipamento').value = '';
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
            await this.loadStats();
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
                <h2>Novo Item de Backlog</h2>
                <form id="backlogForm">
                    <div class="form-grid">
                        <div class="form-group full-width">
                            <label for="item-titulo">Título*</label>
                            <input type="text" id="item-titulo" name="titulo" required />
                        </div>

                        <div class="form-group">
                            <label for="item-categoria">Categoria*</label>
                            <select id="item-categoria" name="categoria" required>
                                <option value="">Selecione...</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="melhoria">Melhoria</option>
                                <option value="projeto">Projeto</option>
                                <option value="emergencia">Emergência</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-tipo">Tipo*</label>
                            <select id="item-tipo" name="tipo" required>
                                <option value="">Selecione...</option>
                                <option value="preventiva">Preventiva</option>
                                <option value="corretiva">Corretiva</option>
                                <option value="preditiva">Preditiva</option>
                                <option value="upgrade">Upgrade</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-prioridade">Prioridade</label>
                            <select id="item-prioridade" name="prioridade">
                                <option value="baixa">Baixa</option>
                                <option value="media" selected>Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-urgencia">Urgência</label>
                            <select id="item-urgencia" name="urgencia">
                                <option value="baixa">Baixa</option>
                                <option value="media" selected>Média</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-impacto">Impacto</label>
                            <select id="item-impacto" name="impacto">
                                <option value="baixo">Baixo</option>
                                <option value="medio" selected>Médio</option>
                                <option value="alto">Alto</option>
                                <option value="critico">Crítico</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-equipamento">Equipamento</label>
                            <select id="item-equipamento" name="equipamento_id">
                                <option value="">Selecione...</option>
                                ${this.equipamentos.map(eq => `<option value="${eq.id}">${eq.codigo_interno} - ${eq.nome}</option>`).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="item-responsavel">Responsável</label>
                            <input type="text" id="item-responsavel" name="responsavel" />
                        </div>

                        <div class="form-group">
                            <label for="item-esforco">Esforço Estimado (horas)</label>
                            <input type="number" id="item-esforco" name="esforco_estimado" min="0" step="0.5" />
                        </div>

                        <div class="form-group">
                            <label for="item-custo">Custo Estimado</label>
                            <input type="number" id="item-custo" name="custo_estimado" min="0" step="0.01" />
                        </div>

                        <div class="form-group">
                            <label for="item-data-prevista">Data Prevista</label>
                            <input type="date" id="item-data-prevista" name="data_prevista" />
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label for="item-descricao">Descrição</label>
                        <textarea id="item-descricao" name="descricao" rows="3"></textarea>
                    </div>

                    <div class="form-group full-width">
                        <label for="item-observacoes">Observações</label>
                        <textarea id="item-observacoes" name="observacoes" rows="2"></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" onclick="this.closest('.custom-modal-overlay').remove()">Cancelar</button>
                        <button type="submit">Criar Item</button>
                    </div>
                </form>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listener para o formulário
            document.getElementById('backlogForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createItem(new FormData(e.target));
                overlay.remove();
            });

        } catch (error) {
            console.error('Erro ao exibir modal de criação:', error);
            Toast.error('Erro ao preparar modal');
        }
    }

    async createItem(formData) {
        try {
            const data = Object.fromEntries(formData);
            
            // Converter valores numéricos
            ['equipamento_id', 'esforco_estimado', 'custo_estimado'].forEach(field => {
                if (data[field]) {
                    data[field] = parseFloat(data[field]);
                }
            });

            await API.backlog.create(data);
            Toast.success('Item criado com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao criar item:', error);
            Toast.error('Erro ao criar item');
        }
    }

    async recalcularPriorizacao() {
        try {
            if (!confirm('Deseja recalcular a priorização de todos os itens ativos?')) {
                return;
            }

            const result = await API.backlog.recalcPriority();
            Toast.success(result.message);
            await this.refresh();

        } catch (error) {
            console.error('Erro ao recalcular priorização:', error);
            Toast.error('Erro ao recalcular priorização');
        }
    }

    async viewItem(id) {
        try {
            const item = await API.backlog.get(id);
            // Implementar modal de visualização
            console.log('Visualizar item:', item);
        } catch (error) {
            console.error('Erro ao visualizar item:', error);
            Toast.error('Erro ao carregar item');
        }
    }

    async editItem(id) {
        try {
            const item = await API.backlog.get(id);
            // Implementar modal de edição
            console.log('Editar item:', item);
        } catch (error) {
            console.error('Erro ao carregar item para edição:', error);
            Toast.error('Erro ao carregar item');
        }
    }

    async startItem(id) {
        try {
            if (!confirm('Deseja iniciar este item?')) {
                return;
            }

            await API.backlog.start(id);
            Toast.success('Item iniciado com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao iniciar item:', error);
            Toast.error('Erro ao iniciar item');
        }
    }

    async completeItem(id) {
        try {
            const observacoes = prompt('Observações sobre a conclusão (opcional):');
            if (observacoes === null) return; // Cancelou

            await API.backlog.complete(id, { observacoes_conclusao: observacoes });
            Toast.success('Item concluído com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao concluir item:', error);
            Toast.error('Erro ao concluir item');
        }
    }

    async deleteItem(id) {
        try {
            if (!confirm('Deseja realmente excluir este item de backlog?')) {
                return;
            }

            await API.backlog.delete(id);
            Toast.success('Item excluído com sucesso');
            await this.refresh();

        } catch (error) {
            console.error('Erro ao excluir item:', error);
            Toast.error('Erro ao excluir item');
        }
    }
}

// Exportar a classe para uso global
window.BacklogPage = BacklogPage;


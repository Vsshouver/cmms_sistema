// Página do Dashboard
class DashboardPage {
    constructor() {
        this.data = null;
        this.charts = {};
        this.refreshInterval = null;
    }

    async render(container) {
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML();

            // Carregar dados
            await this.loadData();

            // Renderizar conteúdo
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents(container);

            // Inicializar gráficos
            this.initializeCharts();

            // Configurar auto-refresh
            this.setupAutoRefresh();

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            container.innerHTML = this.getErrorHTML(error.message);
        }
    }

    async loadData() {
        try {
            // Carregar dados do dashboard
            const data = await API.dashboard.getStats();
            this.data = {
                kpis: data.kpis || {},
                graficos: data.graficos || {},
                alertas: data.alertas || [],
                atividades_recentes: data.atividades_recentes || []
            };
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
            throw error;
        }
    }

    getLoadingHTML() {
        return `
            <div class="dashboard-loading">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Carregando dashboard...</p>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="dashboard-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Erro ao carregar dashboard</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="navigation.navigateTo('dashboard')">
                    <i class="fas fa-refresh"></i>
                    Tentar novamente
                </button>
            </div>
        `;
    }

    getHTML() {
        const user = auth.getCurrentUser();
        const greeting = Utils.getGreeting();
        
        return `
            <div class="dashboard">
                <!-- Header -->
                <div class="page-header">
                    <div class="page-title">
                        <i class="fas fa-tachometer-alt"></i>
                        <div>
                            <h1>Dashboard</h1>
                            <p class="greeting">${greeting}, ${user?.nome_completo?.split(' ')[0] || user?.username}!</p>
                        </div>
                    </div>
                    <div class="page-actions">
                        <button class="btn btn-outline" id="refresh-dashboard">
                            <i class="fas fa-sync-alt"></i>
                            Atualizar
                        </button>
                    </div>
                </div>

                <!-- Estatísticas principais -->
                <div class="stats-grid">
                    ${this.getStatsCardsHTML()}
                </div>

                <!-- Gráficos e informações -->
                <div class="dashboard-grid">
                    <div class="dashboard-left">
                        ${this.getChartsHTML()}
                    </div>
                    <div class="dashboard-right">
                        ${this.getAlertsHTML()}
                        ${this.getRecentActivitiesHTML()}
                    </div>
                </div>
            </div>
        `;
    }

    getStatsCardsHTML() {
        if (!this.data?.kpis) return '';

        const kpis = this.data.kpis;

        const stats = [
            {
                title: 'Equipamentos Ativos',
                value: kpis.equipamentos_ativos || 0,
                icon: 'fas fa-cogs',
                color: 'success',
                change: kpis.equipamentos_change || 0
            },
            {
                title: 'OS Abertas',
                value: kpis.os_abertas || 0,
                icon: 'fas fa-clipboard-list',
                color: 'warning',
                change: kpis.os_abertas_change || 0
            },
            {
                title: 'OS Concluídas (Mês)',
                value: kpis.os_concluidas_mes ?? kpis.os_concluidas ?? 0,
                icon: 'fas fa-check-circle',
                color: 'success',
                change: kpis.os_concluidas_change || 0
            },
            {
                title: 'Peças em Estoque',
                value: kpis.pecas_estoque ?? kpis.total_pecas ?? 0,
                icon: 'fas fa-boxes',
                color: 'info',
                change: kpis.pecas_change || 0
            }
        ];

        return stats.map(stat => `
            <div class="stats-card stats-card-${stat.color}">
                <div class="stats-icon">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="stats-content">
                    <div class="stats-value">${Utils.formatNumber(stat.value)}</div>
                    <div class="stats-title">${stat.title}</div>
                    ${stat.change !== 0 ? `
                        <div class="stats-change ${stat.change > 0 ? 'positive' : 'negative'}">
                            <i class="fas fa-arrow-${stat.change > 0 ? 'up' : 'down'}"></i>
                            ${Math.abs(stat.change)}%
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    getChartsHTML() {
        return `
            <div class="charts-section">
                <!-- Gráfico de OS por Status -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-pie"></i>
                            Ordens de Serviço por Status
                        </h3>
                    </div>
                    <div class="card-body">
                        <div id="os-status-chart"></div>
                    </div>
                </div>

                <!-- Gráfico de Manutenções por Tipo -->
                <div class="card mt-6">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-bar"></i>
                            Manutenções por Tipo (Últimos 30 dias)
                        </h3>
                    </div>
                    <div class="card-body">
                        <div id="maintenance-types-chart"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getAlertsHTML() {
        const alerts = this.data?.alertas || [];
        
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        Alertas
                    </h3>
                </div>
                <div class="card-body">
                    ${alerts.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-check-circle text-success"></i>
                            <p>Nenhum alerta no momento</p>
                        </div>
                    ` : `
                        <div class="alerts-list">
                            ${alerts.slice(0, 5).map(alert => `
                                <div class="alert-item alert-${alert.severidade}">
                                    <div class="alert-icon">
                                        <i class="${Utils.getStatusIcon(alert.tipo)}"></i>
                                    </div>
                                    <div class="alert-content">
                                        <div class="alert-title">${alert.titulo}</div>
                                        <div class="alert-message">${alert.mensagem}</div>
                                        <div class="alert-time">${Utils.formatDate(alert.data_alerta, true)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ${alerts.length > 5 ? `
                            <div class="card-footer">
                                <a href="#" class="btn btn-outline btn-sm">
                                    Ver todos os alertas (${alerts.length})
                                </a>
                            </div>
                        ` : ''}
                    `}
                </div>
            </div>
        `;
    }

    getRecentActivitiesHTML() {
        const activities = this.data?.atividades_recentes || [];
        
        return `
            <div class="card mt-6">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-history"></i>
                        Atividades Recentes
                    </h3>
                </div>
                <div class="card-body">
                    ${activities.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-clock text-gray-400"></i>
                            <p>Nenhuma atividade recente</p>
                        </div>
                    ` : `
                        <div class="activities-list">
                            ${activities.slice(0, 10).map(activity => `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="${this.getActivityIcon(activity.tipo)}"></i>
                                    </div>
                                    <div class="activity-content">
                                        <div class="activity-title">${activity.titulo}</div>
                                        <div class="activity-description">${activity.descricao}</div>
                                        <div class="activity-time">${Utils.formatDate(activity.data, true)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'os_criada': 'fas fa-plus-circle text-success',
            'os_concluida': 'fas fa-check-circle text-success',
            'equipamento_cadastrado': 'fas fa-cog text-info',
            'peca_movimentada': 'fas fa-exchange-alt text-warning',
            'usuario_logado': 'fas fa-sign-in-alt text-gray-500'
        };
        
        return icons[type] || 'fas fa-circle text-gray-400';
    }

    setupEvents(container) {
        // Botão de refresh
        const refreshBtn = container.querySelector('#refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Cliques nos cards de estatísticas
        const statsCards = container.querySelectorAll('.stats-card');
        statsCards.forEach((card, index) => {
            card.addEventListener('click', () => this.handleStatsCardClick(index));
        });
    }

    async refresh() {
        try {
            const refreshBtn = document.querySelector('#refresh-dashboard');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.add('fa-spin');
                refreshBtn.disabled = true;
            }

            await this.loadData();
            
            // Re-renderizar apenas o conteúdo necessário
            const container = document.querySelector('.dashboard');
            if (container) {
                // Atualizar cards de estatísticas
                const statsGrid = container.querySelector('.stats-grid');
                if (statsGrid) {
                    statsGrid.innerHTML = this.getStatsCardsHTML();
                }

                // Atualizar alertas
                const alertsCard = container.querySelector('.card .card-body');
                // ... atualizar outros componentes
            }

            // Atualizar gráficos
            if (this.charts.osStatus) {
                agCharts.AgChart.update(this.charts.osStatus, {
                    data: this.data.graficos?.os_por_status || []
                });
            }
            if (this.charts.maintenanceTypes) {
                agCharts.AgChart.update(this.charts.maintenanceTypes, {
                    data: this.data.graficos?.os_por_tipo || []
                });
            }

            Toast.success('Dashboard atualizado');

        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            Toast.error('Erro ao atualizar dashboard');
        } finally {
            const refreshBtn = document.querySelector('#refresh-dashboard');
            if (refreshBtn) {
                const icon = refreshBtn.querySelector('i');
                icon.classList.remove('fa-spin');
                refreshBtn.disabled = false;
            }
        }
    }

    handleStatsCardClick(index) {
        const routes = [
            'equipamentos',
            'ordens-servico',
            'ordens-servico',
            'estoque'
        ];
        
        const route = routes[index];
        if (route) {
            navigation.navigateTo(route);
        }
    }

    initializeCharts() {
        this.initializeOSStatusChart();
        this.initializeMaintenanceTypesChart();
    }

    initializeOSStatusChart() {
        const container = document.getElementById('os-status-chart');
        if (!container) return;

        this.charts.osStatus = agCharts.AgChart.create({
            container,
            data: this.data.graficos?.os_por_status || [],
            series: [{
                type: 'pie',
                angleKey: 'count',
                legendItemKey: 'status'
            }]
        });
    }

    initializeMaintenanceTypesChart() {
        const container = document.getElementById('maintenance-types-chart');
        if (!container) return;

        this.charts.maintenanceTypes = agCharts.AgChart.create({
            container,
            data: this.data.graficos?.os_por_tipo || [],
            series: [{
                type: 'column',
                xKey: 'tipo',
                yKey: 'count'
            }],
            axes: [
                { type: 'category', position: 'bottom' },
                { type: 'number', position: 'left' }
            ]
        });
    }

    setupAutoRefresh() {
        // Auto-refresh a cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 5 * 60 * 1000);
    }

    destroy() {
        // Limpar interval quando a página for destruída
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                agCharts.AgChart.destroy(chart);
            }
        });
        this.charts = {};
    }
}

// Exportar para uso global
window.DashboardPage = DashboardPage;


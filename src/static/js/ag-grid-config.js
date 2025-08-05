// Configuração global do AG-Grid
class AGGridConfig {
    static init() {
        // Configurar licença do AG-Grid Enterprise
        // Substitua "SUA-LICENCA-AQUI" pela licença válida
        agGrid.LicenseManager.setLicenseKey('SUA-LICENCA-AQUI');
        
        // Configurações globais padrão
        this.defaultGridOptions = {
            // Configurações de dados
            rowSelection: 'multiple',
            suppressRowClickSelection: true,
            
            // Configurações de paginação
            pagination: true,
            paginationPageSize: 20,
            paginationPageSizeSelector: [10, 20, 50, 100],
            
            // Configurações de filtros
            defaultColDef: {
                sortable: true,
                filter: true,
                resizable: true,
                floatingFilter: true,
                minWidth: 100,
            },
            
            // Configurações de localização (português)
            localeText: {
                // Paginação
                page: 'Página',
                more: 'Mais',
                to: 'até',
                of: 'de',
                next: 'Próximo',
                last: 'Último',
                first: 'Primeiro',
                previous: 'Anterior',
                loadingOoo: 'Carregando...',
                
                // Filtros
                searchOoo: 'Buscar...',
                blanks: 'Em branco',
                filterOoo: 'Filtrar...',
                applyFilter: 'Aplicar Filtro',
                resetFilter: 'Limpar Filtro',
                clearFilter: 'Limpar Filtro',
                cancelFilter: 'Cancelar',
                
                // Menu de colunas
                pinColumn: 'Fixar Coluna',
                pinLeft: 'Fixar à Esquerda',
                pinRight: 'Fixar à Direita',
                noPin: 'Não Fixar',
                valueAggregation: 'Agregação de Valor',
                autosizeThiscolumn: 'Ajustar Esta Coluna',
                autosizeAllColumns: 'Ajustar Todas as Colunas',
                groupBy: 'Agrupar Por',
                ungroupBy: 'Desagrupar Por',
                resetColumns: 'Redefinir Colunas',
                expandAll: 'Expandir Tudo',
                collapseAll: 'Recolher Tudo',
                copy: 'Copiar',
                ctrlC: 'Ctrl+C',
                paste: 'Colar',
                ctrlV: 'Ctrl+V',
                export: 'Exportar',
                csvExport: 'Exportar CSV',
                excelExport: 'Exportar Excel',
                
                // Seleção
                selectAll: 'Selecionar Tudo',
                selectAllFiltered: 'Selecionar Filtrados',
                deselectAll: 'Desmarcar Tudo',
                
                // Agrupamento
                group: 'Grupo',
                rowGroupColumnsEmptyMessage: 'Arraste colunas aqui para agrupar',
                valueColumnsEmptyMessage: 'Arraste colunas aqui para agregar',
                pivotColumnsEmptyMessage: 'Arraste colunas aqui para dinamizar',
                
                // Ordenação
                sortAscending: 'Ordenar Crescente',
                sortDescending: 'Ordenar Decrescente',
                sortUnSort: 'Limpar Ordenação',
                
                // Outros
                noRowsToShow: 'Nenhum registro encontrado',
                enabled: 'Habilitado',
                disabled: 'Desabilitado',
                true: 'Verdadeiro',
                false: 'Falso',
            },
            
            // Configurações de exportação
            enableRangeSelection: true,
            enableCharts: true,
            
            // Configurações de performance
            animateRows: true,
            suppressColumnVirtualisation: false,
            suppressRowVirtualisation: false,
            
            // Configurações de interface
            suppressMenuHide: false,
            suppressMovableColumns: false,
            enableBrowserTooltips: false,
            tooltipShowDelay: 1000,
            
            // Configurações de edição
            stopEditingWhenCellsLoseFocus: true,
            undoRedoCellEditing: true,
            undoRedoCellEditingLimit: 20,
        };
    }
    
    static getDefaultOptions() {
        return { ...this.defaultGridOptions };
    }
    
    static createGrid(container, options = {}) {
        if (!container) {
            console.error('Grid container não encontrado');
            return null;
        }

        const gridOptions = {
            ...this.getDefaultOptions(),
            ...options
        };

        // Adicionar classe CSS do tema
        container.className = `${container.className} ag-theme-alpine`.trim();

        const create = () => agGrid.createGrid(container, gridOptions);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', create);
            return null;
        }

        return create();
    }
    
    // Formatadores comuns
    static formatters = {
        currency: (params) => {
            if (params.value == null) return '';
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(params.value);
        },
        
        date: (params) => {
            if (!params.value) return '';
            const date = new Date(params.value);
            return date.toLocaleDateString('pt-BR');
        },
        
        datetime: (params) => {
            if (!params.value) return '';
            const date = new Date(params.value);
            return date.toLocaleString('pt-BR');
        },
        
        status: (params) => {
            if (!params.value) return '';
            const statusMap = {
                'ativo': '<span class="status-badge status-success">Ativo</span>',
                'inativo': '<span class="status-badge status-danger">Inativo</span>',
                'manutencao': '<span class="status-badge status-warning">Em Manutenção</span>',
                'pendente': '<span class="status-badge status-info">Pendente</span>',
                'concluido': '<span class="status-badge status-success">Concluído</span>',
                'cancelado': '<span class="status-badge status-danger">Cancelado</span>',
            };
            return statusMap[params.value] || params.value;
        },
        
        boolean: (params) => {
            if (params.value == null) return '';
            return params.value ? 'Sim' : 'Não';
        }
    };
    
    // Filtros customizados
    static filters = {
        statusFilter: {
            filter: 'agSetColumnFilter',
            filterParams: {
                values: ['ativo', 'inativo', 'manutencao', 'pendente', 'concluido', 'cancelado'],
                valueFormatter: (params) => {
                    const statusMap = {
                        'ativo': 'Ativo',
                        'inativo': 'Inativo',
                        'manutencao': 'Em Manutenção',
                        'pendente': 'Pendente',
                        'concluido': 'Concluído',
                        'cancelado': 'Cancelado'
                    };
                    return statusMap[params.value] || params.value;
                }
            }
        }
    };
    
    // Renderizadores de ações comuns
    static actionRenderers = {
        editDelete: (editCallback, deleteCallback, permissions = {}) => {
            return (params) => {
                const canEdit = permissions.edit !== false;
                const canDelete = permissions.delete !== false;
                
                let html = '<div class="ag-actions">';
                
                if (canEdit) {
                    html += `<button class="btn-action btn-edit" onclick="(${editCallback.toString()})(${JSON.stringify(params.data)})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>`;
                }
                
                if (canDelete) {
                    html += `<button class="btn-action btn-delete" onclick="(${deleteCallback.toString()})(${JSON.stringify(params.data)})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>`;
                }
                
                html += '</div>';
                return html;
            };
        },
        
        view: (viewCallback) => {
            return (params) => {
                return `<div class="ag-actions">
                    <button class="btn-action btn-view" onclick="(${viewCallback.toString()})(${JSON.stringify(params.data)})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>`;
            };
        }
    };
}

// Inicializar configurações quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    AGGridConfig.init();
});

// Exportar para uso global
window.AGGridConfig = AGGridConfig;


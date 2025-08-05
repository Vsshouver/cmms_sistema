// Sistema de Toast Notifications
class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
            }
        }
    }

    static show(message, type = 'info', duration = 5000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const titles = {
            success: 'Sucesso',
            error: 'Erro',
            warning: 'Atenção',
            info: 'Informação'
        };

        toast.innerHTML = `
            <i class="toast-icon ${icons[type]}"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Event listener para fechar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        // Adicionar ao container
        this.container.appendChild(toast);

        // Auto-remover após duração especificada
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }

        return toast;
    }

    static remove(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    static success(message, duration) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Sistema de Modals
class Modal {
    static activeModal = null;

    static create(options = {}) {
        const {
            title = 'Modal',
            content = '',
            size = 'md',
            closable = true,
            onClose = null
        } = options;

        // Criar overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Criar modal
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h3 class="modal-title">${title}</h3>
            ${closable ? '<button class="modal-close"><i class="fas fa-times"></i></button>' : ''}
        `;

        // Body
        const body = document.createElement('div');
        body.className = 'modal-body';
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }

        // Montar modal
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);

        // Event listeners
        if (closable) {
            const closeBtn = header.querySelector('.modal-close');
            closeBtn.addEventListener('click', () => this.close(overlay, onClose));

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(overlay, onClose);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.activeModal === overlay) {
                    this.close(overlay, onClose);
                }
            });
        }

        return { overlay, modal, header, body };
    }

    static show(options = {}) {
        const { overlay } = this.create(options);
        
        // Adicionar ao DOM
        const container = document.getElementById('modals-container') || document.body;
        container.appendChild(overlay);
        
        this.activeModal = overlay;
        
        return overlay;
    }

    static close(overlay, onClose = null) {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            
            if (this.activeModal === overlay) {
                this.activeModal = null;
            }
            
            if (onClose && typeof onClose === 'function') {
                onClose();
            }
        }
    }

    static confirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const content = `
                <p class="mb-4">${message}</p>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
                    <button class="btn btn-primary" data-action="confirm">Confirmar</button>
                </div>
            `;

            const overlay = this.show({
                title,
                content,
                size: 'sm'
            });

            // Event listeners para botões
            overlay.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    resolve(true);
                    this.close(overlay);
                } else if (action === 'cancel') {
                    resolve(false);
                    this.close(overlay);
                }
            });
        });
    }
}

// Componente de Loading
class Loading {
    static overlay = null;

    static show(message = 'Carregando...') {
        this.hide(); // Remove loading anterior se existir

        this.overlay = document.createElement('div');
        this.overlay.className = 'loading-overlay';
        this.overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>${message}</p>
            </div>
        `;

        // Adicionar estilos inline se necessário
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            text-align: center;
        `;

        document.body.appendChild(this.overlay);
    }

    static hide() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }
    }
}

// Componente de Tabela com funcionalidades
class DataTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            data: [],
            columns: [],
            sortable: true,
            searchable: true,
            paginated: true,
            pageSize: 10,
            ...options
        };
        
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filteredData = [];
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = '';
        
        // Toolbar
        if (this.options.searchable) {
            this.renderToolbar();
        }
        
        // Tabela
        this.renderTable();
        
        // Paginação
        if (this.options.paginated) {
            this.renderPagination();
        }
    }

    renderToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'table-toolbar mb-4 flex justify-between items-center';
        
        toolbar.innerHTML = `
            <div class="table-search">
                <div class="input-group">
                    <i class="fas fa-search"></i>
                    <input type="text" class="form-input" placeholder="Buscar..." value="${this.searchTerm}">
                </div>
            </div>
            <div class="table-info">
                <span class="text-sm text-gray-600">
                    ${this.getFilteredData().length} registros
                </span>
            </div>
        `;
        
        this.container.appendChild(toolbar);
    }

    renderTable() {
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        const table = document.createElement('table');
        table.className = 'table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        this.options.columns.forEach(column => {
            const th = document.createElement('th');
            th.innerHTML = `
                ${column.title}
                ${this.options.sortable && column.sortable !== false ? 
                    `<i class="fas fa-sort sort-icon" data-column="${column.key}"></i>` : ''}
            `;
            
            if (this.sortColumn === column.key) {
                const icon = th.querySelector('.sort-icon');
                if (icon) {
                    icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
                }
            }
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        const paginatedData = this.getPaginatedData();
        
        if (paginatedData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="${this.options.columns.length}" class="text-center text-gray-500 py-8">
                    Nenhum registro encontrado
                </td>
            `;
            tbody.appendChild(emptyRow);
        } else {
            paginatedData.forEach(row => {
                const tr = document.createElement('tr');
                
                this.options.columns.forEach(column => {
                    const td = document.createElement('td');
                    
                    if (column.render && typeof column.render === 'function') {
                        const rendered = column.render(row[column.key], row);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else {
                            td.appendChild(rendered);
                        }
                    } else {
                        td.textContent = row[column.key] || '';
                    }
                    
                    tr.appendChild(td);
                });
                
                tbody.appendChild(tr);
            });
        }
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        this.container.appendChild(tableContainer);
    }

    renderPagination() {
        const totalPages = Math.ceil(this.getFilteredData().length / this.options.pageSize);
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination mt-4 flex justify-center items-center gap-2';
        
        // Botão anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = `btn btn-outline btn-sm ${this.currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = this.currentPage === 1;
        pagination.appendChild(prevBtn);
        
        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-outline'}`;
                pageBtn.textContent = i;
                pageBtn.dataset.page = i;
                pagination.appendChild(pageBtn);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'px-2';
                pagination.appendChild(ellipsis);
            }
        }
        
        // Botão próximo
        const nextBtn = document.createElement('button');
        nextBtn.className = `btn btn-outline btn-sm ${this.currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = this.currentPage === totalPages;
        pagination.appendChild(nextBtn);
        
        this.container.appendChild(pagination);
    }

    bindEvents() {
        // Busca
        const searchInput = this.container.querySelector('.table-search input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.render();
            }, 300));
        }
        
        // Ordenação
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('sort-icon')) {
                const column = e.target.dataset.column;
                this.sort(column);
            }
            
            // Paginação
            if (e.target.dataset.page) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.render();
            }
            
            // Botões de navegação
            if (e.target.closest('.btn')) {
                const btn = e.target.closest('.btn');
                if (btn.innerHTML.includes('chevron-left') && !btn.disabled) {
                    this.currentPage--;
                    this.render();
                } else if (btn.innerHTML.includes('chevron-right') && !btn.disabled) {
                    this.currentPage++;
                    this.render();
                }
            }
        });
    }

    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        
        this.currentPage = 1;
        this.render();
    }

    getFilteredData() {
        if (!this.searchTerm) {
            this.filteredData = [...this.options.data];
        } else {
            this.filteredData = this.options.data.filter(row => {
                return this.options.columns.some(column => {
                    const value = row[column.key];
                    return value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase());
                });
            });
        }
        
        // Aplicar ordenação
        if (this.sortColumn) {
            this.filteredData = Utils.sortBy(this.filteredData, this.sortColumn, this.sortDirection);
        }
        
        return this.filteredData;
    }

    getPaginatedData() {
        const filtered = this.getFilteredData();
        const start = (this.currentPage - 1) * this.options.pageSize;
        const end = start + this.options.pageSize;
        return filtered.slice(start, end);
    }

    updateData(newData) {
        this.options.data = newData;
        this.currentPage = 1;
        this.render();
    }

    refresh() {
        this.render();
    }
}

// Exportar componentes
window.Toast = Toast;
window.Modal = Modal;
window.Loading = Loading;
window.DataTable = DataTable;

function openStandardModal({ title = '', content = '', onSave = null }) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50';

    const modal = document.createElement('div');
    modal.className = 'bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl relative';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'absolute top-4 right-4 text-gray-600 hover:text-black cursor-pointer';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
    modal.appendChild(closeBtn);

    if (title) {
        const titleEl = document.createElement('h2');
        titleEl.className = 'text-xl font-semibold mb-4';
        titleEl.textContent = title;
        modal.appendChild(titleEl);
    }

    const body = document.createElement('div');
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else {
        body.appendChild(content);
    }
    modal.appendChild(body);

    if (onSave) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4';
        saveBtn.textContent = 'Salvar';
        saveBtn.addEventListener('click', async () => {
            await onSave();
            document.body.removeChild(overlay);
        });
        modal.appendChild(saveBtn);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    return overlay;
}

window.openStandardModal = openStandardModal;


// Utilitários gerais
const Utils = {
    // Formatação de data
    formatDate(dateString, includeTime = false) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString('pt-BR', options);
    },

    // Formatação de moeda
    formatCurrency(value) {
        if (value === null || value === undefined) return 'R$ 0,00';
        
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Formatação de número
    formatNumber(value, decimals = 0) {
        if (value === null || value === undefined) return '0';
        
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Capitalizar primeira letra
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Truncar texto
    truncate(str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },

    // Validar email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validar CPF
    isValidCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    },

    // Formatar CPF
    formatCPF(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/[^\d]/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    // Formatar telefone
    formatPhone(phone) {
        if (!phone) return '';
        phone = phone.replace(/[^\d]/g, '');
        
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    },

    // Escapar HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    },

    // Download de arquivo
    downloadFile(data, filename, type = 'text/plain') {
        const file = new Blob([data], { type });
        const a = document.createElement('a');
        const url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    },

    // Copiar para clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    },

    // Obter cor do status
    getStatusColor(status) {
        const colors = {
            'ativo': 'success',
            'inativo': 'gray',
            'aberta': 'info',
            'em_execucao': 'warning',
            'concluida': 'success',
            'cancelada': 'error',
            'aguardando_pecas': 'warning',
            'em_uso': 'success',
            'estoque': 'info',
            'manutencao': 'warning',
            'descarte': 'error',
            'recapagem': 'warning',
            'baixa': 'success',
            'media': 'warning',
            'alta': 'error',
            'critica': 'error'
        };
        
        return colors[status] || 'gray';
    },

    // Obter ícone do status
    getStatusIcon(status) {
        const icons = {
            'ativo': 'fas fa-check-circle',
            'inativo': 'fas fa-times-circle',
            'aberta': 'fas fa-folder-open',
            'em_execucao': 'fas fa-play-circle',
            'concluida': 'fas fa-check-circle',
            'cancelada': 'fas fa-times-circle',
            'aguardando_pecas': 'fas fa-clock',
            'em_uso': 'fas fa-cog',
            'estoque': 'fas fa-box',
            'manutencao': 'fas fa-wrench',
            'descarte': 'fas fa-trash',
            'recapagem': 'fas fa-recycle',
            'baixa': 'fas fa-arrow-down',
            'media': 'fas fa-minus',
            'alta': 'fas fa-arrow-up',
            'critica': 'fas fa-exclamation-triangle'
        };
        
        return icons[status] || 'fas fa-circle';
    },

    // Calcular diferença de dias
    daysDifference(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        const firstDate = new Date(date1);
        const secondDate = new Date(date2);
        
        return Math.round(Math.abs((firstDate - secondDate) / oneDay));
    },

    // Verificar se data está no passado
    isPastDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return date < today;
    },

    // Obter saudação baseada no horário
    getGreeting() {
        const hour = new Date().getHours();
        
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    },

    // Ordenar array de objetos
    sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // Tratar valores nulos
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Converter para string se necessário
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    // Filtrar array de objetos
    filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (!filterValue) return true;
                
                if (typeof itemValue === 'string') {
                    return itemValue.toLowerCase().includes(filterValue.toLowerCase());
                }
                
                return itemValue === filterValue;
            });
        });
    },

    // Agrupar array por propriedade
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key] || 'Sem categoria';
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    // Calcular estatísticas básicas
    calculateStats(array, key) {
        if (!array.length) return { min: 0, max: 0, avg: 0, sum: 0 };
        
        const values = array.map(item => item[key] || 0);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        return { min, max, avg, sum };
    },

    // Formatação específicas para o sistema
    formatStatus(status) {
        const statusMap = {
            'aberta': 'Aberta',
            'em_execucao': 'Em Execução',
            'aguardando_pecas': 'Aguardando Peças',
            'concluida': 'Concluída',
            'cancelada': 'Cancelada',
            'ativo': 'Ativo',
            'inativo': 'Inativo',
            'manutencao': 'Em Manutenção'
        };
        
        return statusMap[status] || status;
    },

    formatPriority(priority) {
        const priorityMap = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'critica': 'Crítica'
        };

        return priorityMap[priority] || priority;
    },

    // Aplicar classes padrão a campos de formulário
    applyFormStyles(root = document) {
        if (!root) return;
        root.querySelectorAll('input:not(.form-input), select:not(.form-select), textarea:not(.form-textarea)')
            .forEach(el => {
                if (el.tagName === 'INPUT') el.classList.add('form-input');
                if (el.tagName === 'SELECT') el.classList.add('form-select');
                if (el.tagName === 'TEXTAREA') el.classList.add('form-textarea');
            });
    },

    // Observar DOM para aplicar estilos em campos adicionados dinamicamente
    setupFormObserver() {
        this.applyFormStyles();
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(node.tagName)) {
                        this.applyFormStyles(node.parentElement || node);
                    } else {
                        this.applyFormStyles(node);
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    // Limpar mensagens de erro do formulário
    clearFormErrors(form) {
        if (!form) return;
        form.querySelectorAll('.form-error').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
    },

    // Exibir mensagens de erro de validação
    showFormErrors(form, errors = {}) {
        if (!form) return;
        this.clearFormErrors(form);
        Object.entries(errors).forEach(([field, message]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('is-invalid');
                const small = document.createElement('small');
                small.className = 'form-error';
                small.textContent = message;
                input.insertAdjacentElement('afterend', small);
            }
        });
    },

    formatTime(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Exportar para uso global
window.Utils = Utils;


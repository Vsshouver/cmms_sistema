class ImportPage {
    constructor() {
        this.uploadedFile = null;
        this.previewData = [];
        this.importResults = null;
        this.currentStep = 1; // 1: Upload, 2: Preview, 3: Results
    }

    async render(container) {
        container.innerHTML = this.getMainHTML();
        this.bindEvents();
    }

    getMainHTML() {
        return `
            <div class="page-header">
                <div class="page-title">
                    <h1><i class="icon-upload"></i> Importar Dados</h1>
                    <p>Importe peças, equipamentos e outros dados via planilha</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="this.downloadTemplate()">
                        <i class="icon-download"></i> Baixar Modelo
                    </button>
                    <button class="btn btn-outline" onclick="this.reset()">
                        <i class="icon-refresh"></i> Reiniciar
                    </button>
                </div>
            </div>

            <div class="import-wizard">
                ${this.getStepsHTML()}
                ${this.getContentHTML()}
            </div>
        `;
    }

    getStepsHTML() {
        return `
            <div class="wizard-steps">
                <div class="step ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}">
                    <div class="step-number">1</div>
                    <div class="step-label">Upload do Arquivo</div>
                </div>
                <div class="step ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}">
                    <div class="step-number">2</div>
                    <div class="step-label">Visualizar Dados</div>
                </div>
                <div class="step ${this.currentStep >= 3 ? 'active' : ''}">
                    <div class="step-number">3</div>
                    <div class="step-label">Resultado</div>
                </div>
            </div>
        `;
    }

    getContentHTML() {
        switch (this.currentStep) {
            case 1:
                return this.getUploadHTML();
            case 2:
                return this.getPreviewHTML();
            case 3:
                return this.getResultsHTML();
            default:
                return this.getUploadHTML();
        }
    }

    getUploadHTML() {
        return `
            <div class="import-content">
                <div class="upload-section">
                    <div class="upload-area" id="uploadArea">
                        <div class="upload-icon">📁</div>
                        <h3>Selecione ou arraste o arquivo</h3>
                        <p>Formatos aceitos: .xlsx, .xls, .csv</p>
                        <p>Tamanho máximo: 10MB</p>
                        <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                        <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                            <i class="icon-upload"></i> Selecionar Arquivo
                        </button>
                    </div>
                    
                    ${this.uploadedFile ? this.getFileInfoHTML() : ''}
                </div>

                <div class="import-options">
                    <h4>Opções de Importação</h4>
                    <div class="option-group">
                        <label>Tipo de Dados</label>
                        <select id="importType">
                            <option value="pecas">Peças</option>
                            <option value="equipamentos">Equipamentos</option>
                            <option value="pneus">Pneus</option>
                            <option value="mecanicos">Mecânicos</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="skipFirstRow" checked>
                            Pular primeira linha (cabeçalho)
                        </label>
                    </div>
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="updateExisting">
                            Atualizar registros existentes
                        </label>
                    </div>
                </div>

                <div class="template-info">
                    <h4>Informações do Modelo</h4>
                    <div class="info-grid">
                        <div class="info-card">
                            <h5>Peças</h5>
                            <p>Código, Nome, Categoria, Descrição, Unidade, Preço, Fornecedor</p>
                        </div>
                        <div class="info-card">
                            <h5>Equipamentos</h5>
                            <p>Código, Nome, Tipo, Modelo, Fabricante, Número Série, Status</p>
                        </div>
                        <div class="info-card">
                            <h5>Pneus</h5>
                            <p>Número Série, Marca, Modelo, Medida, Tipo, Status, Valor</p>
                        </div>
                        <div class="info-card">
                            <h5>Mecânicos</h5>
                            <p>Nome, CPF, Telefone, Email, Especialidade, Nível, Salário</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getFileInfoHTML() {
        return `
            <div class="file-info">
                <div class="file-details">
                    <div class="file-icon">📄</div>
                    <div class="file-data">
                        <strong>${this.uploadedFile.name}</strong>
                        <small>${this.formatFileSize(this.uploadedFile.size)}</small>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="this.processFile()">
                    <i class="icon-arrow-right"></i> Processar Arquivo
                </button>
            </div>
        `;
    }

    getPreviewHTML() {
        return `
            <div class="import-content">
                <div class="preview-header">
                    <h3>Visualização dos Dados</h3>
                    <p>Verifique os dados antes de importar. ${this.previewData.length} registros encontrados.</p>
                </div>

                <div class="preview-stats">
                    <div class="stat-item">
                        <span class="stat-number">${this.previewData.length}</span>
                        <span class="stat-label">Total de registros</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.previewData.filter(item => item.valid).length}</span>
                        <span class="stat-label">Válidos</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.previewData.filter(item => !item.valid).length}</span>
                        <span class="stat-label">Com erro</span>
                    </div>
                </div>

                <div class="preview-table">
                    ${this.getPreviewTableHTML()}
                </div>

                <div class="preview-actions">
                    <button class="btn btn-secondary" onclick="this.goToStep(1)">
                        <i class="icon-arrow-left"></i> Voltar
                    </button>
                    <button class="btn btn-primary" onclick="this.executeImport()" 
                            ${this.previewData.filter(item => item.valid).length === 0 ? 'disabled' : ''}>
                        <i class="icon-check"></i> Importar Dados
                    </button>
                </div>
            </div>
        `;
    }

    getPreviewTableHTML() {
        if (this.previewData.length === 0) {
            return '<div class="empty-state">Nenhum dado encontrado</div>';
        }

        const headers = Object.keys(this.previewData[0].data || {});
        const maxRows = 10; // Mostrar apenas os primeiros 10 registros

        return `
            <table class="preview-data-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                        <th>Erros</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.previewData.slice(0, maxRows).map(item => `
                        <tr class="${item.valid ? 'valid' : 'invalid'}">
                            <td>
                                ${item.valid ? 
                                    '<span class="badge badge-success">✓</span>' : 
                                    '<span class="badge badge-danger">✗</span>'
                                }
                            </td>
                            ${headers.map(header => `<td>${item.data[header] || '-'}</td>`).join('')}
                            <td>
                                ${item.errors ? item.errors.join(', ') : '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${this.previewData.length > maxRows ? 
                `<p class="preview-note">Mostrando ${maxRows} de ${this.previewData.length} registros</p>` : 
                ''
            }
        `;
    }

    getResultsHTML() {
        if (!this.importResults) {
            return '<div class="loading">Processando importação...</div>';
        }

        return `
            <div class="import-content">
                <div class="results-header">
                    <div class="result-icon ${this.importResults.success ? 'success' : 'error'}">
                        ${this.importResults.success ? '✅' : '❌'}
                    </div>
                    <h3>${this.importResults.success ? 'Importação Concluída!' : 'Erro na Importação'}</h3>
                    <p>${this.importResults.message}</p>
                </div>

                <div class="results-stats">
                    <div class="stat-card success">
                        <div class="stat-number">${this.importResults.imported || 0}</div>
                        <div class="stat-label">Importados</div>
                    </div>
                    <div class="stat-card warning">
                        <div class="stat-number">${this.importResults.updated || 0}</div>
                        <div class="stat-label">Atualizados</div>
                    </div>
                    <div class="stat-card danger">
                        <div class="stat-number">${this.importResults.errors || 0}</div>
                        <div class="stat-label">Erros</div>
                    </div>
                    <div class="stat-card info">
                        <div class="stat-number">${this.importResults.skipped || 0}</div>
                        <div class="stat-label">Ignorados</div>
                    </div>
                </div>

                ${this.importResults.errorDetails ? this.getErrorDetailsHTML() : ''}

                <div class="results-actions">
                    <button class="btn btn-secondary" onclick="this.reset()">
                        <i class="icon-upload"></i> Nova Importação
                    </button>
                    <button class="btn btn-primary" onclick="this.goToModule()">
                        <i class="icon-arrow-right"></i> Ver Dados Importados
                    </button>
                </div>
            </div>
        `;
    }

    getErrorDetailsHTML() {
        return `
            <div class="error-details">
                <h4>Detalhes dos Erros</h4>
                <div class="error-list">
                    ${this.importResults.errorDetails.map(error => `
                        <div class="error-item">
                            <strong>Linha ${error.row}:</strong> ${error.message}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bindEvents() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Validar tipo de arquivo
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
            Utils.showNotification('Tipo de arquivo não suportado', 'error');
            return;
        }

        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
            Utils.showNotification('Arquivo muito grande. Máximo 10MB', 'error');
            return;
        }

        this.uploadedFile = file;
        this.updateContent();
    }

    processFile() {
        if (!this.uploadedFile) {
            Utils.showNotification('Selecione um arquivo primeiro', 'error');
            return;
        }

        // Simular processamento do arquivo
        Utils.showNotification('Processando arquivo...', 'info');
        
        setTimeout(() => {
            this.previewData = this.generateMockPreviewData();
            this.currentStep = 2;
            this.updateContent();
        }, 1500);
    }

    generateMockPreviewData() {
        const importType = document.getElementById('importType')?.value || 'pecas';
        const mockData = [];

        for (let i = 1; i <= 15; i++) {
            let data = {};
            let valid = Math.random() > 0.2; // 80% válidos
            let errors = [];

            switch (importType) {
                case 'pecas':
                    data = {
                        'Código': `PC${String(i).padStart(3, '0')}`,
                        'Nome': `Peça ${i}`,
                        'Categoria': 'Filtros',
                        'Descrição': `Descrição da peça ${i}`,
                        'Unidade': 'unidades',
                        'Preço': (Math.random() * 1000).toFixed(2),
                        'Fornecedor': 'Fornecedor ABC'
                    };
                    break;
                case 'equipamentos':
                    data = {
                        'Código': `EQ${String(i).padStart(3, '0')}`,
                        'Nome': `Equipamento ${i}`,
                        'Tipo': 'Escavadeira',
                        'Modelo': `Modelo ${i}`,
                        'Fabricante': 'Caterpillar',
                        'Número Série': `SN${i}${Date.now()}`,
                        'Status': 'ativo'
                    };
                    break;
            }

            if (!valid) {
                errors.push('Campo obrigatório em branco');
            }

            mockData.push({
                data,
                valid,
                errors: errors.length > 0 ? errors : null
            });
        }

        return mockData;
    }

    executeImport() {
        Utils.showNotification('Iniciando importação...', 'info');
        this.currentStep = 3;
        this.updateContent();

        // Simular importação
        setTimeout(() => {
            const validItems = this.previewData.filter(item => item.valid);
            this.importResults = {
                success: true,
                message: 'Dados importados com sucesso!',
                imported: validItems.length,
                updated: 0,
                errors: this.previewData.length - validItems.length,
                skipped: 0
            };
            this.updateContent();
            Utils.showNotification('Importação concluída!', 'success');
        }, 2000);
    }

    goToStep(step) {
        this.currentStep = step;
        this.updateContent();
    }

    updateContent() {
        const container = document.querySelector('.import-wizard');
        if (container) {
            container.innerHTML = `
                ${this.getStepsHTML()}
                ${this.getContentHTML()}
            `;
            this.bindEvents();
        }
    }

    reset() {
        this.uploadedFile = null;
        this.previewData = [];
        this.importResults = null;
        this.currentStep = 1;
        this.updateContent();
    }

    downloadTemplate() {
        const importType = document.getElementById('importType')?.value || 'pecas';
        Utils.showNotification(`Baixando modelo para ${importType}...`, 'info');
    }

    goToModule() {
        const importType = document.getElementById('importType')?.value || 'pecas';
        Utils.showNotification(`Redirecionando para ${importType}...`, 'info');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

window.ImportPage = ImportPage;


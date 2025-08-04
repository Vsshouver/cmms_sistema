// src/static/js/tires.js

// Aguarda a página carregar para associar o evento ao botão
document.addEventListener('DOMContentLoaded', () => {
    // Procura pelo botão "Novo Pneu". Ajuste o seletor se necessário.
    const btnNewTire = document.querySelector('#btnNewTire') || document.querySelector('[data-new-tire]');
    if (btnNewTire) {
        btnNewTire.addEventListener('click', openCreateTireModal);
    }
});

/**
 * Abre o modal de criação de pneu.
 */
function openCreateTireModal() {
    const modal = document.createElement('div');
    modal.classList.add('custom-modal-overlay');
    modal.innerHTML = `
        <div class="custom-modal">
            <h2>Cadastrar Pneu</h2>
            <form id="newTireForm">
                <label>Número de Série*</label>
                <input type="text" name="numero_serie" required />

                <label>Número de Fogo</label>
                <input type="text" name="numero_fogo" />

                <label>Marca*</label>
                <input type="text" name="marca" required />

                <label>Modelo*</label>
                <input type="text" name="modelo" required />

                <label>Medida* (ex.: 385/65R22.5)</label>
                <input type="text" name="medida" required />

                <label>Tipo*</label>
                <select name="tipo" required>
                    <option value="novo">Novo</option>
                    <option value="recapado">Recapado</option>
                </select>

                <label>Data de Compra*</label>
                <input type="date" name="data_compra" required />

                <label>Valor de Compra</label>
                <input type="number" name="valor_compra" step="0.01" />

                <label>Pressão Recomendada (PSI)</label>
                <input type="number" name="pressao_recomendada" step="0.01" />

                <label>Vida Útil Estimada (km)</label>
                <input type="number" name="vida_util_estimada" step="0.01" />

                <div class="form-actions">
                    <button type="submit">Salvar</button>
                    <button type="button" id="cancelNewTire">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Fecha o modal ao clicar em "Cancelar"
    modal.querySelector('#cancelNewTire').addEventListener('click', () => {
        modal.remove();
    });

    // Envia os dados para a API ao submeter o formulário
    modal.querySelector('#newTireForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {
            numero_serie: formData.get('numero_serie'),
            numero_fogo: formData.get('numero_fogo') || null,
            marca: formData.get('marca'),
            modelo: formData.get('modelo'),
            medida: formData.get('medida'),
            tipo: formData.get('tipo'),
            data_compra: formData.get('data_compra'),
            valor_compra: parseFloat(formData.get('valor_compra') || 0),
            pressao_recomendada: parseFloat(formData.get('pressao_recomendada') || 0),
            vida_util_estimada: parseFloat(formData.get('vida_util_estimada') || 0)
        };

        try {
            await API.tires.create(data);
            if (typeof Toast !== 'undefined') {
                Toast.success('Pneu cadastrado com sucesso!');
            }
            modal.remove();
            // Recarrega a lista de pneus chamando novamente a API
            // Você pode adicionar aqui uma função para atualizar a página sem recarregar tudo
            window.location.reload();
        } catch (error) {
            if (typeof Toast !== 'undefined') {
                Toast.error(error.message || 'Erro ao criar pneu.');
            }
            console.error(error);
        }
    });
}

// Estilos básicos do modal (pode ser movido para um arquivo CSS)
const modalStyle = document.createElement('style');
modalStyle.textContent = `
.custom-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
}
.custom-modal {
    background: #fff;
    padding: 20px;
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    border-radius: 4px;
}
.custom-modal h2 {
    margin-top: 0;
}
.custom-modal form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.custom-modal .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
.custom-modal button {
    padding: 6px 12px;
}
`;
document.head.appendChild(modalStyle);


document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "/api/itens";

    const form = document.getElementById("item-form");
    const tabela = document.getElementById("tabela-itens");
    const grupoSelect = document.getElementById("grupo_itens");

    function carregarGrupos() {
        if (!grupoSelect) return;
        API.itemGroups.getAll()
            .then(response => {
                const grupos = response.grupos_item || [];
                grupoSelect.innerHTML = '<option value="">Selecione um grupo</option>';
                grupos.forEach(grupo => {
                    const option = document.createElement('option');
                    option.value = grupo.nome;
                    option.textContent = grupo.nome;
                    option.dataset.id = grupo.id;
                    grupoSelect.appendChild(option);
                });
            })
            .catch(err => console.error('Erro ao carregar grupos de item:', err));
    }

    function carregarItens() {
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                tabela.innerHTML = "";
                data.forEach(item => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${item.numero_item}</td>
                        <td>${item.descricao_item}</td>
                        <td>${item.grupo_itens || ""}</td>
                        <td>${item.unidade_medida || ""}</td>
                        <td>${item.ultimo_preco_avaliacao || ""}</td>
                        <td>${item.ultimo_preco_compra || ""}</td>
                        <td>${item.estoque_baixo ? "Sim" : "Não"}</td>
                    `;
                    tabela.appendChild(row);
                });
            });
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const dados = {
                numero_item: form.numero_item.value,
                descricao_item: form.descricao_item.value,
                grupo_itens: form.grupo_itens.value,
                unidade_medida: form.unidade_medida.value,
                ultimo_preco_avaliacao: parseFloat(form.ultimo_preco_avaliacao.value) || null,
                ultimo_preco_compra: parseFloat(form.ultimo_preco_compra.value) || null,
                estoque_baixo: form.estoque_baixo.checked
            };

            fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            })
                .then(res => {
                    if (res.ok) {
                        form.reset();
                        carregarItens();
                    }
                });
        });
    }

    carregarGrupos();
    carregarItens();
});

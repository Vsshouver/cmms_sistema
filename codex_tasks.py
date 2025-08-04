"""
Script de auxílio para o Codex – Sistema CMMS
------------------------------------------------

Este módulo centraliza as tarefas pendentes do sistema CMMS em uma 
estrutura de dados organizada e define funções utilitárias para
listá‑las ou gerar saídas úteis para acompanhamento. A ideia é
facilitar a continuidade do desenvolvimento por outros
desenvolvedores ou por ferramentas automatizadas, como o Codex.

**Aviso:** este script **não** executa nenhuma alteração direta no
sistema ou no repositório GitHub. Em vez disso, ele expõe as
informações de maneira estruturada para que possam ser usadas em
outros contextos (por exemplo, para criar issues no GitHub ou
alimentar um gerenciador de tarefas). Sinta‑se livre para adaptar as
funções conforme as necessidades da sua equipe.

Uso:

```
python codex_tasks.py            # imprime todas as tarefas no console
python codex_tasks.py --json     # exporta as tarefas em formato JSON
```
"""

from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict


@dataclass
class Task:
    """Representa uma tarefa pendente no sistema CMMS."""

    title: str
    description: str
    module: str
    priority: str = "normal"
    status: str = "open"


def load_tasks() -> List[Task]:
    """Carrega a lista de tarefas pendentes.

    Este conjunto foi extraído manualmente do documento
    "Lista de Tarefas para o Codex – Sistema CMMS". Cada item
    corresponde a uma melhoria ou correção necessária.

    Returns:
        list[Task]: lista de objetos Task.
    """
    tasks: List[Task] = []

    # 1. Ordens de Serviço
    tasks.append(Task(
        title="Ativar modal de criação de Ordem de Serviço",
        description=(
            "O botão 'Nova OS' não abre o modal. Verificar se o elemento HTML possui "
            "o id correto (create-work-order) e se existe um container de modais "
            "(modals-container) no DOM. Ajustar o JavaScript em src/static/js/pages/"
            "ordens-servico.js para associar o evento de clique ao modal e testar."
        ),
        module="ordens_servico",
        priority="high",
    ))
    tasks.append(Task(
        title="Implementar edição de Ordens de Serviço",
        description=(
            "Permitir que registros existentes de ordens de serviço sejam editados. "
            "Isso requer um modal de edição semelhante ao de criação, pré‑preenchido "
            "com os dados da OS selecionada e uma rota API PUT /api/ordens-servico/<id>."
        ),
        module="ordens_servico",
    ))
    tasks.append(Task(
        title="Adicionar mudança de status às Ordens de Serviço",
        description=(
            "Criar uma interface (dropdown ou botões) para alterar o status da OS entre "
            "as etapas 'Aberta', 'Em Execução', 'Aguardando Peças', 'Concluída' e "
            "'Cancelada'. Deve chamar um endpoint PUT /api/ordens-servico/<id>/status."
        ),
        module="ordens_servico",
    ))
    tasks.append(Task(
        title="Associar peças às Ordens de Serviço",
        description=(
            "Implementar uma funcionalidade para adicionar ou remover peças utilizadas "
            "em uma OS. No backend, criar um endpoint POST /api/ordens-servico/<id>/pecas "
            "que receba o ID da peça e a quantidade."
        ),
        module="ordens_servico",
    ))
    tasks.append(Task(
        title="Calcular custos de Ordens de Serviço",
        description=(
            "Automatizar o cálculo de custos somando mão de obra e peças. Atualizar o campo "
            "'custo_total' da OS no fechamento (status 'Concluída')."
        ),
        module="ordens_servico",
    ))
    tasks.append(Task(
        title="Adicionar campo de assinatura digital",
        description=(
            "Permitir que o responsável assine digitalmente a OS usando um canvas de "
            "desenho. Converter a imagem para Base64 e armazenar no campo "
            "'assinatura_responsavel'."
        ),
        module="ordens_servico",
    ))
    tasks.append(Task(
        title="Gerar relatórios de Ordens de Serviço",
        description=(
            "Criar um endpoint GET /api/ordens-servico/<id>/relatorio que gere um PDF "
            "da OS usando bibliotecas como ReportLab ou FPDF2."
        ),
        module="ordens_servico",
    ))

    # 2. Equipamentos
    tasks.append(Task(
        title="Ativar modal de criação de Equipamento",
        description=(
            "O botão 'Novo Equipamento' não abre o modal. Ajustar o frontend para "
            "renderizar o modal e criar o formulário com os campos necessários."
        ),
        module="equipamentos",
        priority="high",
    ))
    tasks.append(Task(
        title="Implementar edição de Equipamentos",
        description=(
            "Permitir a alteração dos dados de um equipamento existente via modal de edição e "
            "rota API PUT /api/equipamentos/<id>."
        ),
        module="equipamentos",
    ))
    tasks.append(Task(
        title="Suporte a upload de fotos de equipamentos",
        description=(
            "Adicionar um campo de upload no formulário de criação/edição e criar um "
            "endpoint POST /api/equipamentos/<id>/upload_foto para salvar a imagem e "
            "armazenar o caminho no banco de dados."
        ),
        module="equipamentos",
    ))
    tasks.append(Task(
        title="Exibir histórico de manutenções de cada equipamento",
        description=(
            "Na tela de detalhes de um equipamento, listar todas as ordens de serviço associadas "
            "a ele, com data, status e custo."
        ),
        module="equipamentos",
    ))
    tasks.append(Task(
        title="Controle de horímetro do equipamento",
        description=(
            "Permitir registrar o valor do horímetro periodicamente e usar esses dados para "
            "agendar manutenções preventivas."
        ),
        module="equipamentos",
    ))
    tasks.append(Task(
        title="Agendamento de manutenções preventivas",
        description=(
            "Adicionar um módulo para configurar manutenções preventivas com base em intervalo de dias "
            "ou horas de uso (horímetro)."
        ),
        module="equipamentos",
    ))

    # 3. Peças e Estoque
    tasks.append(Task(
        title="Ativar modal de criação de Peça",
        description=(
            "O botão 'Nova Peça' não abre o modal. Criar o formulário de peças e associar ao evento de clique."
        ),
        module="pecas_estoque",
        priority="high",
    ))
    tasks.append(Task(
        title="Implementar edição de Peças",
        description="Permitir alterar os dados de peças via modal e rota API PUT /api/pecas/<id>.",
        module="pecas_estoque",
    ))
    tasks.append(Task(
        title="Registrar movimentações de estoque (entrada, saída, transferência)",
        description=(
            "Utilizar o modelo MovimentacaoEstoque para lançar entradas e saídas de peças e criar "
            "um formulário específico para cada tipo de movimentação."
        ),
        module="pecas_estoque",
    ))
    tasks.append(Task(
        title="Controle de estoque mínimo com alertas",
        description="Gerar alertas quando a quantidade de uma peça ficar abaixo do valor mínimo estabelecido.",
        module="pecas_estoque",
    ))
    tasks.append(Task(
        title="Importação em lote de peças",
        description=(
            "Criar um endpoint POST /api/importar_pecas que aceite arquivos CSV/Excel e "
            "insira os dados no banco de dados."
        ),
        module="pecas_estoque",
    ))
    tasks.append(Task(
        title="Relatórios de estoque",
        description="Gerar relatórios de inventário, peças em baixo estoque e histórico de movimentações.",
        module="pecas_estoque",
    ))
    tasks.append(Task(
        title="Cadastrar e associar fornecedores às peças",
        description=(
            "Criar um modelo Fornecedor e endpoints CRUD, permitindo associar cada peça a um ou mais fornecedores."
        ),
        module="pecas_estoque",
    ))

    # 4. Mecânicos
    tasks.append(Task(
        title="Ativar modal de criação de Mecânico",
        description="Habilitar o botão 'Novo Mecânico' e criar o formulário correspondente.",
        module="mecanicos",
        priority="high",
    ))
    tasks.append(Task(
        title="Implementar edição de Mecânicos",
        description="Permitir alterar informações dos mecânicos via modal e rota API PUT /api/mecanicos/<id>.",
        module="mecanicos",
    ))
    tasks.append(Task(
        title="Adicionar controle de disponibilidade dos mecânicos",
        description="Registrar status de disponibilidade (disponível, ocupado, férias) e filtrar OS por mecânico disponível.",
        module="mecanicos",
    ))
    tasks.append(Task(
        title="Exibir histórico de serviços dos mecânicos",
        description="Listar todas as OS concluídas por cada mecânico e permitir avaliações de performance.",
        module="mecanicos",
    ))
    tasks.append(Task(
        title="Avaliação de performance dos mecânicos",
        description="Implementar um campo de avaliação (numérico ou textual) e um formulário para gestores avaliarem o desempenho.",
        module="mecanicos",
    ))

    # 5. Módulos Ausentes
    tasks.append(Task(
        title="Criar módulo de Tipos de Manutenção",
        description=(
            "Adicionar modelo tipo_manutencao.py, rotas CRUD (src/routes/tipos_manutencao.py) e página no frontend."
        ),
        module="tipos_manutencao",
    ))
    tasks.append(Task(
        title="Criar módulo de Análise de Óleo",
        description=(
            "Adicionar modelo analise_oleo.py, rotas CRUD (src/routes/analise_oleo.py) e página correspondente."
        ),
        module="analise_oleo",
    ))
    tasks.append(Task(
        title="Criar módulo de Tipos de Equipamento",
        description=(
            "Adicionar modelo tipo_equipamento.py, rotas CRUD (src/routes/tipos_equipamento.py) e página no frontend."
        ),
        module="tipos_equipamento",
    ))
    tasks.append(Task(
        title="Criar módulo de Grupos de Item",
        description=(
            "Adicionar modelo grupo_item.py, rotas CRUD (src/routes/grupos_item.py) e página no frontend."
        ),
        module="grupos_item",
    ))
    tasks.append(Task(
        title="Completar módulo de Movimentações de Estoque",
        description=(
            "Garantir que o modelo MovimentacaoEstoque esteja completo, criar rotas de listagem e cadastro "
            "de movimentações e adicionar a página frontend correspondente."
        ),
        module="movimentacoes_estoque",
    ))
    tasks.append(Task(
        title="Implementar importação de peças (frontend)",
        description=(
            "Desenvolver a página src/static/js/pages/importacao-pecas.js para envio de arquivos ao endpoint "
            "de importação em lote."
        ),
        module="importacao_pecas",
    ))

    # 6. Dashboard e Relatórios
    tasks.append(Task(
        title="Construir dashboard com KPIs",
        description=(
            "No backend, adicionar rotas que agreguem dados de OS, equipamentos e estoque. No frontend, utilizar "
            "bibliotecas como Chart.js para exibir gráficos e indicadores."
        ),
        module="dashboard",
    ))
    tasks.append(Task(
        title="Criar relatórios gerais em PDF",
        description=(
            "Desenvolver geração de relatórios em PDF para OS, estoque e performance dos mecânicos usando ReportLab ou FPDF2."
        ),
        module="relatorios",
    ))

    # 7. Melhorias de UX/UI
    tasks.append(Task(
        title="Adicionar validação client‑side e server‑side",
        description="Utilizar HTML5 e JavaScript para validar formulários, além de validações no Flask antes de gravar dados.",
        module="ux_ui",
    ))
    tasks.append(Task(
        title="Implementar estados de carregamento e feedback",
        description="Mostrar spinners ou mensagens durante carregamentos e usar Toasts para sucesso/erro de forma consistente.",
        module="ux_ui",
    ))
    tasks.append(Task(
        title="Garantir responsividade da interface",
        description="Revisar o CSS para adaptação a diferentes tamanhos de tela, garantindo usabilidade em dispositivos móveis.",
        module="ux_ui",
    ))

    # 8. Funcionalidades Avançadas
    tasks.append(Task(
        title="Implementar sistema de notificações em tempo real",
        description=(
            "Usar WebSockets para alertar sobre estoque baixo, novas OS, alterações de status, etc."
        ),
        module="avancado",
    ))
    tasks.append(Task(
        title="Configurar backup automático do banco de dados",
        description="Agendar tarefas no servidor para criar cópias de segurança periódicas do banco de dados.",
        module="avancado",
    ))
    tasks.append(Task(
        title="Adicionar logs de auditoria",
        description="Registrar todas as ações dos usuários em uma tabela de log para rastreabilidade.",
        module="avancado",
    ))
    tasks.append(Task(
        title="Planejar integrações com sistemas externos",
        description="Criar APIs ou webhooks para comunicação com ERPs, sistemas de RH ou aplicativos móveis.",
        module="avancado",
    ))

    return tasks


def print_tasks(tasks: List[Task]) -> None:
    """Imprime as tarefas em formato legível."""
    for i, task in enumerate(tasks, 1):
        print(f"{i}. [{task.module}] {task.title} (prioridade: {task.priority}, status: {task.status})")
        print(f"   → {task.description}\n")


def export_tasks_json(tasks: List[Task]) -> str:
    """Retorna as tarefas em formato JSON."""
    return json.dumps([asdict(t) for t in tasks], ensure_ascii=False, indent=2)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Gerenciador de tarefas pendentes do sistema CMMS.")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Exporta as tarefas em formato JSON em vez de imprimi‑las."
    )
    args = parser.parse_args()

    all_tasks = load_tasks()
    if args.json:
        print(export_tasks_json(all_tasks))
    else:
        print_tasks(all_tasks)

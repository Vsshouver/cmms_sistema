# CHANGELOG - Sistema CMMS

## Versão 2.0.0 - Melhorias e Novos Módulos

### 🐛 Correções de Bugs

#### 1. Modal de Criação de Equipamentos
- **Problema**: Erro "types.map is not a function" ao abrir modal
- **Solução**: Corrigido tratamento de dados da API de tipos de equipamento
- **Arquivo**: `src/static/js/pages/equipamentos.js`

#### 2. Modal de Criação de Peças
- **Problema**: Erro similar ao carregar grupos de item
- **Solução**: Implementado tratamento adequado de resposta da API
- **Arquivo**: `src/static/js/pages/estoque.js`

#### 3. Inicialização do Banco de Dados
- **Problema**: Erros de relacionamento entre tabelas
- **Solução**: Corrigidos campos obrigatórios e relacionamentos
- **Arquivos**: `init_db.py`, modelos diversos

### 🆕 Novos Módulos

#### 1. Módulo de Programação de Preventivas

**Funcionalidades:**
- Criação de planos de manutenção preventiva
- Múltiplos critérios de disparo (tempo, horímetro, quilometragem)
- Cálculo automático de próximas execuções
- Geração automática de ordens de serviço
- Interface moderna com filtros avançados
- Estatísticas em tempo real

**Arquivos Criados:**
- `src/models/plano_preventiva.py` - Modelo de dados
- `src/routes/planos_preventiva.py` - API REST
- `src/static/preventivas.html` - Interface web
- `src/static/js/pages/preventivas.js` - Lógica frontend
- `src/static/css/preventivas.css` - Estilos

**Endpoints da API:**
- `GET /api/planos-preventiva` - Listar planos
- `POST /api/planos-preventiva` - Criar plano
- `PUT /api/planos-preventiva/{id}` - Atualizar plano
- `DELETE /api/planos-preventiva/{id}` - Excluir plano
- `POST /api/planos-preventiva/{id}/executar` - Executar plano
- `POST /api/planos-preventiva/gerar-os-pendentes` - Gerar OS em lote

#### 2. Módulo de Controle de Backlog

**Funcionalidades:**
- Gestão de itens de backlog de manutenção
- Sistema de priorização inteligente (urgência x impacto)
- Controle de fluxo de trabalho (identificado → aprovado → execução → concluído)
- Estimativas de esforço e custo
- Alertas visuais para itens críticos e atrasados
- Relatórios e estatísticas

**Arquivos Criados:**
- `src/models/backlog_item.py` - Modelo de dados
- `src/routes/backlog.py` - API REST
- `src/static/backlog.html` - Interface web
- `src/static/js/pages/backlog.js` - Lógica frontend
- `src/static/css/backlog.css` - Estilos

**Endpoints da API:**
- `GET /api/backlog` - Listar itens
- `POST /api/backlog` - Criar item
- `PUT /api/backlog/{id}` - Atualizar item
- `DELETE /api/backlog/{id}` - Excluir item
- `GET /api/backlog/stats` - Estatísticas
- `POST /api/backlog/priorizar` - Recalcular priorização
- `POST /api/backlog/{id}/iniciar` - Iniciar item
- `POST /api/backlog/{id}/concluir` - Concluir item

### 🔧 Melhorias Técnicas

#### 1. Estrutura do Banco de Dados
- Adicionadas tabelas `planos_preventiva` e `backlog_items`
- Relacionamentos com equipamentos e ordens de serviço
- Campos para controle de datas e status

#### 2. API REST
- Novos endpoints para os módulos
- Validações de dados aprimoradas
- Tratamento de erros padronizado
- Suporte a filtros e paginação

#### 3. Interface do Usuário
- Design responsivo e moderno
- Componentes reutilizáveis
- Feedback visual aprimorado
- Navegação intuitiva

#### 4. Integração com Sistema Existente
- Menus atualizados com novos módulos
- APIs integradas ao sistema de autenticação
- Consistência visual mantida

### 📋 Como Usar os Novos Módulos

#### Planos de Preventiva

1. **Acesso**: Menu Manutenção → Preventivas
2. **Criar Plano**: Clique em "Novo Plano"
3. **Configurar Critérios**: Defina intervalos por dias, horas ou km
4. **Gerar OS**: Use "Gerar OS Pendentes" para criar ordens automaticamente

#### Controle de Backlog

1. **Acesso**: Menu Manutenção → Backlog
2. **Criar Item**: Clique em "Novo Item"
3. **Priorizar**: Sistema calcula automaticamente ou use "Recalcular Priorização"
4. **Fluxo**: Aprove → Inicie → Conclua itens conforme necessário

### 🚀 Próximas Versões

**Sugestões para futuras melhorias:**
- Dashboard com KPIs de manutenção
- Relatórios avançados em PDF
- Integração com sistemas externos
- App mobile para mecânicos
- Notificações por email/SMS

### 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este changelog
2. Consulte a documentação da API
3. Entre em contato com a equipe de desenvolvimento

---

**Data da Versão**: 04/08/2025  
**Desenvolvido por**: Equipe CMMS  
**Compatibilidade**: Python 3.11+, Flask 2.0+


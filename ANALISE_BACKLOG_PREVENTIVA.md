# Análise da Relação entre Backlog e Preventiva

## Situação Atual

### Módulo Backlog
- **Propósito**: Gerenciar itens de trabalho pendentes (manutenções, melhorias, projetos)
- **Características**:
  - Sistema de priorização por score
  - Categorias: manutenção, melhoria, projeto, emergência
  - Tipos: preventiva, corretiva, preditiva, upgrade
  - Status: identificado, analisado, aprovado, em_execucao, concluido, cancelado
  - Relacionamento opcional com equipamentos e ordens de serviço

### Módulo Preventiva
- **Propósito**: Gerenciar planos de manutenção preventiva programada
- **Características**:
  - Critérios de disparo: horas, dias, quilometragem
  - Geração automática de ordens de serviço
  - Cálculo de próxima execução
  - Relacionamento obrigatório com equipamentos e tipos de manutenção

## Problemas Identificados

1. **Sobreposição de Funcionalidades**:
   - Ambos podem criar ordens de serviço de manutenção preventiva
   - Backlog tem tipo "preventiva" que conflita com o módulo Preventiva

2. **Confusão de Responsabilidades**:
   - Não está claro quando usar Backlog vs Preventiva para manutenções preventivas
   - Usuários podem duplicar trabalho entre os dois módulos

3. **Relacionamentos Inconsistentes**:
   - Backlog pode referenciar ordens de serviço, mas não há integração clara
   - Preventiva gera OSs automaticamente, mas não se conecta com Backlog

## Solução Proposta

### 1. Separação Clara de Responsabilidades

**Módulo Preventiva**:
- Manutenções preventivas PROGRAMADAS (baseadas em critérios automáticos)
- Planos recorrentes com intervalos definidos
- Geração automática de OSs

**Módulo Backlog**:
- Manutenções preventivas AD-HOC (identificadas manualmente)
- Melhorias e projetos
- Emergências e correções
- Itens que precisam de análise e aprovação

### 2. Integração entre os Módulos

**Fluxo Proposto**:
1. Preventiva gera OS automaticamente
2. Se a OS não for executada no prazo, pode ser promovida para Backlog
3. Backlog pode referenciar planos preventivos para melhorias
4. Conclusão de itens do Backlog pode atualizar planos preventivos

### 3. Ajustes Necessários

**No Backlog**:
- Remover tipo "preventiva" ou renomear para "preventiva_adhoc"
- Adicionar relacionamento com PlanoPreventiva
- Criar fluxo de promoção de OSs atrasadas

**Na Preventiva**:
- Adicionar flag para indicar se OS foi promovida para Backlog
- Melhorar integração com sistema de priorização

**Nas Ordens de Serviço**:
- Adicionar campo para indicar origem (preventiva_automatica, preventiva_adhoc, backlog)
- Melhorar rastreabilidade entre OS e seus originadores


"""create tabela itens

Revision ID: 0c280a00006a
Revises: 3b76d7e3f1a2
Create Date: 2025-08-05 18:51:11.715682

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c280a00006a'
down_revision: Union[str, Sequence[str], None] = '3b76d7e3f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'itens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('codigo', sa.String(length=50), nullable=False),
        sa.Column('nome', sa.String(length=255), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('unidade_medida', sa.String(length=20), nullable=True),
        sa.Column('grupo', sa.String(length=100), nullable=True),
        sa.Column('fabricante', sa.String(length=100), nullable=True),
        sa.Column('criado_em', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('atualizado_em', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo')
    )
    op.create_index(op.f('ix_itens_id'), 'itens', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_itens_id'), table_name='itens')
    op.drop_table('itens')

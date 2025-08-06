"""add item_id to pneus

Revision ID: 154126f4fb1b
Revises: c88aaf0732bc
Create Date: 2025-08-06 14:48:22.219084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '154126f4fb1b'
down_revision: Union[str, Sequence[str], None] = 'c88aaf0732bc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)
    if 'pneus' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('pneus')]
        if 'item_id' not in columns:
            op.add_column('pneus', sa.Column('item_id', sa.Integer(), nullable=False))
            op.create_foreign_key('fk_pneus_item_id_itens', 'pneus', 'itens', ['item_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = inspect(bind)
    if 'pneus' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('pneus')]
        if 'item_id' in columns:
            op.drop_constraint('fk_pneus_item_id_itens', 'pneus', type_='foreignkey')
            op.drop_column('pneus', 'item_id')

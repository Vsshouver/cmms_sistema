"""add plano_preventiva_id to backlog_items

Revision ID: 3b76d7e3f1a2
Revises: bbd5a2b91492
Create Date: 2025-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b76d7e3f1a2'
down_revision: Union[str, Sequence[str], None] = 'bbd5a2b91492'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('backlog_items') as batch_op:
        batch_op.add_column(sa.Column('plano_preventiva_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_backlog_items_plano_preventiva',
            'planos_preventiva',
            ['plano_preventiva_id'],
            ['id']
        )


def downgrade() -> None:
    with op.batch_alter_table('backlog_items') as batch_op:
        batch_op.drop_constraint('fk_backlog_items_plano_preventiva', type_='foreignkey')
        batch_op.drop_column('plano_preventiva_id')


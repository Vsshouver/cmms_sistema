"""add data_registro to pecas

Revision ID: 1f2ad21e0c25
Revises: 3b76d7e3f1a2
Create Date: 2025-01-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1f2ad21e0c25'
down_revision = '3b76d7e3f1a2'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('pecas', sa.Column('data_registro', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('pecas', 'data_registro')

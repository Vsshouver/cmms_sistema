"""create tabela itens"""

revision = "e5963818dfc8"
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table('itens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('numero_item', sa.String(length=50), nullable=False),
        sa.Column('descricao_item', sa.Text(), nullable=False),
        sa.Column('grupo_itens', sa.String(length=100), nullable=True),
        sa.Column('unidade_medida', sa.String(length=20), nullable=True),
        sa.Column('ultimo_preco_avaliacao', sa.Numeric(12, 2), nullable=True),
        sa.Column('ultimo_preco_compra', sa.Numeric(12, 2), nullable=True),
        sa.Column('estoque_baixo', sa.Boolean(), nullable=True),
        sa.Column('data_registro', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('numero_item')
    )


def downgrade():
    op.drop_table('itens')

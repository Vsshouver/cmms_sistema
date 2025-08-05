"""merge heads 0c280a00006a and 1f2ad21e0c25

Revision ID: e266aade2cf3
Revises: 0c280a00006a, 1f2ad21e0c25
Create Date: 2023-08-05 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e266aade2cf3'
down_revision: Union[str, Sequence[str], None] = ('0c280a00006a', '1f2ad21e0c25')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass

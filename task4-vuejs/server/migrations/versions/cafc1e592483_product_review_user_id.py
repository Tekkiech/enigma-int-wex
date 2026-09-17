"""product review user id

Revision ID: cafc1e592483
Revises: 7ee5a3c6b1b7
Create Date: 2026-09-17 12:46:32.279731

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cafc1e592483'
down_revision: Union[str, None] = '7ee5a3c6b1b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # SQLite can't ALTER TABLE ADD CONSTRAINT directly - batch mode
    # rebuilds the table instead, which is the standard workaround.
    with op.batch_alter_table('product_review') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_product_review_user_id', 'user', ['user_id'], ['id'])


def downgrade() -> None:
    with op.batch_alter_table('product_review') as batch_op:
        batch_op.drop_constraint('fk_product_review_user_id', type_='foreignkey')
        batch_op.drop_column('user_id')

"""add user profile fields (age_group, budget)

Revision ID: 001
Revises:
Create Date: 2026-03-22
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = '000'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('age_group', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('budget', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'budget')
    op.drop_column('users', 'age_group')

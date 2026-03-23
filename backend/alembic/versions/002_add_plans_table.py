"""add plans table

Revision ID: 002
Revises: 001
Create Date: 2026-03-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'plans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trip_id', sa.UUID(), nullable=False),
        sa.Column('content', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('trip_id'),
    )
    op.create_index('ix_plans_trip_id', 'plans', ['trip_id'])


def downgrade() -> None:
    op.drop_index('ix_plans_trip_id', table_name='plans')
    op.drop_table('plans')

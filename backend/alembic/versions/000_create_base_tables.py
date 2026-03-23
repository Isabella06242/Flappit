"""create base tables (users, trips, notes, pins)

Revision ID: 000
Revises:
Create Date: 2026-03-22
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(64), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=True)

    op.create_table(
        'trips',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('owner_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('cover_image_url', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_trips_owner_id', 'trips', ['owner_id'])

    op.create_table(
        'notes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trip_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False, server_default='Untitled note'),
        sa.Column('content', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notes_trip_id', 'notes', ['trip_id'])

    op.create_table(
        'pins',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('trip_id', sa.UUID(), nullable=False),
        sa.Column('note_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('place_id', sa.String(255), nullable=True),
        sa.Column('color', sa.String(16), nullable=False, server_default='#FF6B6B'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_pins_trip_id', 'pins', ['trip_id'])


def downgrade() -> None:
    op.drop_table('pins')
    op.drop_table('notes')
    op.drop_table('trips')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_table('users')

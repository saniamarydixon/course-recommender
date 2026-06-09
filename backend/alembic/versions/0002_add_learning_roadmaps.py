"""add learning roadmap tables

Revision ID: 0002_add_learning_roadmaps
Revises: 
Create Date: 2026-06-09 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_learning_roadmaps"
down_revision = None
branch_labels = None
default_branch = None


def upgrade() -> None:
    op.create_table(
        "learning_roadmaps",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill", sa.String(length=100), nullable=False),
        sa.Column("target_level", sa.String(length=50), nullable=False),
        sa.Column("timeline", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "roadmap_steps",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("roadmap_id", sa.Integer(), sa.ForeignKey("learning_roadmaps.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("estimated_hours", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="not_started"),
        sa.Column("prerequisites", sa.String(length=250), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("roadmap_steps")
    op.drop_table("learning_roadmaps")

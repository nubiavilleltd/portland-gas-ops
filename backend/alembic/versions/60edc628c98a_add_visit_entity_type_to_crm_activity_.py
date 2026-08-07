from alembic import op

revision = "60edc628c98a"
down_revision = "07bef76a1376"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        ALTER TABLE crm_activity_log
        MODIFY COLUMN entity_type
        ENUM(
            'customer',
            'contact',
            'visit'
        ) NOT NULL;
    """)


def downgrade():
    op.execute("""
        ALTER TABLE crm_activity_log
        MODIFY COLUMN entity_type
        ENUM(
            'customer',
            'contact'
        ) NOT NULL;
    """)
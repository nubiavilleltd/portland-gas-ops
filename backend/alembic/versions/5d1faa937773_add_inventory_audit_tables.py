"""add inventory and audit tables

Revision ID: 5d1faa937773
Revises: e3f4a5b6c7d8
Create Date: 2026-06-29 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '5d1faa937773'
down_revision: Union[str, None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # ── warehouse_locations ───────────────────────────────────────────────────
    op.create_table(
        'warehouse_locations',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('name', name='uq_warehouse_locations_name'),
    )
    op.create_index('idx_locations_default', 'warehouse_locations', ['is_default'])

    # ── inventory_items ───────────────────────────────────────────────────────
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('product_id', mysql.CHAR(36), nullable=False),
        sa.Column('tag_number', sa.String(100), nullable=False),
        sa.Column('serial_number', sa.String(100), nullable=True),
        sa.Column('status', sa.Enum(
            'available', 'reserved', 'checked_out', 'with_customer',
            'maintenance', 'retired', 'returned',
            name='inventoryitemstatus'
        ), nullable=False, server_default='available'),
        sa.Column('condition', sa.Enum(
            'new', 'used', 'refurbished', 'damaged',
            name='inventoryitemcondition'
        ), nullable=False, server_default='new'),
        sa.Column('disposition', sa.Enum('sold', 'loaned', name='invdispositionstatus'), nullable=True),
        sa.Column('location_id', sa.Integer, nullable=False),
        sa.Column('order_id', mysql.CHAR(36), nullable=True),
        sa.Column('customer_id', mysql.CHAR(36), nullable=True),
        sa.Column('checked_out_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expected_return_date', sa.Date, nullable=True),
        sa.Column('received_at', sa.Date, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('tag_number', name='uq_inventory_items_tag_number'),
    )
    op.create_index('idx_inv_product', 'inventory_items', ['product_id'])
    op.create_index('idx_inv_status', 'inventory_items', ['status'])
    op.create_index('idx_inv_location', 'inventory_items', ['location_id'])

    # ── consumable_stock ──────────────────────────────────────────────────────
    op.create_table(
        'consumable_stock',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('product_id', mysql.CHAR(36), nullable=False),
        sa.Column('location_id', sa.Integer, nullable=False),
        sa.Column('quantity', sa.Numeric(15, 3), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('product_id', 'location_id', name='idx_cstock_unique'),
    )
    op.create_index('idx_cstock_product', 'consumable_stock', ['product_id'])
    op.create_index('idx_cstock_location', 'consumable_stock', ['location_id'])

    # ── stock_movements ───────────────────────────────────────────────────────
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('product_id', mysql.CHAR(36), nullable=False),
        sa.Column('movement_type', sa.Enum(
            'check_in', 'check_out', 'reservation', 'return', 'adjustment',
            name='movementtype'
        ), nullable=False),
        sa.Column('quantity', sa.Numeric(15, 3), nullable=False),
        sa.Column('reference_id', sa.String(36), nullable=True),
        sa.Column('reference_type', sa.Enum(
            'order', 'trip', 'purchase_order', 'manual',
            name='referencetype'
        ), nullable=True),
        sa.Column('location_id', sa.Integer, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('recorded_by', mysql.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['location_id'], ['warehouse_locations.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT'),
    )
    op.create_index('idx_smov_product', 'stock_movements', ['product_id'])
    op.create_index('idx_smov_type', 'stock_movements', ['movement_type'])
    op.create_index('idx_smov_reference', 'stock_movements', ['reference_id', 'reference_type'])
    op.create_index('idx_smov_location', 'stock_movements', ['location_id'])
    op.create_index('idx_smov_recorded_by', 'stock_movements', ['recorded_by'])
    op.create_index('idx_smov_created_at', 'stock_movements', ['created_at'])

    # ── stock_movement_items ──────────────────────────────────────────────────
    op.create_table(
        'stock_movement_items',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('movement_id', sa.Integer, nullable=False),
        sa.Column('inventory_item_id', sa.Integer, nullable=False),
        sa.ForeignKeyConstraint(['movement_id'], ['stock_movements.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='RESTRICT'),
    )
    op.create_index('idx_smi_movement', 'stock_movement_items', ['movement_id'])
    op.create_index('idx_smi_item', 'stock_movement_items', ['inventory_item_id'])

    # ── order_item_inventory ──────────────────────────────────────────────────
    op.create_table(
        'order_item_inventory',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('order_item_id', sa.Integer, nullable=False),
        sa.Column('inventory_item_id', sa.Integer, nullable=False),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventory_items.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('order_item_id', 'inventory_item_id', name='idx_oii_unique'),
    )
    op.create_index('idx_oii_order_item', 'order_item_inventory', ['order_item_id'])
    op.create_index('idx_oii_inventory_item', 'order_item_inventory', ['inventory_item_id'])

    # ── audit_log ─────────────────────────────────────────────────────────────
    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('entity_type', sa.Enum(
            'order', 'trip', 'invoice', 'inventory_item',
            name='auditentitytype'
        ), nullable=False),
        sa.Column('entity_id', sa.String(36), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('actor_type', sa.Enum(
            'employee', 'system', 'customer',
            name='auditactortype'
        ), nullable=False),
        sa.Column('actor_employee_id', sa.String(36), nullable=True),
        sa.Column('actor_name', sa.String(255), nullable=True),
        sa.Column('metadata', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('idx_audit_entity', 'audit_log', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_action', 'audit_log', ['action'])
    op.create_index('idx_audit_actor', 'audit_log', ['actor_type', 'actor_employee_id'])
    op.create_index('idx_audit_created', 'audit_log', ['created_at'])

    # ── seed default warehouse location ───────────────────────────────────────
    op.execute(
        "INSERT INTO warehouse_locations (name, address, is_default) "
        "VALUES ('Main Warehouse', 'Portland Gas Depot, Lagos', 1)"
    )


def downgrade() -> None:
    op.drop_table('audit_log')
    op.drop_table('order_item_inventory')
    op.drop_table('stock_movement_items')
    op.drop_table('stock_movements')
    op.drop_table('consumable_stock')
    op.drop_table('inventory_items')
    op.drop_table('warehouse_locations')
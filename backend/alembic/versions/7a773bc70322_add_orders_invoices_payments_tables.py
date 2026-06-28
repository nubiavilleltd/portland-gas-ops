"""add orders invoices payments tables

Revision ID: 7a773bc70322
Revises: add_product_no_001
Create Date: 2026-06-27 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision: str = '7a773bc70322'
down_revision: Union[str, None] = 'cee7c8c40f73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── orders ────────────────────────────────────────────────────────────────
    op.create_table(
        'orders',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('order_no', sa.String(50), nullable=True),
        sa.Column('customer_id', mysql.CHAR(36), nullable=False),
        sa.Column('order_status', sa.Enum(
            'draft', 'submitted', 'confirmed', 'completed', 'cancelled',
            name='orderstatus'
        ), nullable=False, server_default='draft'),
        sa.Column('fulfillment_status', sa.Enum(
            'pending', 'assigned', 'dispatched', 'in_transit', 'delivered', 'failed',
            name='fulfillmentstatus'
        ), nullable=False, server_default='pending'),
        sa.Column('payment_status', sa.Enum(
            'unpaid', 'partially_paid', 'paid', 'overdue', 'void',
            name='paymentstatus'
        ), nullable=False, server_default='unpaid'),
        sa.Column('delivery_address', sa.Text, nullable=False),
        sa.Column('delivery_date', sa.Date, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=False, server_default='0'),
        sa.Column('cancellation_reason', sa.Text, nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('trip_id', mysql.CHAR(36), nullable=True),
        sa.Column('invoice_id', mysql.CHAR(36), nullable=True),
        sa.Column('confirmed_by', mysql.CHAR(36), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', mysql.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['confirmed_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_orders_order_no', 'orders', ['order_no'], unique=True)
    op.create_index('ix_orders_customer_id', 'orders', ['customer_id'])
    op.create_index('ix_orders_order_status', 'orders', ['order_status'])
    op.create_index('ix_orders_fulfillment_status', 'orders', ['fulfillment_status'])
    op.create_index('ix_orders_payment_status', 'orders', ['payment_status'])

    # ── order_items ───────────────────────────────────────────────────────────
    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('order_id', mysql.CHAR(36), nullable=False),
        sa.Column('product_id', mysql.CHAR(36), nullable=False),
        sa.Column('product_name', sa.String(255), nullable=False),
        sa.Column('quantity', sa.Numeric(10, 3), nullable=False),
        sa.Column('unit_price', sa.Numeric(15, 2), nullable=False),
        sa.Column('total', sa.Numeric(15, 2), nullable=False),
        sa.Column('disposition', sa.Enum('sold', 'loaned', name='dispositionstatus'), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'])
    op.create_index('ix_order_items_product_id', 'order_items', ['product_id'])

    # ── invoices ──────────────────────────────────────────────────────────────
    op.create_table(
        'invoices',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('invoice_no', sa.String(50), nullable=True),
        sa.Column('order_id', mysql.CHAR(36), nullable=False),
        sa.Column('total_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('status', sa.Enum(
            'unpaid', 'partially_paid', 'paid', 'overdue', 'void',
            name='invoicestatus'
        ), nullable=False, server_default='unpaid'),
        sa.Column('issued_date', sa.Date, nullable=False),
        sa.Column('due_date', sa.Date, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_by', mysql.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', name='uq_invoices_order_id'),
    )
    op.create_index('ix_invoices_invoice_no', 'invoices', ['invoice_no'], unique=True)
    op.create_index('ix_invoices_order_id', 'invoices', ['order_id'])
    op.create_index('ix_invoices_status', 'invoices', ['status'])

    # ── payments ──────────────────────────────────────────────────────────────
    op.create_table(
        'payments',
        sa.Column('id', mysql.CHAR(36), nullable=False),
        sa.Column('payment_no', sa.String(50), nullable=True),
        sa.Column('invoice_id', mysql.CHAR(36), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('method', sa.Enum(
            'bank_transfer', 'cash', 'card', 'cheque',
            name='paymentmethod'
        ), nullable=False),
        sa.Column('payment_date', sa.Date, nullable=False),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('idempotency_key', sa.String(100), nullable=True),
        sa.Column('recorded_by', mysql.CHAR(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['recorded_by'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_payments_payment_no', 'payments', ['payment_no'], unique=True)
    op.create_index('ix_payments_invoice_id', 'payments', ['invoice_id'])
    op.create_index('ix_payments_reference', 'payments', ['reference'], unique=True)
    op.create_index('ix_payments_idempotency_key', 'payments', ['idempotency_key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_payments_idempotency_key', table_name='payments')
    op.drop_index('ix_payments_reference', table_name='payments')
    op.drop_index('ix_payments_invoice_id', table_name='payments')
    op.drop_index('ix_payments_payment_no', table_name='payments')
    op.drop_table('payments')

    op.drop_index('ix_invoices_status', table_name='invoices')
    op.drop_index('ix_invoices_order_id', table_name='invoices')
    op.drop_index('ix_invoices_invoice_no', table_name='invoices')
    op.drop_table('invoices')

    op.drop_index('ix_order_items_product_id', table_name='order_items')
    op.drop_index('ix_order_items_order_id', table_name='order_items')
    op.drop_table('order_items')

    op.drop_index('ix_orders_payment_status', table_name='orders')
    op.drop_index('ix_orders_fulfillment_status', table_name='orders')
    op.drop_index('ix_orders_order_status', table_name='orders')
    op.drop_index('ix_orders_customer_id', table_name='orders')
    op.drop_index('ix_orders_order_no', table_name='orders')
    op.drop_table('orders')
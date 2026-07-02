"""add fleet tables (drivers, vehicles, trips, trip_orders)

Revision ID: 39ab6d6c37f0
Revises: 5d1faa937773
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

revision = '39ab6d6c37f0'
down_revision = '5d1faa937773'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'drivers',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('employee_id', mysql.CHAR(36), nullable=False),
        sa.Column('license_number', sa.String(100), nullable=False),
        sa.Column('license_expiry_date', sa.Date, nullable=False),
        sa.Column('experience_years', sa.Integer, nullable=False, server_default='0'),
        sa.Column('profile_image_document_id', sa.Integer, nullable=True),
        sa.Column('status', sa.Enum('available','assigned','in_transit','off_duty','suspended', name='driverstatus'),
                  nullable=False, server_default='available'),
        sa.Column('current_trip_id', sa.Integer, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['profile_image_document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('employee_id', name='idx_drivers_employee'),
        sa.UniqueConstraint('license_number', name='uq_drivers_license'),
    )
    op.create_index('idx_drivers_status', 'drivers', ['status'])
    op.create_index('idx_drivers_license_expiry', 'drivers', ['license_expiry_date'])

    op.create_table(
        'vehicles',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('vehicle_no', sa.String(50), nullable=True),
        sa.Column('plate_number', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.Enum('lpg_tanker','delivery_van','service_truck','emergency_unit', name='vehicletype'), nullable=False),
        sa.Column('make', sa.String(100), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('year', sa.Integer, nullable=True),
        sa.Column('capacity', sa.Numeric(10,2), nullable=True),
        sa.Column('fuel_type', sa.String(50), nullable=False),
        sa.Column('primary_image_document_id', sa.Integer, nullable=True),
        sa.Column('mileage', sa.Integer, nullable=True),
        sa.Column('status', sa.Enum('available','in_use','in_transit','maintenance','inactive', name='vehiclestatus'),
                  nullable=False, server_default='available'),
        sa.Column('current_trip_id', sa.Integer, nullable=True),
        sa.Column('last_service_date', sa.Date, nullable=True),
        sa.Column('next_service_date', sa.Date, nullable=True),
        sa.Column('insurance_expiry_date', sa.Date, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['primary_image_document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('vehicle_no', name='idx_vehicles_no'),
        sa.UniqueConstraint('plate_number', name='idx_vehicles_plate'),
    )
    op.create_index('idx_vehicles_status', 'vehicles', ['status'])
    op.create_index('idx_vehicles_type', 'vehicles', ['type'])
    op.create_index('idx_vehicles_next_service', 'vehicles', ['next_service_date'])
    op.create_index('idx_vehicles_insurance_expiry', 'vehicles', ['insurance_expiry_date'])

    op.create_table(
        'trips',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('trip_no', sa.String(50), nullable=True),
        sa.Column('type', sa.Enum('order_delivery','maintenance','inspection','station_transfer','emergency', name='triptype'),
                  nullable=False, server_default='order_delivery'),
        sa.Column('driver_id', sa.Integer, nullable=True),
        sa.Column('vehicle_id', sa.Integer, nullable=True),
        sa.Column('start_location', sa.String(255), nullable=False),
        sa.Column('end_location', sa.String(255), nullable=False),
        sa.Column('scheduled_date', sa.Date, nullable=False),
        sa.Column('dispatch_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.Enum('pending','assigned','awaiting_inventory','ready','dispatched','in_transit','completed','cancelled',
                                    name='tripstatus'), nullable=False, server_default='pending'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('cancellation_reason', sa.Text, nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('trip_no', name='idx_trips_no'),
    )
    op.create_index('idx_trips_status', 'trips', ['status'])
    op.create_index('idx_trips_type', 'trips', ['type'])
    op.create_index('idx_trips_driver', 'trips', ['driver_id'])
    op.create_index('idx_trips_vehicle', 'trips', ['vehicle_id'])
    op.create_index('idx_trips_scheduled_date', 'trips', ['scheduled_date'])

    op.create_table(
        'trip_orders',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('trip_id', sa.Integer, nullable=False),
        sa.Column('order_id', mysql.CHAR(36), nullable=False),
        sa.ForeignKeyConstraint(['trip_id'], ['trips.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('trip_id', 'order_id', name='idx_trip_orders_unique'),
    )
    op.create_index('idx_trip_orders_trip', 'trip_orders', ['trip_id'])
    op.create_index('idx_trip_orders_order', 'trip_orders', ['order_id'])

    # FK from drivers/vehicles back to trips (added after trips table exists)
    op.create_foreign_key('fk_drivers_current_trip', 'drivers', 'trips', ['current_trip_id'], ['id'], ondelete='SET NULL')
    op.create_index('idx_drivers_current_trip', 'drivers', ['current_trip_id'])
    op.create_foreign_key('fk_vehicles_current_trip', 'vehicles', 'trips', ['current_trip_id'], ['id'], ondelete='SET NULL')
    op.create_index('idx_vehicles_current_trip', 'vehicles', ['current_trip_id'])


def downgrade() -> None:
    op.drop_constraint('fk_vehicles_current_trip', 'vehicles', type_='foreignkey')
    op.drop_constraint('fk_drivers_current_trip', 'drivers', type_='foreignkey')
    op.drop_table('trip_orders')
    op.drop_table('trips')
    op.drop_table('vehicles')
    op.drop_table('drivers')
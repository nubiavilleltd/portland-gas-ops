"""recreate fleet and inventory with uuid

Revision ID: aa516aafb9b8
Revises: 1f2a3b4c5d6e
Create Date: 2026-07-08

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql


# revision identifiers, used by Alembic.
revision: str = "aa516aafb9b8"
down_revision: Union[str, None] = "1f2a3b4c5d6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # ============================================================
    # WAREHOUSE LOCATIONS
    # ============================================================

    op.create_table(
        "warehouse_locations",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("location_no", sa.String(50), nullable=True),

        sa.Column("name", sa.String(255), nullable=False),

        sa.Column("address", sa.Text(), nullable=True),

        sa.Column(
            "is_default",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("name"),
    )

    op.create_index(
        "ix_warehouse_locations_location_no",
        "warehouse_locations",
        ["location_no"],
        unique=True,
    )



    # ============================================================
    # DRIVERS
    # ============================================================

    op.create_table(
        "drivers",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("driver_no", sa.String(50), nullable=True),

        sa.Column(
            "employee_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "license_number",
            sa.String(100),
            nullable=False,
        ),

        sa.Column(
            "license_expiry_date",
            sa.Date(),
            nullable=False,
        ),

        sa.Column(
            "experience_years",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),

        sa.Column(
            "profile_image_document_id",
            sa.Integer(),
            nullable=True,
        ),

        sa.Column(
            "status",
            sa.Enum(
                "available",
                "assigned",
                "in_transit",
                "off_duty",
                "suspended",
                name="driverstatus",
            ),
            nullable=False,
            server_default="available",
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["profile_image_document_id"],
            ["documents.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("employee_id"),

        sa.UniqueConstraint("license_number"),
    )

    op.create_index(
        "ix_drivers_driver_no",
        "drivers",
        ["driver_no"],
        unique=True,
    )

    op.create_index(
        "ix_drivers_status",
        "drivers",
        ["status"],
    )

    op.create_index(
        "ix_drivers_license_expiry",
        "drivers",
        ["license_expiry_date"],
    )



    # ============================================================
    # VEHICLES
    # ============================================================

    op.create_table(
        "vehicles",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("vehicle_no", sa.String(50), nullable=True),

        sa.Column(
            "plate_number",
            sa.String(50),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(255),
            nullable=False,
        ),

        sa.Column(
            "vehicle_type",
            sa.Enum(
                "lpg_tanker",
                "delivery_van",
                "service_truck",
                "emergency_unit",
                name="vehicletype",
            ),
            nullable=False,
        ),

        sa.Column("make", sa.String(100)),
        sa.Column("model", sa.String(100)),
        sa.Column("year", sa.Integer()),

        sa.Column(
            "capacity",
            sa.Numeric(10, 2),
        ),

        sa.Column(
            "fuel_type",
            sa.String(50),
            nullable=False,
        ),

        sa.Column(
            "primary_image_document_id",
            sa.Integer(),
        ),

        sa.Column(
            "mileage",
            sa.Integer(),
        ),

        sa.Column(
            "status",
            sa.Enum(
                "available",
                "in_use",
                "in_transit",
                "maintenance",
                "inactive",
                name="vehiclestatus",
            ),
            nullable=False,
            server_default="available",
        ),

        sa.Column("last_service_date", sa.Date()),
        sa.Column("next_service_date", sa.Date()),
        sa.Column("insurance_expiry_date", sa.Date()),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["primary_image_document_id"],
            ["documents.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("plate_number"),
    )

    op.create_index(
        "ix_vehicles_vehicle_no",
        "vehicles",
        ["vehicle_no"],
        unique=True,
    )

    op.create_index(
        "ix_vehicles_status",
        "vehicles",
        ["status"],
    )

    op.create_index(
        "ix_vehicles_vehicle_type",
        "vehicles",
        ["vehicle_type"],
    )

    op.create_index(
        "ix_vehicles_next_service",
        "vehicles",
        ["next_service_date"],
    )

    op.create_index(
        "ix_vehicles_insurance_expiry",
        "vehicles",
        ["insurance_expiry_date"],
    )
        # ============================================================
    # TRIPS
    # ============================================================

    op.create_table(
        "trips",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("trip_no", sa.String(50), nullable=True),

        sa.Column(
            "trip_type",
            sa.Enum(
                "order_delivery",
                "maintenance",
                "inspection",
                "station_transfer",
                "emergency",
                name="triptype",
            ),
            nullable=False,
        ),

        sa.Column("driver_id", mysql.CHAR(36), nullable=True),

        sa.Column("vehicle_id", mysql.CHAR(36), nullable=True),

        sa.Column("start_location", sa.String(255), nullable=False),

        sa.Column("end_location", sa.String(255), nullable=False),

        sa.Column("scheduled_date", sa.Date(), nullable=False),

        sa.Column("dispatch_date", sa.DateTime(timezone=True)),

        sa.Column("started_at", sa.DateTime(timezone=True)),

        sa.Column("completed_at", sa.DateTime(timezone=True)),

        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "assigned",
                "awaiting_inventory",
                "ready_for_dispatch",
                "dispatched",
                "in_transit",
                "completed",
                "cancelled",
                name="tripstatus",
            ),
            nullable=False,
            server_default="pending",
        ),

        sa.Column("notes", sa.Text()),

        sa.Column("cancellation_reason", sa.Text()),

        sa.Column("cancelled_at", sa.DateTime(timezone=True)),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
            ondelete="SET NULL",
        ),

        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_trips_trip_no",
        "trips",
        ["trip_no"],
        unique=True,
    )

    op.create_index(
        "ix_trips_status",
        "trips",
        ["status"],
    )

    op.create_index(
        "ix_trips_trip_type",
        "trips",
        ["trip_type"],
    )

    op.create_index(
        "ix_trips_driver_id",
        "trips",
        ["driver_id"],
    )

    op.create_index(
        "ix_trips_vehicle_id",
        "trips",
        ["vehicle_id"],
    )

    op.create_index(
        "ix_trips_scheduled_date",
        "trips",
        ["scheduled_date"],
    )


    # ============================================================
    # INVENTORY ITEMS
    # ============================================================

    op.create_table(
        "inventory_items",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("product_id", mysql.CHAR(36), nullable=False),

        sa.Column("tag_number", sa.String(100), nullable=False),

        sa.Column("serial_number", sa.String(100)),

        sa.Column(
            "status",
            sa.Enum(
                "available",
                "reserved",
                "in_transit",
                "checked_out",
                "with_customer",
                "maintenance",
                "retired",
                name="inventoryitemstatus",
            ),
            nullable=False,
            server_default="available",
        ),

        sa.Column(
            "condition",
            sa.Enum(
                "new",
                "used",
                "refurbished",
                "damaged",
                name="inventoryitemcondition",
            ),
            nullable=False,
            server_default="new",
        ),

        sa.Column(
            "disposition",
            sa.Enum(
                "sold",
                "loaned",
                name="dispositionstatus",
            ),
        ),

        sa.Column("location_id", mysql.CHAR(36), nullable=False),

        sa.Column("order_id", mysql.CHAR(36)),

        sa.Column("trip_id", mysql.CHAR(36)),

        sa.Column("customer_id", mysql.CHAR(36)),

        sa.Column("checked_out_at", sa.DateTime(timezone=True)),

        sa.Column("expected_return_date", sa.Date()),

        sa.Column(
            "received_into_inventory_at",
            sa.Date(),
            nullable=False,
        ),

        sa.Column("returned_at", sa.DateTime(timezone=True)),

        sa.Column("notes", sa.Text()),

        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["location_id"],
            ["warehouse_locations.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            ondelete="SET NULL",
        ),

        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
            ondelete="SET NULL",
        ),

        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            ondelete="SET NULL",
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_inventory_items_tag_number",
        "inventory_items",
        ["tag_number"],
        unique=True,
    )

    op.create_index(
        "ix_inventory_items_product_id",
        "inventory_items",
        ["product_id"],
    )

    op.create_index(
        "ix_inventory_items_location_id",
        "inventory_items",
        ["location_id"],
    )

    op.create_index(
        "ix_inventory_items_status",
        "inventory_items",
        ["status"],
    )


    # ============================================================
    # CONSUMABLE STOCK
    # ============================================================

    op.create_table(
        "consumable_stock",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),

        sa.Column("product_id", mysql.CHAR(36), nullable=False),

        sa.Column("location_id", mysql.CHAR(36), nullable=False),

        sa.Column(
            "quantity",
            sa.Numeric(15, 3),
            nullable=False,
            server_default="0.000",
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["location_id"],
            ["warehouse_locations.id"],
            ondelete="RESTRICT",
        ),
    )

    op.create_index(
        "ix_consumable_stock_product_location",
        "consumable_stock",
        ["product_id", "location_id"],
        unique=True,
    )

    op.create_index(
        "ix_consumable_stock_product_id",
        "consumable_stock",
        ["product_id"],
    )

    op.create_index(
        "ix_consumable_stock_location_id",
        "consumable_stock",
        ["location_id"],
    )
        # ============================================================
    # STOCK MOVEMENTS
    # ============================================================

    op.create_table(
        "stock_movements",

        sa.Column("id", mysql.CHAR(36), nullable=False),

        sa.Column("movement_no", sa.String(50), nullable=True),

        sa.Column("product_id", mysql.CHAR(36), nullable=False),

        sa.Column(
            "movement_type",
            sa.Enum(
                "check_in",
                "check_out",
                "reservation",
                "reservation_release",
                "return_",
                "adjustment",
                name="movementtype",
            ),
            nullable=False,
        ),

        sa.Column(
            "quantity",
            sa.Numeric(15, 3),
            nullable=False,
        ),

        sa.Column(
            "reference_id",
            sa.String(36),
        ),

        sa.Column(
            "reference_type",
            sa.Enum(
                "order",
                "trip",
                "purchase_order",
                "manual",
                name="referencetype",
            ),
        ),

        sa.Column(
            "location_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "notes",
            sa.Text(),
        ),

        sa.Column(
            "recorded_by",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["location_id"],
            ["warehouse_locations.id"],
            ondelete="RESTRICT",
        ),

        sa.ForeignKeyConstraint(
            ["recorded_by"],
            ["users.id"],
            ondelete="RESTRICT",
        ),

        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_stock_movements_movement_no",
        "stock_movements",
        ["movement_no"],
        unique=True,
    )

    op.create_index(
        "ix_stock_movements_product_id",
        "stock_movements",
        ["product_id"],
    )

    op.create_index(
        "ix_stock_movements_location_id",
        "stock_movements",
        ["location_id"],
    )

    op.create_index(
        "ix_stock_movements_recorded_by",
        "stock_movements",
        ["recorded_by"],
    )

    op.create_index(
        "ix_stock_movements_type",
        "stock_movements",
        ["movement_type"],
    )

    op.create_index(
        "ix_stock_movements_reference",
        "stock_movements",
        ["reference_id", "reference_type"],
    )

    op.create_index(
        "ix_stock_movements_created_at",
        "stock_movements",
        ["created_at"],
    )


    # ============================================================
    # STOCK MOVEMENT ITEMS
    # ============================================================

    op.create_table(
        "stock_movement_items",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),

        sa.Column(
            "movement_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "inventory_item_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["movement_id"],
            ["stock_movements.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["inventory_item_id"],
            ["inventory_items.id"],
            ondelete="RESTRICT",
        ),
    )

    op.create_index(
        "ix_stock_movement_items_movement_id",
        "stock_movement_items",
        ["movement_id"],
    )

    op.create_index(
        "ix_stock_movement_items_inventory_item_id",
        "stock_movement_items",
        ["inventory_item_id"],
    )


    # ============================================================
    # TRIP ORDERS
    # ============================================================

    op.create_table(
        "trip_orders",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),

        sa.Column(
            "trip_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.Column(
            "order_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["trip_id"],
            ["trips.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            ondelete="RESTRICT",
        ),
    )

    op.create_index(
        "ix_trip_orders_trip_id",
        "trip_orders",
        ["trip_id"],
    )

    op.create_index(
        "ix_trip_orders_order_id",
        "trip_orders",
        ["order_id"],
    )

    op.create_index(
        "ix_trip_orders_unique",
        "trip_orders",
        ["trip_id", "order_id"],
        unique=True,
    )


    # ============================================================
    # ORDER ITEM INVENTORY
    # ============================================================

    op.create_table(
        "order_item_inventory",

        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
        ),

        sa.Column(
            "order_item_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "inventory_item_id",
            mysql.CHAR(36),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            ["order_item_id"],
            ["order_items.id"],
            ondelete="CASCADE",
        ),

        sa.ForeignKeyConstraint(
            ["inventory_item_id"],
            ["inventory_items.id"],
            ondelete="RESTRICT",
        ),
    )

    op.create_index(
        "ix_order_item_inventory_order_item_id",
        "order_item_inventory",
        ["order_item_id"],
    )

    op.create_index(
        "ix_order_item_inventory_inventory_item_id",
        "order_item_inventory",
        ["inventory_item_id"],
    )

    op.create_index(
        "ix_order_item_inventory_unique",
        "order_item_inventory",
        ["order_item_id", "inventory_item_id"],
        unique=True,
    )
        # ============================================================
    # EXISTING TABLE UPDATES
    # ============================================================

    #
    # Payments
    #
    op.add_column(
        "payments",
        sa.Column(
            "invoice_no",
            sa.String(50),
            nullable=False,
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "customer_id",
            mysql.CHAR(36),
            nullable=False,
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "customer_name",
            sa.String(255),
            nullable=False,
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "currency",
            sa.String(3),
            nullable=False,
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
    )
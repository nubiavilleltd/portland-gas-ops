from __future__ import annotations
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timezone

from app.fleet.repository import FleetRepository
from app.fleet.model import Driver, Vehicle, Trip
from app.fleet.schema import DriverCreate, DriverUpdate, VehicleCreate, VehicleUpdate, TripCreate
from app.fleet.enums import DriverStatus, VehicleStatus, TripStatus
from app.fleet.error_codes import FleetErrorCode
from app.fleet import guards
from app.core.exceptions import AppException, ErrorCode
from app.audit.service import AuditService
from app.audit.schema import AuditEntityType, AuditActorType


class FleetService:

    def __init__(self):
        self.repo = FleetRepository()

    # ── Drivers ──────────────────────────────────────────────────────────────

    def get_driver_or_raise(self, db: Session, driver_id: int) -> Driver:
        driver = self.repo.get_driver_by_id(db, driver_id)
        if not driver:
            raise AppException(404, FleetErrorCode.DRIVER_NOT_FOUND, f"Driver {driver_id} not found")
        return driver

    def list_drivers(self, db: Session, status: Optional[str] = None) -> List[Driver]:
        return self.repo.list_drivers(db, status=status)

    def list_available_drivers(self, db: Session) -> List[Driver]:
        return self.repo.list_drivers(db, status=DriverStatus.available.value)

    def create_driver(
        self, db: Session, data: DriverCreate,
        employee_id: str, profile_image_document_id: Optional[int] = None,
    ) -> Driver:
        if self.repo.get_driver_by_license(db, data.license_number):
            raise AppException(409, FleetErrorCode.LICENSE_NUMBER_IN_USE,
                               f"License number '{data.license_number}' is already in use")
        return self.repo.create_driver(
            db,
            employee_id            = employee_id,
            license_number         = data.license_number,
            license_expiry_date    = data.license_expiry_date,
            experience_years       = data.experience_years,
            profile_image_document_id = profile_image_document_id,
            status                 = DriverStatus.available,
        )

    def update_driver(self, db: Session, driver_id: int, data: DriverUpdate) -> Driver:
        driver = self.get_driver_or_raise(db, driver_id)
        if data.license_number and data.license_number != driver.license_number:
            if self.repo.get_driver_by_license(db, data.license_number):
                raise AppException(409, FleetErrorCode.LICENSE_NUMBER_IN_USE,
                                   "License number already in use")
        updates = data.model_dump(exclude_unset=True, exclude={"full_name", "phone_number", "address"})
        return self.repo.update_driver(db, driver, **updates)

    def assign_driver_to_trip(self, db: Session, driver_id: int, trip_id: int) -> Driver:
        driver = self.get_driver_or_raise(db, driver_id)
        return self.repo.update_driver(db, driver, status=DriverStatus.assigned, current_trip_id=trip_id)

    def set_driver_in_transit(self, db: Session, driver_id: int) -> Driver:
        driver = self.get_driver_or_raise(db, driver_id)
        return self.repo.update_driver(db, driver, status=DriverStatus.in_transit)

    def release_driver(self, db: Session, driver_id: int) -> Driver:
        driver = self.get_driver_or_raise(db, driver_id)
        return self.repo.update_driver(db, driver, status=DriverStatus.available, current_trip_id=None)

    # ── Vehicles ─────────────────────────────────────────────────────────────

    def get_vehicle_or_raise(self, db: Session, vehicle_id: int) -> Vehicle:
        vehicle = self.repo.get_vehicle_by_id(db, vehicle_id)
        if not vehicle:
            raise AppException(404, FleetErrorCode.VEHICLE_NOT_FOUND, f"Vehicle {vehicle_id} not found")
        return vehicle

    def list_vehicles(self, db: Session, status: Optional[str] = None) -> List[Vehicle]:
        return self.repo.list_vehicles(db, status=status)

    def list_available_vehicles(self, db: Session) -> List[Vehicle]:
        return self.repo.list_vehicles(db, status=VehicleStatus.available.value)

    def create_vehicle(
        self, db: Session, data: VehicleCreate, primary_image_document_id: Optional[int] = None,
    ) -> Vehicle:
        if self.repo.get_vehicle_by_plate(db, data.plate_number):
            raise AppException(409, FleetErrorCode.PLATE_NUMBER_IN_USE,
                               f"Plate number '{data.plate_number}' is already in use")
        vehicle_no = self.repo.generate_vehicle_no(db)
        return self.repo.create_vehicle(
            db,
            vehicle_no    = vehicle_no,
            plate_number  = data.plate_number,
            name          = data.name,
            type          = data.type,
            make          = data.make,
            model         = data.model,
            year          = data.year,
            capacity      = data.capacity,
            fuel_type     = data.fuel_type,
            mileage       = data.mileage,
            primary_image_document_id = primary_image_document_id,
            status        = VehicleStatus.available,
            last_service_date     = data.last_service_date,
            next_service_date     = data.next_service_date,
            insurance_expiry_date = data.insurance_expiry_date,
        )

    def update_vehicle(self, db: Session, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
        vehicle = self.get_vehicle_or_raise(db, vehicle_id)
        if data.plate_number and data.plate_number != vehicle.plate_number:
            if self.repo.get_vehicle_by_plate(db, data.plate_number):
                raise AppException(409, FleetErrorCode.PLATE_NUMBER_IN_USE, "Plate number already in use")
        updates = data.model_dump(exclude_unset=True)
        return self.repo.update_vehicle(db, vehicle, **updates)

    def assign_vehicle_to_trip(self, db: Session, vehicle_id: int, trip_id: int) -> Vehicle:
        vehicle = self.get_vehicle_or_raise(db, vehicle_id)
        return self.repo.update_vehicle(db, vehicle, status=VehicleStatus.in_use, current_trip_id=trip_id)

    def set_vehicle_in_transit(self, db: Session, vehicle_id: int) -> Vehicle:
        vehicle = self.get_vehicle_or_raise(db, vehicle_id)
        return self.repo.update_vehicle(db, vehicle, status=VehicleStatus.in_transit)

    def release_vehicle(self, db: Session, vehicle_id: int) -> Vehicle:
        vehicle = self.get_vehicle_or_raise(db, vehicle_id)
        return self.repo.update_vehicle(db, vehicle, status=VehicleStatus.available, current_trip_id=None)

    # ── Trips ────────────────────────────────────────────────────────────────

    def get_trip_or_raise(self, db: Session, trip_id: int) -> Trip:
        trip = self.repo.get_trip_by_id(db, trip_id)
        if not trip:
            raise AppException(404, FleetErrorCode.TRIP_NOT_FOUND, f"Trip {trip_id} not found")
        return trip

    def list_trips(self, db: Session, status: Optional[str] = None) -> List[Trip]:
        return self.repo.list_trips(db, status=status)

    def create_trip(
        self, db: Session, data: TripCreate, created_by: str,
    ) -> Trip:
        """
        Creates a trip. If order_ids provided, links them via trip_orders
        and assigns the order to this trip (sets order.trip_id, fulfillment_status=assigned).
        """
        from app.orders.service import OrderService
        order_service = OrderService()

        trip_no = self.repo.generate_trip_no(db)
        trip = self.repo.create_trip(
            db,
            trip_no        = trip_no,
            type           = data.type,
            start_location = data.start_location,
            end_location   = data.end_location,
            scheduled_date = data.scheduled_date,
            notes          = data.notes,
            status         = TripStatus.pending,
        )

        for order_uuid in data.order_ids:
            order = order_service.get_or_raise(db, order_uuid)
            from app.orders import guards as order_guards
            if not order_guards.can_cancel(order) and order.fulfillment_status.value != "pending":
                # reuse: order must be in a state assignable to trip — pending fulfillment
                pass
            if order.fulfillment_status.value != "pending":
                raise AppException(400, FleetErrorCode.ORDER_CANNOT_BE_LINKED,
                                   f"Order {order.order_no} cannot be assigned to a trip in its current state")
            self.repo.add_trip_order(db, trip.id, order.id)
            order_service.set_trip(db, order.order_no, str(trip.id))
            order_service.update_fulfillment_status(db, order.order_no, "assigned")

            AuditService.record(
                db, AuditEntityType.order, order.id,
                "assigned_to_trip", f"Order assigned to trip {trip_no}",
                AuditActorType.employee, created_by,
            )

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "created", f"Trip created for {data.type.value.replace('_', ' ')}",
            AuditActorType.employee, created_by,
        )

        return trip

    async def _trip_has_tracked_items(self, db: Session, trip: Trip) -> bool:
        """Check if any linked order contains tracked products."""
        if trip.type.value != "order_delivery":
            return False
        from app.products.model import Product
        from app.orders.model import OrderItem

        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        if not order_ids:
            return False

        count = (
            db.query(OrderItem)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(OrderItem.order_id.in_(order_ids), Product.product_type == "tracked")
            .count()
        )
        return count > 0

    def assign_resources(
        self, db: Session, trip_id: int, driver_id: int, vehicle_id: int, actor_id: str,
    ) -> Trip:
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_assign_resources(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_ASSIGNED,
                               "Only pending or assigned trips can have resources assigned")

        driver = self.get_driver_or_raise(db, driver_id)
        if driver.status != DriverStatus.available:
            raise AppException(400, FleetErrorCode.DRIVER_NOT_AVAILABLE,
                               f"Driver is not available (status: {driver.status.value})")

        vehicle = self.get_vehicle_or_raise(db, vehicle_id)
        if vehicle.status != VehicleStatus.available:
            raise AppException(400, FleetErrorCode.VEHICLE_NOT_AVAILABLE,
                               f"Vehicle is not available (status: {vehicle.status.value})")

        self.repo.update_trip(db, trip, driver_id=driver_id, vehicle_id=vehicle_id)
        self.assign_driver_to_trip(db, driver_id, trip_id)
        self.assign_vehicle_to_trip(db, vehicle_id, trip_id)

        # Determine next status — has_tracked_items check is sync here (called within sync service)
        has_tracked = self._check_tracked_items_sync(db, trip)
        new_status = TripStatus.awaiting_inventory if has_tracked else TripStatus.ready
        self.repo.update_trip(db, trip, status=new_status)

        # Cascade to linked orders — fulfillment_status=assigned
        from app.orders.service import OrderService
        order_service = OrderService()
        for order_id in self.repo.get_trip_order_ids(db, trip.id):
            order = order_service.get_or_raise(db, order_id)
            order_service.update_fulfillment_status(db, order.order_no, "assigned")

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "resources_assigned",
            f"Driver {driver.employee.full_name if driver.employee else ''} and vehicle {vehicle.name} assigned",
            AuditActorType.employee, actor_id,
        )

        return trip

    def _check_tracked_items_sync(self, db: Session, trip: Trip) -> bool:
        if trip.type.value != "order_delivery":
            return False
        from app.products.model import Product
        from app.orders.model import OrderItem
        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        if not order_ids:
            return False
        count = (
            db.query(OrderItem)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(OrderItem.order_id.in_(order_ids), Product.product_type == "tracked")
            .count()
        )
        return count > 0

    def mark_ready(self, db: Session, trip_id: int, actor_id: str) -> Trip:
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_mark_ready(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_ASSIGNED,
                               "Trip must be awaiting inventory before marking ready")
        updated = self.repo.update_trip(db, trip, status=TripStatus.ready)
        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "marked_ready", "Trip marked ready for dispatch",
            AuditActorType.system,
        )
        return updated

    def dispatch(self, db: Session, trip_id: int, actor_id: str) -> Trip:
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_dispatch(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_DISPATCHED,
                               "Trip must be assigned or ready before dispatch")
        if not trip.driver_id or not trip.vehicle_id:
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_DISPATCHED,
                               "Trip must have a driver and vehicle before dispatch")

        self.repo.update_trip(db, trip, status=TripStatus.dispatched, dispatch_date=datetime.now(timezone.utc))

        # Cascade: order fulfillment_status=dispatched
        from app.orders.service import OrderService
        order_service = OrderService()
        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        for order_id in order_ids:
            order = order_service.get_or_raise(db, order_id)
            if order.fulfillment_status.value != "delivered":
                order_service.update_fulfillment_status(db, order.order_no, "dispatched")
                AuditService.record(
                    db, AuditEntityType.order, order.id,
                    "dispatched", f"Order dispatched on trip {trip.trip_no}",
                    AuditActorType.system,
                )

        # Cascade: inventory check-out for tracked items (if trip carries tracked products)
        self._checkout_inventory_for_trip(db, trip, order_ids, actor_id)

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "dispatched", f"Trip dispatched with {len(order_ids)} order(s)",
            AuditActorType.employee, actor_id,
        )

        return trip

    def _checkout_inventory_for_trip(self, db: Session, trip: Trip, order_ids: List[str], actor_id: str) -> None:
        """
        At dispatch, mark reserved/available inventory items as checked_out
        and link them to the order via order_item_inventory.
        Only applies to tracked product line items.
        """
        from app.orders.model import OrderItem
        from app.inventory.model import InventoryItem, OrderItemInventory
        from app.inventory.enums import InventoryItemStatus, DispositionStatus, MovementType
        from app.inventory.repository import InventoryRepository
        from app.products.model import Product

        if not order_ids:
            return

        inv_repo = InventoryRepository()
        order_items = (
            db.query(OrderItem)
            .join(Product, Product.id == OrderItem.product_id)
            .filter(OrderItem.order_id.in_(order_ids), Product.product_type == "tracked")
            .all()
        )

        for oi in order_items:
            qty_needed = int(oi.quantity)
            available_items = inv_repo.get_available_items_for_product(db, oi.product_id, qty_needed)
            if len(available_items) < qty_needed:
                raise AppException(
                    400, "INSUFFICIENT_STOCK",
                    f"Not enough available units of product for order item — needed {qty_needed}, found {len(available_items)}",
                )

            disposition = oi.disposition.value if oi.disposition else "sold"
            for item in available_items:
                item.status = InventoryItemStatus.checked_out
                item.disposition = DispositionStatus(disposition)
                item.order_id = oi.order_id
                item.checked_out_at = datetime.now(timezone.utc)
                db.add(OrderItemInventory(order_item_id=oi.id, inventory_item_id=item.id))

            db.flush()

            movement = inv_repo.create_movement(
                db,
                product_id    = oi.product_id,
                movement_type = MovementType.check_out,
                quantity      = qty_needed,
                location_id   = available_items[0].location_id if available_items else 1,
                recorded_by   = actor_id,
                reference_id  = str(trip.id),
                reference_type = "trip",
                notes         = f"Checked out for trip {trip.trip_no}",
            )
            inv_repo.add_movement_items(db, movement.id, [i.id for i in available_items])

    def start(self, db: Session, trip_id: int, actor_id: str) -> Trip:
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_start(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_STARTED,
                               "Trip must be dispatched before starting transit")

        self.repo.update_trip(db, trip, status=TripStatus.in_transit, started_at=datetime.now(timezone.utc))

        if trip.driver_id:
            self.set_driver_in_transit(db, trip.driver_id)
        if trip.vehicle_id:
            self.set_vehicle_in_transit(db, trip.vehicle_id)

        from app.orders.service import OrderService
        order_service = OrderService()
        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        for order_id in order_ids:
            order = order_service.get_or_raise(db, order_id)
            if order.fulfillment_status.value != "delivered":
                order_service.update_fulfillment_status(db, order.order_no, "in_transit")
                AuditService.record(
                    db, AuditEntityType.order, order.id,
                    "in_transit", "Order in transit",
                    AuditActorType.system,
                )

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "started", "Driver confirmed departure — trip in transit",
            AuditActorType.employee, actor_id,
        )

        return trip

    def complete(self, db: Session, trip_id: int, proof_notes: Optional[str], actor_id: str) -> Trip:
        """
        Complete trip. Each linked order must already be 'completed' (i.e. delivered + paid).
        This means confirm-delivery on each order must have been called first.
        """
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_complete(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_COMPLETED,
                               "Trip must be in transit before completing")

        from app.orders.service import OrderService
        order_service = OrderService()
        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        for order_id in order_ids:
            order = order_service.get_or_raise(db, order_id)
            if order.order_status.value != "completed":
                raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_COMPLETED,
                                   "All orders must be completed (delivered & paid) before completing the trip")

        notes = trip.notes or ""
        if proof_notes:
            notes = f"{notes}\nDelivery confirmed: {proof_notes}".strip()

        self.repo.update_trip(db, trip, status=TripStatus.completed,
                              completed_at=datetime.now(timezone.utc), notes=notes)

        if trip.driver_id:
            self.release_driver(db, trip.driver_id)
        if trip.vehicle_id:
            self.release_vehicle(db, trip.vehicle_id)

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "completed", "Trip completed — all deliveries confirmed",
            AuditActorType.employee, actor_id,
        )

        return trip

    def cancel(self, db: Session, trip_id: int, reason: Optional[str], actor_id: str) -> Trip:
        """
        Cancel trip. Cascades:
        - release driver and vehicle
        - revert linked orders (not yet delivered) back to fulfillment_status=pending, trip_id=None
        - release any checked_out inventory back to available (since trip never delivered)
        """
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_cancel(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_CANCELLED,
                               "Cannot cancel a completed trip")

        self.repo.update_trip(
            db, trip,
            status              = TripStatus.cancelled,
            cancellation_reason = reason,
            cancelled_at        = datetime.now(timezone.utc),
        )

        if trip.driver_id:
            self.release_driver(db, trip.driver_id)
        if trip.vehicle_id:
            self.release_vehicle(db, trip.vehicle_id)

        from app.orders.service import OrderService
        order_service = OrderService()
        order_ids = self.repo.get_trip_order_ids(db, trip.id)
        for order_id in order_ids:
            order = order_service.get_or_raise(db, order_id)
            if order.fulfillment_status.value != "delivered":
                order_service.update_fulfillment_status(db, order.order_no, "pending")
                order_service.set_trip(db, order.order_no, None)
                AuditService.record(
                    db, AuditEntityType.order, order.id,
                    "removed_from_trip", f"Order unlinked from cancelled trip {trip.trip_no}",
                    AuditActorType.system,
                )

        # Release any checked_out inventory back to available
        self._release_inventory_for_trip(db, trip)

        AuditService.record(
            db, AuditEntityType.trip, str(trip.id),
            "cancelled", f"Trip cancelled: {reason}" if reason else "Trip cancelled",
            AuditActorType.employee, actor_id,
        )

        return trip

    def _release_inventory_for_trip(self, db: Session, trip: Trip) -> None:
        from app.inventory.model import InventoryItem, StockMovementItem, StockMovement
        from app.inventory.enums import InventoryItemStatus, MovementType
        from app.inventory.repository import InventoryRepository

        inv_repo = InventoryRepository()
        # Find items checked out for this trip via stock_movements reference
        movements = (
            db.query(StockMovement)
            .filter(StockMovement.reference_id == str(trip.id), StockMovement.reference_type == "trip",
                   StockMovement.movement_type == MovementType.check_out)
            .all()
        )
        for movement in movements:
            item_ids = [smi.inventory_item_id for smi in movement.items]
            for item_id in item_ids:
                item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
                if item and item.status == InventoryItemStatus.checked_out:
                    item.status = InventoryItemStatus.available
                    item.disposition = None
                    item.order_id = None
                    item.checked_out_at = None
            db.flush()

    def add_order(self, db: Session, trip_id: int, order_uuid: str, actor_id: str) -> Trip:
        trip = self.get_trip_or_raise(db, trip_id)
        if not guards.can_add_order(trip):
            raise AppException(400, FleetErrorCode.TRIP_CANNOT_BE_ASSIGNED,
                               "Cannot add orders to a trip that is already dispatched")

        from app.orders.service import OrderService
        order_service = OrderService()
        order = order_service.get_or_raise(db, order_uuid)
        if order.fulfillment_status.value != "pending":
            raise AppException(400, FleetErrorCode.ORDER_CANNOT_BE_LINKED,
                               "Order cannot be assigned to a trip in its current state")

        self.repo.add_trip_order(db, trip.id, order.id)
        order_service.set_trip(db, order.order_no, str(trip.id))

        if trip.status in (TripStatus.assigned, TripStatus.ready):
            order_service.update_fulfillment_status(db, order.order_no, "assigned")
            has_tracked = self._check_tracked_items_sync(db, trip)
            if has_tracked:
                self.repo.update_trip(db, trip, status=TripStatus.awaiting_inventory)

        AuditService.record(
            db, AuditEntityType.order, order.id,
            "assigned_to_trip", f"Order assigned to trip {trip.trip_no}",
            AuditActorType.employee, actor_id,
        )

        return trip
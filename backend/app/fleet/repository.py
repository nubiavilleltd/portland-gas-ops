from __future__ import annotations
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import datetime, timezone
from app.fleet.model import Driver, Vehicle, Trip, TripOrder
from app.fleet.enums import DriverStatus, VehicleStatus, TripStatus


class FleetRepository:

    # ── Drivers ──────────────────────────────────────────────────────────────

    def get_driver_by_id(self, db: Session, driver_id: int) -> Optional[Driver]:
        return db.query(Driver).options(joinedload(Driver.employee)).filter(Driver.id == driver_id).first()

    def get_driver_by_employee_id(self, db: Session, employee_id: str) -> Optional[Driver]:
        return db.query(Driver).filter(Driver.employee_id == employee_id).first()

    def get_driver_by_license(self, db: Session, license_number: str) -> Optional[Driver]:
        return db.query(Driver).filter(Driver.license_number == license_number).first()

    def list_drivers(self, db: Session, status: Optional[str] = None) -> List[Driver]:
        q = db.query(Driver).options(joinedload(Driver.employee))
        if status:
            q = q.filter(Driver.status == status)
        return q.order_by(Driver.created_at.desc()).all()

    def create_driver(self, db: Session, **fields) -> Driver:
        driver = Driver(**fields)
        db.add(driver)
        db.flush()
        return driver

    def update_driver(self, db: Session, driver: Driver, **fields) -> Driver:
        for k, v in fields.items():
            setattr(driver, k, v)
        db.flush()
        return driver

    # ── Vehicles ─────────────────────────────────────────────────────────────

    def get_vehicle_by_id(self, db: Session, vehicle_id: int) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    def get_vehicle_by_plate(self, db: Session, plate_number: str) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.plate_number == plate_number).first()

    def list_vehicles(self, db: Session, status: Optional[str] = None) -> List[Vehicle]:
        q = db.query(Vehicle)
        if status:
            q = q.filter(Vehicle.status == status)
        return q.order_by(Vehicle.created_at.desc()).all()

    def create_vehicle(self, db: Session, **fields) -> Vehicle:
        vehicle = Vehicle(**fields)
        db.add(vehicle)
        db.flush()
        return vehicle

    def update_vehicle(self, db: Session, vehicle: Vehicle, **fields) -> Vehicle:
        for k, v in fields.items():
            setattr(vehicle, k, v)
        db.flush()
        return vehicle

    def generate_vehicle_no(self, db: Session) -> str:
        last = db.query(Vehicle.vehicle_no).filter(Vehicle.vehicle_no.like("VEH-%")).order_by(Vehicle.id.desc()).first()
        seq = (int(last[0].split("-")[1]) + 1) if last and last[0] else 1
        return f"VEH-{seq:03d}"

    # ── Trips ────────────────────────────────────────────────────────────────

    def get_trip_by_id(self, db: Session, trip_id: int) -> Optional[Trip]:
        return (
            db.query(Trip)
            .options(joinedload(Trip.driver), joinedload(Trip.vehicle), joinedload(Trip.trip_orders))
            .filter(Trip.id == trip_id)
            .first()
        )

    def list_trips(self, db: Session, status: Optional[str] = None) -> List[Trip]:
        q = db.query(Trip).options(joinedload(Trip.driver), joinedload(Trip.vehicle), joinedload(Trip.trip_orders))
        if status:
            q = q.filter(Trip.status == status)
        return q.order_by(Trip.created_at.desc()).all()

    def create_trip(self, db: Session, **fields) -> Trip:
        trip = Trip(**fields)
        db.add(trip)
        db.flush()
        return trip

    def update_trip(self, db: Session, trip: Trip, **fields) -> Trip:
        for k, v in fields.items():
            setattr(trip, k, v)
        db.flush()
        return trip

    def add_trip_order(self, db: Session, trip_id: int, order_id: str) -> TripOrder:
        link = TripOrder(trip_id=trip_id, order_id=order_id)
        db.add(link)
        db.flush()
        return link

    def remove_trip_order(self, db: Session, trip_id: int, order_id: str) -> None:
        db.query(TripOrder).filter(
            TripOrder.trip_id == trip_id, TripOrder.order_id == order_id
        ).delete()
        db.flush()

    def get_trip_order_ids(self, db: Session, trip_id: int) -> List[str]:
        rows = db.query(TripOrder.order_id).filter(TripOrder.trip_id == trip_id).all()
        return [r[0] for r in rows]

    def generate_trip_no(self, db: Session) -> str:
        today = datetime.now(timezone.utc).strftime("%Y%m%d")
        pattern = f"TRP-{today}-%"
        last = db.query(Trip.trip_no).filter(Trip.trip_no.like(pattern)).order_by(Trip.trip_no.desc()).first()
        seq = (int(last[0].split("-")[-1]) + 1) if last else 1
        return f"TRP-{today}-{seq:03d}"
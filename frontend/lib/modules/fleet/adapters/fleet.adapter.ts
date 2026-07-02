
// ── Backend shapes ────────────────────────────────────────

import { Driver } from "../types/driver.types";
import { Trip } from "../types/trip.types";
import { Vehicle } from "../types/vehicle.types";

interface BackendDriver {
    id: number;
    employee_id: string;
    full_name: string;
    email: string;
    phone_number: string;
    license_number: string;
    license_expiry_date: string;
    experience_years: number;
    profile_image_url: string | null;
    status: string;
    current_trip_id: string | null;
    created_at: string;
}

interface BackendVehicle {
    id: string;
    vehicle_no: string;
    plate_number: string;
    name: string;
    type: string;
    make: string;
    model: string;
    year: number;
    capacity: string | number | null;
    fuel_type: string;
    image_url: string | null;
    mileage: number | null;
    status: string;
    current_trip_id: string;
    last_service_date: string;
    next_service_date: string;
    insurance_expiry_date: string;
    roadworthiness_expiry_date: string;
    created_at: string;
}

interface BackendTrip {
    id: number;
    trip_no: string | null;
    type: string;
    driver_id: number | null;
    driver_name: string | null;
    vehicle_id: number | null;
    vehicle_name: string | null;
    order_ids: string[];
    start_location: string;
    end_location: string;
    scheduled_date: string;
    dispatch_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    status: string;
    notes: string | null;
    cancellation_reason: string | null;
    cancelled_at: string | null;
    created_at: string;
}

// ── Adapters ──────────────────────────────────────────────

export function adaptDriver(raw: BackendDriver): Driver {
    return {
        id: String(raw.id),
        full_name: raw.full_name,
        email: raw.email,
        phone_number: raw.phone_number,
        license_number: raw.license_number,
        license_expiry_date: raw.license_expiry_date,
        experience_years: raw.experience_years,
        profile_image: raw.profile_image_url ?? undefined,
        status: raw.status as Driver["status"],
        current_trip_id: raw.current_trip_id != null ? String(raw.current_trip_id) : undefined,
        created_at: raw.created_at,
    };
}

export function adaptVehicle(raw: BackendVehicle): Vehicle {
    return {
        id: String(raw.id),
        vehicle_no: raw.vehicle_no ?? undefined,
        plate_number: raw.plate_number,
        name: raw.name,
        type: raw.type as Vehicle["type"],
        make: raw.make,
        model: raw.model ?? undefined,
        year: raw.year ?? undefined,
        capacity: raw.capacity != null ? Number(raw.capacity) : undefined,
        fuel_type: raw.fuel_type,
        image: raw.image_url ?? undefined,
        mileage: raw.mileage ?? undefined,
        status: raw.status as Vehicle["status"],
        current_trip_id: raw.current_trip_id != null ? String(raw.current_trip_id) : undefined,
        last_service_date: raw.last_service_date ?? undefined,
        next_service_date: raw.next_service_date ?? undefined,
        insurance_expiry_date: raw.insurance_expiry_date ?? undefined,
        roadworthiness_expiry_date: raw.roadworthiness_expiry_date ?? undefined,
        created_at: raw.created_at,
    };
}

export function adaptTrip(raw: BackendTrip): Trip {
    return {
        id: String(raw.id),
        trip_number: raw.trip_no ?? String(raw.id),
        type: raw.type as Trip["type"],
        driver_id: raw.driver_id != null ? String(raw.driver_id) : null,
        vehicle_id: raw.vehicle_id != null ? String(raw.vehicle_id) : null,
        order_ids: raw.order_ids ?? [],
        start_location: raw.start_location,
        end_location: raw.end_location,
        scheduled_date: raw.scheduled_date,
        dispatch_date: raw.dispatch_date ?? undefined,
        started_at: raw.started_at ?? undefined,
        completed_at: raw.completed_at ?? undefined,
        status: raw.status as Trip["status"],
        notes: raw.notes ?? undefined,
        cancellation_reason: raw.cancellation_reason ?? undefined,
        cancelled_at: raw.cancelled_at ?? undefined,
        created_at: raw.created_at,
    };
}
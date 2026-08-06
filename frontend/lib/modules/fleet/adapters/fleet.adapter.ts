
// ── Backend shapes ────────────────────────────────────────

import { Driver } from "../types/driver.types";
import { Trip } from "../types/trip.types";
import { Vehicle, VehicleType } from "../types/vehicle.types";
import type { VehicleFormValues } from "../components/VehicleForm";

interface BackendDriver {
    id: string;
    employee_id: string;
    full_name: string;
    email: string;
    phone_number: string;
    address: string | null;
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
    primary_image_url: string | null
    mileage: number | null;
    status: string;
    current_trip_id: string;
    last_service_date: string;
    next_service_date: string;
    insurance_expiry_date: string;
    roadworthiness_expiry_date: string;
    created_at: string;
}

export interface CreateVehicleRequest {
  name: string;
  plate_number: string;

  vehicle_type: VehicleType;

  make?: string;
  model?: string;
  year?: number;

  capacity?: number;

  fuel_type: string;

  mileage?: number;

  last_service_date?: string;
  next_service_date?: string;
  insurance_expiry_date?: string;
  roadworthiness_expiry_date?: string;

  image?: File;
}

export interface UpdateVehicleRequest {
  name?: string;
  plate_number?: string;

  vehicle_type?: VehicleType;

  make?: string;
  model?: string;
  year?: number;

  capacity?: number;

  fuel_type?: string;

  mileage?: number;

  last_service_date?: string;
  next_service_date?: string;
  insurance_expiry_date?: string;
  roadworthiness_expiry_date?: string;

  image?: File;
}

interface BackendTrip {
    id: string;
    trip_no: string | null;
    type: string;
    driver_id: string | null;
    driver_name: string | null;
    vehicle_id: string | null;
    vehicle_name: string | null;
    orders: { order_id: string; order_no: string }[];
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
    created_by_name:string;
}

interface BackendTripList {
    items: BackendTrip[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

// ── Adapters ──────────────────────────────────────────────

export function adaptDriver(raw: BackendDriver): Driver {
    return {
        id: String(raw.id),
        employee_id: raw.employee_id,
        full_name: raw.full_name,
        email: raw.email,
        phone_number: raw.phone_number,
        address: raw.address ?? undefined,
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
        image: raw.primary_image_url ?? undefined,
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
        order_ids: raw.orders?.map((o) => o.order_id) ?? [],
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
        created_by_name: raw.created_by_name,
    };
}

export function adaptTripList(raw: BackendTripList): Trip[] {
    return raw.items.map(adaptTrip);
}


export function adaptCreateVehicleRequest(
  input: VehicleFormValues
): CreateVehicleRequest {
  return {
    name: input.name,
    plate_number: input.plate_number,

    vehicle_type: input.type,   // ← renamed from "type"

    make: input.make || undefined,
    model: input.model || undefined,

    year: input.year ? Number(input.year) : undefined,

    capacity: input.capacity
      ? Number(input.capacity)
      : undefined,

    fuel_type: input.fuel_type,

    mileage: input.mileage
      ? Number(input.mileage)
      : undefined,

    last_service_date: input.last_service_date || undefined,
    next_service_date: input.next_service_date || undefined,
    insurance_expiry_date:
      input.insurance_expiry_date || undefined,
    roadworthiness_expiry_date: input.roadworthiness_expiry_date || undefined,

    image: input.image,
  };
}


export function adaptUpdateVehicleRequest(
  input: VehicleFormValues
): UpdateVehicleRequest {
  return {
    name: input.name,
    plate_number: input.plate_number,

    vehicle_type: input.type,

    make: input.make || undefined,
    model: input.model || undefined,

    year: input.year ? Number(input.year) : undefined,

    capacity: input.capacity
      ? Number(input.capacity)
      : undefined,

    fuel_type: input.fuel_type,

    mileage: input.mileage
      ? Number(input.mileage)
      : undefined,

    last_service_date: input.last_service_date || undefined,
    next_service_date: input.next_service_date || undefined,
    insurance_expiry_date:
      input.insurance_expiry_date || undefined,
      roadworthiness_expiry_date: input.roadworthiness_expiry_date || undefined,

    image: input.image || undefined,
  };
}
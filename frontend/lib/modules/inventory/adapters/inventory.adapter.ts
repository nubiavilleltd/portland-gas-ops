import type {
    InventoryItem, ConsumableStock, StockMovement,
    ConsumableStockDetail,
} from "../types/inventory.types";

// ── Backend shapes ─────────────────────────────────────────

interface BackendInventoryItem {
    id: string;
    product_id: string;
    product_name: string;
    tag_number: string;
    serial_number: string | null;
    status: string;
    condition: string;
    disposition: string | null;
    location_id: number;
    location_name: string;
    order_id: string | null;
    customer_id: string | null;
    customer_name: string | null;
    checked_out_at: string | null;
    expected_return_date: string | null;
    received_into_inventory_at: string;
    notes: string | null;
}

interface BackendConsumableStock {
    id: string;
    product_id: string;
    product_name: string;
    location_id: string;
    location_name: string;
    quantity: string | number;
    updated_at: string;
}

interface BackendConsumableStockDetail extends BackendConsumableStock {
  product_code?: string;
  movements: BackendStockMovement[];
}

interface BackendStockMovement {
    id: string;
    product_id: string;
    movement_type: string;
    quantity: string | number;
    reference_id: string | null;
    reference_type: string | null;
    location_id: string;
    notes: string | null;
    recorded_by: string;
    recorded_by_name: string;
    item_ids: string[];
    created_at: string;
}

// ── Adapters ───────────────────────────────────────────────

export function adaptInventoryItem(raw: BackendInventoryItem): InventoryItem {
    return {
        id: raw.id,
        product_id: raw.product_id,
        product_name: raw.product_name,
        tag_number: raw.tag_number,
        serial_number: raw.serial_number ?? undefined,
        status: raw.status as InventoryItem["status"],
        condition: raw.condition as InventoryItem["condition"],
        disposition: raw.disposition as any ?? undefined,
        location_id: String(raw.location_id),
        location_name: String(raw.location_name),
        order_id: raw.order_id ?? undefined,
        customer_id: raw.customer_id ?? undefined,
        customer_name: raw.customer_name ?? undefined,
        checked_out_at: raw.checked_out_at ?? undefined,
        expected_return_date: raw.expected_return_date ?? undefined,
        received_at: raw.received_into_inventory_at,
        notes: raw.notes ?? undefined,
    };
}

export function adaptConsumableStock(raw: BackendConsumableStock): ConsumableStock {
    return {
        id: raw.id,
        product_id: raw.product_id,
        product_name: raw.product_name,
        location_id: String(raw.location_id),
        location_name: String(raw.location_name),
        quantity: Number(raw.quantity),
        updated_at: raw.updated_at,
    };
}

export function adaptConsumableStockDetail(
  raw: BackendConsumableStockDetail,
): ConsumableStockDetail {
  return {
    ...adaptConsumableStock(raw),
    product_code: raw.product_code,
    movements: raw.movements.map(adaptStockMovement),
  };
}



export function adaptStockMovement(raw: BackendStockMovement): StockMovement {
    return {
        id: raw.id,
        product_id: raw.product_id,
        movement_type: raw.movement_type as StockMovement["movement_type"],
        quantity: Number(raw.quantity),
        reference_id: raw.reference_id ?? undefined,
        reference_type: raw.reference_type as any ?? undefined,
        location_id: String(raw.location_id),
        notes: raw.notes ?? undefined,
        recorded_by: raw.recorded_by,
        recorded_by_name: raw.recorded_by_name,
        item_ids: raw.item_ids ?? [],
        created_at: raw.created_at,
    };
}
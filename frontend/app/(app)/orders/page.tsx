"use client";

import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { GasOrder } from "@/types";

const MOCK: GasOrder[] = [
  { id: "1", order_number: "ORD-20240512-C3D4", customer_id: "c1", customer_name: "Dangote Cement Plc", gas_type: "CNG", quantity_kg: 12000, unit_price: 850, total_amount: 10200000, status: "dispatched", delivery_address: "Obajana, Kogi State", delivery_date: "2024-05-14", vehicle_id: "v1", driver_id: "d1", notes: null, created_at: "2024-05-12", updated_at: null },
  { id: "2", order_number: "ORD-20240511-E5F6", customer_id: "c2", customer_name: "Julius Berger Nigeria", gas_type: "LNG", quantity_kg: 8500, unit_price: 1200, total_amount: 10200000, status: "confirmed", delivery_address: "Abuja, FCT", delivery_date: "2024-05-15", vehicle_id: null, driver_id: null, notes: null, created_at: "2024-05-11", updated_at: null },
  { id: "3", order_number: "ORD-20240510-G7H8", customer_id: "c3", customer_name: "MTN Nigeria HQ", gas_type: "CNG", quantity_kg: 5000, unit_price: 850, total_amount: 4250000, status: "delivered", delivery_address: "Falomo, Lagos Island", delivery_date: "2024-05-13", vehicle_id: "v2", driver_id: "d2", notes: null, created_at: "2024-05-10", updated_at: null },
  { id: "4", order_number: "ORD-20240508-I9J0", customer_id: "c4", customer_name: "Flour Mills of Nigeria", gas_type: "CNG", quantity_kg: 9000, unit_price: 850, total_amount: 7650000, status: "draft", delivery_address: "Apapa, Lagos", delivery_date: null, vehicle_id: null, driver_id: null, notes: null, created_at: "2024-05-08", updated_at: null },
];

const columns: Column<GasOrder>[] = [
  { key: "order_number", label: "Order No." },
  { key: "customer_name", label: "Customer" },
  { key: "gas_type", label: "Type" },
  { key: "quantity_kg", label: "Qty (kg)", render: (v) => `${Number(v).toLocaleString()} kg` },
  { key: "total_amount", label: "Total", render: (v) => formatCurrency(Number(v)) },
  { key: "delivery_date", label: "Delivery Date", render: (v) => formatDate(v as string) },
  { key: "status", label: "Status", render: (v) => <ApprovalBadge status={v as GasOrder["status"]} /> },
];

export default function OrdersPage() {
  return (
    <AppLayout pageTitle="Orders & Dispatch">
      <PageHeader title="Gas Orders" description="Track gas orders, dispatch and delivery" action={
        <Button href="/orders/new" leftIcon={<Plus size={16} />}>
          New Order
        </Button>
      } className="mb-6" />
      <DataTable columns={columns} data={MOCK} rowHref={(r) => `/orders/${r.id}`} />
    </AppLayout>
  );
}

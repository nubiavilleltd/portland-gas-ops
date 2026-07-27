import type { KpiCardVariant } from "../components/KpiCard";
import type { OrderKPIs } from "../types/orders.types";

export interface OrderDashboardKpi {
  key: keyof OrderKPIs;
  label: string;
  variant: KpiCardVariant;
}

export const ORDER_DASHBOARD_KPIS = [
  {
    key: "totalOrders",
    label: "Total Orders",
    variant: "primary",
  },
  {
    key: "pendingDispatch",
    label: "Pending Dispatch",
    variant: "warning",
  },
  {
    key: "inTransit",
    label: "In Transit",
    variant: "info",
  },
  {
    key: "delivered",
    label: "Delivered",
    variant: "success",
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    variant: "primary",
  },
] as const satisfies readonly OrderDashboardKpi[];
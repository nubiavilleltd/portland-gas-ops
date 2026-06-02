import { KpiCardVariant } from "../components/KpiCard";

export type OrderDashboardKpi = {
  key: "totalOrders" | "pendingDispatch" | "inTransit" | "delivered" | "totalRevenue";
  label: string;
  variant: KpiCardVariant;
};




export const ORDER_DASHBOARD_KPIS: OrderDashboardKpi[] = [
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
];
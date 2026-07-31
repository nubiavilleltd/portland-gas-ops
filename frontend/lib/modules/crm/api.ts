import api from "@/lib/api";
import type { CRMActivity } from "./types";

export async function getCustomerActivities(
  customerId: string,
): Promise<CRMActivity[]> {
  const { data } = await api.get(`/crm/activity/customer/${customerId}`);

  return data;
}

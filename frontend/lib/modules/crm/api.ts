import api from "@/lib/api";
import type { CRMActivity, CreateCustomerContactPayload } from "./types";

export async function getCustomerActivities(
  customerId: string,
): Promise<CRMActivity[]> {
  const { data } = await api.get(`/api/crm/activity/customer/${customerId}`);

  return data;
}
export async function createCustomerContacts(
  customerId: string,
  data: CreateCustomerContactPayload,
) {
  const response = await api.post(`/api/crm/${customerId}/contacts`, data);

  return response.data;
}

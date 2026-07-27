import { getWorkAuthorization, listWorkAuthorizations } from "@/lib/safety-demo-store";
import type { WorkAuthorizationRequest } from "@/types/safety";

const MOCK_LATENCY_MS = 350;

export async function fetchWorkAuthorizationRequests(): Promise<WorkAuthorizationRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return listWorkAuthorizations();
}

export async function fetchWorkAuthorizationRequest(
  id: string
): Promise<WorkAuthorizationRequest | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return getWorkAuthorization(id);
}

import { getWorkInitiation, listWorkInitiations } from "@/lib/safety-demo-store";
import type { WorkInitiationRequest } from "@/types/safety";

const MOCK_LATENCY_MS = 250;

export async function fetchWorkInitiationRequests(): Promise<WorkInitiationRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return listWorkInitiations();
}

export async function fetchWorkInitiationRequest(
  id: string,
): Promise<WorkInitiationRequest | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return getWorkInitiation(id);
}

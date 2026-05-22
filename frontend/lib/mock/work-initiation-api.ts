import {
  cloneWorkInitiationRequest,
  getMockWorkInitiationRequest,
  mockWorkInitiationRequests,
} from "./work-initiation";
import type { WorkInitiationRequest } from "@/types/safety";

const MOCK_LATENCY_MS = 250;

export async function fetchWorkInitiationRequests(): Promise<WorkInitiationRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return mockWorkInitiationRequests.map(cloneWorkInitiationRequest);
}

export async function fetchWorkInitiationRequest(
  id: string,
): Promise<WorkInitiationRequest | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  const request = getMockWorkInitiationRequest(id);
  return request ? cloneWorkInitiationRequest(request) : null;
}

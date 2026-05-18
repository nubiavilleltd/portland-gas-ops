import {
  cloneWorkAuthorizationRequest,
  getMockWorkAuthorizationRequest,
  mockWorkAuthorizationRequests,
} from "./work-authorization";
import type { WorkAuthorizationRequest } from "@/types/safety";

const MOCK_LATENCY_MS = 350;

export async function fetchWorkAuthorizationRequests(): Promise<WorkAuthorizationRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return mockWorkAuthorizationRequests.map(cloneWorkAuthorizationRequest);
}

export async function fetchWorkAuthorizationRequest(
  id: string
): Promise<WorkAuthorizationRequest | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  const request = getMockWorkAuthorizationRequest(id);
  return request ? cloneWorkAuthorizationRequest(request) : null;
}

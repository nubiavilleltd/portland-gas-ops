import { workAuthorizationRequests } from "./work-authorization";
import type { WorkAuthorizationRequest } from "@/types/safety";

const MOCK_LATENCY_MS = 350;

export async function fetchWorkAuthorizationRequests(): Promise<WorkAuthorizationRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return workAuthorizationRequests.map((request) => ({ ...request }));
}

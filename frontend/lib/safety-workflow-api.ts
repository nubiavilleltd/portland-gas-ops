import {
  createInitialDraftForms,
  mockSafetyUsers,
  workflowScenarios,
  type DraftWorkflowRecords,
  type MockSafetyUser,
  type SafetyWorkflowRecord,
  type SafetyWorkflowRole,
  type WorkflowFormKey,
  type WorkflowStage,
} from "@/lib/safety-workflow-mocks";

const MOCK_LATENCY_MS = 180;

function waitForMockApi() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_LATENCY_MS);
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function fetchCurrentSafetyUser(
  role: SafetyWorkflowRole = "requester"
): Promise<MockSafetyUser> {
  await waitForMockApi();
  return clone(mockSafetyUsers[role]);
}

export async function fetchInitialSafetyDraftForms(
  role: SafetyWorkflowRole = "requester"
): Promise<DraftWorkflowRecords> {
  const currentUser = await fetchCurrentSafetyUser(role);
  return createInitialDraftForms({
    name: currentUser.name,
    employeeId: currentUser.employeeId,
    department: currentUser.department,
    role: currentUser.role,
    email: currentUser.email,
    phone: currentUser.phone,
    requestDate: new Date().toISOString(),
  });
}

export async function fetchSafetyRequests(
  formKey: WorkflowFormKey
): Promise<SafetyWorkflowRecord[]> {
  await waitForMockApi();
  return Object.values(workflowScenarios[formKey]).map((record) =>
    clone(record)
  );
}

export async function fetchSafetyRequest(
  formKey: WorkflowFormKey,
  requestId: string
): Promise<SafetyWorkflowRecord> {
  await waitForMockApi();
  const scenarios = workflowScenarios[formKey];
  return clone(scenarios[requestId as WorkflowStage] ?? scenarios.draft);
}


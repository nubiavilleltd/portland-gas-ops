import SafetyWorkflowWorkspace from "@/components/safety/SafetyWorkflowWorkspace";

export default function NewWorkAuthorizationPage() {
  return (
    <SafetyWorkflowWorkspace
      formKey="work_authorization"
      backHref="/safety/work-authorization"
      backLabel="Back to Work Authorization"
    />
  );
}

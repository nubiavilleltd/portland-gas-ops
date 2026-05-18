import SafetyWorkflowWorkspace from "@/components/safety/SafetyWorkflowWorkspace";

export default function NewWorkCompletionCloseOutPage() {
  return (
    <SafetyWorkflowWorkspace
      formKey="work_close_out"
      backHref="/safety/work-completion-closeout"
      backLabel="Back to Close-Out"
    />
  );
}

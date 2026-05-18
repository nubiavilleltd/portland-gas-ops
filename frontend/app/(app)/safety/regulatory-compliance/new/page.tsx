import SafetyWorkflowWorkspace from "@/components/safety/SafetyWorkflowWorkspace";

export default function NewRegulatoryCompliancePage() {
  return (
    <SafetyWorkflowWorkspace
      formKey="regulatory_compliance"
      backHref="/safety/regulatory-compliance"
      backLabel="Back to Regulatory Compliance"
    />
  );
}

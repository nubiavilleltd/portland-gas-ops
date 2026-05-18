import SafetyWorkflowWorkspace from "@/components/safety/SafetyWorkflowWorkspace";

export default function NewIncidentHazardReportPage() {
  return (
    <SafetyWorkflowWorkspace
      formKey="incident_hazard"
      backHref="/safety/incidents/incident-hazard-report"
      backLabel="Back to Incident Reports"
    />
  );
}

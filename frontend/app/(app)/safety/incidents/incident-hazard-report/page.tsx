import SafetyWorkflowListPage from "@/components/safety/SafetyWorkflowListPage";

export default function IncidentHazardReportPage() {
  return (
    <SafetyWorkflowListPage
      formKey="incident_hazard"
      baseHref="/safety/incidents/incident-hazard-report"
    />
  );
}

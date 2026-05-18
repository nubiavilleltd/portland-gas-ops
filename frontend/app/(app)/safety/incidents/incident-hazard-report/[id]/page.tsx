import SafetyWorkflowDetailPage from "@/components/safety/SafetyWorkflowDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IncidentHazardReportDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <SafetyWorkflowDetailPage
      formKey="incident_hazard"
      requestId={id}
      backHref="/safety/incidents/incident-hazard-report"
    />
  );
}

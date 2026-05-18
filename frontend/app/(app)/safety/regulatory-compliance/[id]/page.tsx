import SafetyWorkflowDetailPage from "@/components/safety/SafetyWorkflowDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RegulatoryComplianceDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <SafetyWorkflowDetailPage
      formKey="regulatory_compliance"
      requestId={id}
      backHref="/safety/regulatory-compliance"
    />
  );
}

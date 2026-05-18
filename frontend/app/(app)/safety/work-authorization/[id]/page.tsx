import SafetyWorkflowDetailPage from "@/components/safety/SafetyWorkflowDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkAuthorizationDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <SafetyWorkflowDetailPage
      formKey="work_authorization"
      requestId={id}
      backHref="/safety/work-authorization"
    />
  );
}

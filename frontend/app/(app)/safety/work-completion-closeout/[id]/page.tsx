import SafetyWorkflowDetailPage from "@/components/safety/SafetyWorkflowDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkCompletionCloseOutDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <SafetyWorkflowDetailPage
      formKey="work_close_out"
      requestId={id}
      backHref="/safety/work-completion-closeout"
    />
  );
}

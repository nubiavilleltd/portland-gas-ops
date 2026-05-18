import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkCompletionForm from "../../components/WorkCompletionForm";

export default function NewWorkCloseOutPage() {
  return (
    <AppLayout pageTitle="New Work Close-Out">
      <PageHeader
        title="New Work Close-Out"
        description="Confirm completed approved work and submit for close-out review."
        className="mb-6"
      />
      <WorkCompletionForm />
    </AppLayout>
  );
}

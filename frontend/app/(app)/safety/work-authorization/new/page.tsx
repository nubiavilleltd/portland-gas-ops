import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkAuthorizationForm from "../../components/WorkAuthorizationForm";

export default function NewWorkAuthorizationPage() {
  return (
    <AppLayout pageTitle="New Work Authorization">
      <PageHeader
        title="New Work Authorization"
        description="Create a safety authorization request for HSE review."
        className="mb-6"
      />
      <WorkAuthorizationForm />
    </AppLayout>
  );
}

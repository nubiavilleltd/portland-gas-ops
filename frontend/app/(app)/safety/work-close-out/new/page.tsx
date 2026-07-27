import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkCompletionForm from "../../components/WorkCompletionForm";

export default function NewWorkCloseOutPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <Link
        href="/safety/work-close-out"
        className="mb-5 flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Completion &amp; Close-Out
      </Link>
      <PageHeader
        title="New Work Close-Out"
        description="Confirm completed approved work and submit for close-out review."
        className="mb-6"
      />
      <WorkCompletionForm />
    </AppLayout>
  );
}

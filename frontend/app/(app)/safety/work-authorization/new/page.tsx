import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkAuthorizationForm from "../../components/WorkAuthorizationForm";

export default function NewWorkAuthorizationPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <Link
        href="/safety/work-authorization"
        className="mb-5 flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Authorization
      </Link>
      <PageHeader
        title="New Work Authorization"
        description="Create a safety authorization request for HSE review."
        className="mb-6"
      />
      <WorkAuthorizationForm />
    </AppLayout>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkInitiationForm from "../components/WorkInitiationForm";

export default function NewWorkInitiationPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <Link
        href="/safety/work-initiation"
        className="mb-5 flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Work Initiation
      </Link>
      <PageHeader
        title="New Work Initiation"
        description="Describe the operational work, related asset, and assignment plan."
        className="mb-6"
      />
      <Suspense>
        <WorkInitiationForm />
      </Suspense>
    </AppLayout>
  );
}

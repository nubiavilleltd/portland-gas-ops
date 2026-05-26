import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardForm from "../../components/IncidentHazardForm";

export default function NewIncidentHazardPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <Link
        href="/safety/incidents"
        className="mb-5 flex items-center gap-2 text-sm text-brand-text-secondary transition-colors hover:text-brand-text-primary"
      >
        <ArrowLeft size={14} />
        Back to Incident &amp; Hazard Reports
      </Link>
      <PageHeader
        title="New Incident/Hazard Report"
        description="Raise a new safety report for HSE review and closure."
        className="mb-6"
      />
      <IncidentHazardForm />
    </AppLayout>
  );
}

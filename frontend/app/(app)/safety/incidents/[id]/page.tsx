"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardDetailsView from "../../components/IncidentHazardDetailsView";

export default function IncidentHazardDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Incident/Hazard Details"
        description="Review report details and simulate HSE closure."
        className="mb-6"
      />
      <IncidentHazardDetailsView
        reportId={params.id}
        initialRole={
          initialRole === "hse" || initialRole === "action_owner" || initialRole === "reporter"
            ? initialRole
            : undefined
        }
      />
    </AppLayout>
  );
}

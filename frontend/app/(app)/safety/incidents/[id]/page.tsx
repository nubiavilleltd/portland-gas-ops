"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardDetailsView from "../../components/IncidentHazardDetailsView";

export default function IncidentHazardDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Incident/Hazard Details">
      <PageHeader
        title="Incident/Hazard Details"
        description="Review report details and simulate HSE closure."
        className="mb-6"
      />
      <IncidentHazardDetailsView reportId={params.id} />
    </AppLayout>
  );
}

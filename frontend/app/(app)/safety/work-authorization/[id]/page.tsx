"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkAuthorizationDetailsView from "../../components/WorkAuthorizationDetailsView";

export default function WorkAuthorizationDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Work Authorization Details">
      <PageHeader
        title="Work Authorization Details"
        description="Review request details and simulate role-based workflow actions."
        className="mb-6"
      />
      <WorkAuthorizationDetailsView requestId={params.id} />
    </AppLayout>
  );
}

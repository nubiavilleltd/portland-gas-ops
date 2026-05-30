"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkInitiationDetailsView from "../components/WorkInitiationDetailsView";

export default function WorkInitiationDetailsPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Initiation Details"
        description="Review operational work details, approvals, and assignment readiness."
        className="mb-6"
      />
      <WorkInitiationDetailsView requestId={params.id} />
    </AppLayout>
  );
}

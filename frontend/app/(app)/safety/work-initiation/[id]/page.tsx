"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkInitiationDetailsView from "../components/WorkInitiationDetailsView";

export default function WorkInitiationDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Initiation Details"
        description="Review operational work details, approvals, and assignment readiness."
        className="mb-6"
      />
      <WorkInitiationDetailsView
        requestId={params.id}
        initialRole={
          initialRole === "supervisor" ||
          initialRole === "operations_hod" ||
          initialRole === "requester"
            ? initialRole
            : undefined
        }
      />
    </AppLayout>
  );
}

"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkAuthorizationDetailsView from "../../components/WorkAuthorizationDetailsView";

export default function WorkAuthorizationDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Authorization Details"
        description="Review request details and simulate role-based workflow actions."
        className="mb-6"
      />
      <WorkAuthorizationDetailsView
        requestId={params.id}
        initialRole={
          initialRole === "hse" || initialRole === "requester" || initialRole === "supervisor"
            ? initialRole
            : undefined
        }
      />
    </AppLayout>
  );
}

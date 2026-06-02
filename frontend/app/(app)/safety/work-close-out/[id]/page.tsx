"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkCloseOutDetailsView from "../../components/WorkCloseOutDetailsView";

export default function WorkCloseOutDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Close-Out Details"
        description="Review completed work and simulate close-out approval roles."
        className="mb-6"
      />
      <WorkCloseOutDetailsView
        requestId={params.id}
        initialRole={
          initialRole === "supervisor" ||
          initialRole === "operations_head" ||
          initialRole === "hse" ||
          initialRole === "requester"
            ? initialRole
            : undefined
        }
      />
    </AppLayout>
  );
}

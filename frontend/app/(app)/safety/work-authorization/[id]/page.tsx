"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkAuthorizationDetailsView from "../../components/WorkAuthorizationDetailsView";

export default function WorkAuthorizationDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
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

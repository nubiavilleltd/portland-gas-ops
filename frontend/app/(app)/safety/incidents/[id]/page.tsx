"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import IncidentHazardDetailsView from "../../components/IncidentHazardDetailsView";

export default function IncidentHazardDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
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

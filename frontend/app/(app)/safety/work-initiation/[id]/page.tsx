"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkInitiationDetailsView from "../components/WorkInitiationDetailsView";

export default function WorkInitiationDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
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

"use client";

import { useParams, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkCloseOutDetailsView from "../../components/WorkCloseOutDetailsView";

export default function WorkCloseOutDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialRole =
    searchParams.get("from") === "admin" ? searchParams.get("role") : null;

  return (
    <AppLayout pageTitle="Safety & Compliance">
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

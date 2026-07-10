"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkCloseOutDetailsView from "../../components/WorkCloseOutDetailsView";

export default function WorkCloseOutDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <WorkCloseOutDetailsView requestId={params.id} />
    </AppLayout>
  );
}

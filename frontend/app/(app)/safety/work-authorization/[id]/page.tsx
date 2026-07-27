"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkAuthorizationDetailsView from "../../components/WorkAuthorizationDetailsView";

export default function WorkAuthorizationDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <WorkAuthorizationDetailsView requestId={params.id} />
    </AppLayout>
  );
}

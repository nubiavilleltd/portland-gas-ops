"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import WorkInitiationDetailsView from "../components/WorkInitiationDetailsView";

export default function WorkInitiationDetailsPage() {
  const params = useParams<{ id: string }>();

  return (
    <AppLayout pageTitle="Safety & Compliance">
      <WorkInitiationDetailsView requestId={params.id} />
    </AppLayout>
  );
}

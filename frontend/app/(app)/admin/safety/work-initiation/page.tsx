import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkInitiationRequestsTable from "../../../safety/work-initiation/components/WorkInitiationRequestsTable";

export default function AdminWorkInitiationPage() {
  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="All Work Initiations"
        description="Admin view of operational work requests before safety authorization."
      />
      <WorkInitiationRequestsTable scope="admin" />
    </AppLayout>
  );
}

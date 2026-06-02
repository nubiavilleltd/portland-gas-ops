import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkAuthorizationRequestsTable from "../../../safety/components/WorkAuthorizationRequestsTable";

export default function AdminWorkAuthorizationPage() {
  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="All Work Authorizations"
        description="Admin view of safety authorization requests across every approval status."
      />
      <WorkAuthorizationRequestsTable scope="admin" />
    </AppLayout>
  );
}

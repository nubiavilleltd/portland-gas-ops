import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import WorkCloseOutRequestsTable from "../../../safety/components/WorkCloseOutRequestsTable";

export default function AdminWorkCloseOutPage() {
  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="All Work Close-Outs"
        description="Admin view of completed work, monitoring attestations, and close-out approvals."
      />
      <WorkCloseOutRequestsTable scope="admin" />
    </AppLayout>
  );
}

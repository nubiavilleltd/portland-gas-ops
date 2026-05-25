import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Plus } from "lucide-react";
import WorkAuthorizationRequestsTable from "../components/WorkAuthorizationRequestsTable";

export default function WorkAuthorizationPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Authorization"
        description="View facility work requests across every approval status."
        action={
          <Button href="/safety/work-authorization/new" leftIcon={<Plus size={16} />}>
            Create New Request
          </Button>
        }
        className="mb-6"
      />
      <WorkAuthorizationRequestsTable />
    </AppLayout>
  );
}

import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import WorkCloseOutRequestsTable from "../components/WorkCloseOutRequestsTable";

export default function WorkCloseOutPage() {
  return (
    <AppLayout pageTitle="Work Completion & Close-Out">
      <PageHeader
        title="Work Completion & Close-Out"
        description="Confirm completed work, execution monitoring, and final close-out approval."
        action={
          <Button href="/safety/work-close-out/new" leftIcon={<Plus size={16} />}>
            Create Close-Out
          </Button>
        }
        className="mb-6"
      />
      <WorkCloseOutRequestsTable />
    </AppLayout>
  );
}

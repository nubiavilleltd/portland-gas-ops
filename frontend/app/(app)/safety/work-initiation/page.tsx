import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { Plus } from "lucide-react";
import WorkInitiationRequestsTable from "./components/WorkInitiationRequestsTable";

export default function WorkInitiationPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Work Initiation"
        description="Define, review, approve, and assign operational work before safety authorization."
        action={
          <Button href="/safety/work-initiation/new" leftIcon={<Plus size={16} />}>
            Create Work Initiation
          </Button>
        }
        className="mb-6"
      />
      <WorkInitiationRequestsTable />
    </AppLayout>
  );
}

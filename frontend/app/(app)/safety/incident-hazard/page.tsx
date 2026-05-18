import { Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardReportsTable from "../components/IncidentHazardReportsTable";

export default function IncidentHazardPage() {
  return (
    <AppLayout pageTitle="Incident & Hazard Reports">
      <PageHeader
        title="Incident & Hazard Reports"
        description="Report incidents, hazards, near misses, and HSE corrective actions."
        action={
          <Button href="/safety/incident-hazard/new" leftIcon={<Plus size={16} />}>
            Create Incident/Hazard Report
          </Button>
        }
        className="mb-6"
      />
      <IncidentHazardReportsTable />
    </AppLayout>
  );
}

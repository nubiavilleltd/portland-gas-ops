import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardReportsTable from "../../../safety/components/IncidentHazardReportsTable";

export default function AdminIncidentHazardPage() {
  return (
    <AppLayout pageTitle="Admin">
      <PageHeader
        title="All Incident & Hazard Reports"
        description="Admin view of incident, hazard, near-miss, and HSE corrective-action records."
      />
      <IncidentHazardReportsTable scope="admin" />
    </AppLayout>
  );
}

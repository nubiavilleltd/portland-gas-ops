import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import IncidentHazardForm from "../../components/IncidentHazardForm";

export default function NewIncidentHazardPage() {
  return (
    <AppLayout pageTitle="New Incident/Hazard Report">
      <PageHeader
        title="New Incident/Hazard Report"
        description="Raise a new safety report for HSE review and closure."
        className="mb-6"
      />
      <IncidentHazardForm />
    </AppLayout>
  );
}

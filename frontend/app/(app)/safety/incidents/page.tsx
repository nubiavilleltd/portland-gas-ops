import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

export default function IncidentsPage() {
  return (
    <AppLayout pageTitle="Incidents">
      <PageHeader
        title="Incidents"
        description="Incident & near-miss reporting"
      />
      <div className="mt-8 flex items-center justify-center p-12 bg-white rounded-xl border border-brand-border">
        <div className="text-center">
          <h3 className="text-lg font-medium text-brand-text-primary">Coming Soon</h3>
          <p className="text-brand-text-secondary mt-2">This module is currently under development.</p>
        </div>
      </div>
    </AppLayout>
  );
}

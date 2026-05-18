import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

const safetyProcesses = [
  {
    title: "Work Authorization",
    description: "Request and approve work before it starts",
    href: "/safety/work-authorization",
    icon: <ClipboardCheck className="h-5 w-5 md:h-6 md:w-6" />,
  },
  {
    title: "Work Completion & Close-Out",
    description: "Confirm completed work, monitoring, and final close-out approval",
    href: "/safety/work-close-out",
    icon: <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />,
  },
  {
    title: "Incident & Hazard Report",
    description: "Report incidents, hazards, near misses, and HSE corrective actions",
    href: "/safety/incident-hazard",
    icon: <AlertTriangle className="h-5 w-5 md:h-6 md:w-6" />,
  },
  {
    title: "Regulatory Compliance",
    description: "Raise compliance requests, certifications, inspections, and HSE approvals",
    href: "/safety/regulatory-compliance",
    icon: <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />,
  },
];

export default function SafetyPage() {
  return (
    <AppLayout pageTitle="Safety & Compliance">
      <PageHeader
        title="Safety & Compliance"
        description="Work authorizations, compliance processes, and close-outs"
      />

      <div className="mt-8 rounded-xl border border-brand-border bg-white p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-brand-text-primary">
            Safety Processes
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Select a process to start or manage a safety and compliance request.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {safetyProcesses.map((process) => (
            <Card
              key={process.href}
              title={process.title}
              description={process.description}
              href={process.href}
              icon={process.icon}
              className="h-full"
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

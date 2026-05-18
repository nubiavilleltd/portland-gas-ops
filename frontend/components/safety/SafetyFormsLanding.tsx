"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ModuleCard from "@/components/ui/ModuleCard";
import PageHeader from "@/components/ui/PageHeader";

interface FormLink {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

const safetyForms: FormLink[] = [
  {
    name: "Work Authorization",
    description: "Request approval before starting controlled work.",
    icon: ShieldCheck,
    href: "/safety/work-authorization",
  },
  {
    name: "Work Completion & Close-Out",
    description: "Close out approved work after safe completion.",
    icon: ClipboardCheck,
    href: "/safety/work-completion-closeout",
  },
  {
    name: "Regulatory Compliance",
    description: "Raise compliance items for HSE review.",
    icon: FileSearch,
    href: "/safety/regulatory-compliance",
  },
];

const incidentForms: FormLink[] = [
  {
    name: "Incident & Hazard Report",
    description: "Report incidents, hazards, near misses, and unsafe conditions.",
    icon: AlertTriangle,
    href: "/safety/incidents/incident-hazard-report",
  },
];

interface Props {
  type: "safety" | "incidents";
}

export default function SafetyFormsLanding({ type }: Props) {
  const isIncidents = type === "incidents";
  const forms = isIncidents ? incidentForms : safetyForms;

  return (
    <AppLayout pageTitle={isIncidents ? "Incidents" : "Safety & Compliance"}>
      <PageHeader
        title={isIncidents ? "Incidents" : "Safety & Compliance"}
        description={
          isIncidents
            ? "Open an incident or hazard report."
            : "Open a safety workflow form."
        }
        className="mb-6"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {forms.map((form) => (
          <ModuleCard
            key={form.href}
            name={form.name}
            description={form.description}
            icon={form.icon}
            href={form.href}
          />
        ))}
      </div>
    </AppLayout>
  );
}

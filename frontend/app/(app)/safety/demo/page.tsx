"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  FileStack,
  Plus,
  ShieldCheck,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const incidentTypeOptions = [
  { value: "near_miss", label: "near_miss" },
  { value: "injury", label: "injury" },
  { value: "gas_leak", label: "gas_leak" },
  { value: "equipment_damage", label: "equipment_damage" },
  { value: "environmental", label: "environmental" },
  { value: "fire_event", label: "fire_event" },
  { value: "security", label: "security" },
];

const priorityOptions = [
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
];

export default function SafetyDemoPage() {
  const [loading, setLoading] = useState(false);
  const [incidentDate, setIncidentDate] = useState("2026-05-15");
  const [incidentType, setIncidentType] = useState("near_miss");
  const [priority, setPriority] = useState("medium");

  async function simulateSave() {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLoading(false);
  }

  return (
    <AppLayout pageTitle="Safety Demo">
      <PageHeader
        title="Safety UI Demo"
        description="A lightweight playground to test the new reusable button, card, date picker, and searchable select."
        action={
          <Button href="/safety" variant="outline">
            Back to Safety
          </Button>
        }
        className="mb-6"
      />

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-brand-text-primary">Buttons</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button leftIcon={<Plus size={16} />}>Primary</Button>
            <Button variant="secondary" leftIcon={<CheckCircle2 size={16} />}>
              Secondary
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading loadingText="Saving..." />
            <Button disabled rightIcon={<Calendar size={16} />}>
              Disabled
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Custom Override
            </Button>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-text-primary">Cards</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card
              title="Permit Monitoring"
              description="Track site permits, approvals, and renewal deadlines."
              icon={<ShieldCheck size={22} />}
              content={
                <p className="mt-4 text-sm text-brand-text-secondary">
                  This is the default reusable card with icon, title, description,
                  and custom body content.
                </p>
              }
            />

            <Card
              title="Incident Register"
              description="Open the shared log for active investigations."
              icon={<FileStack size={22} />}
              href="/safety"
              action={
                <span className="rounded-full bg-brand-purple-faint px-2.5 py-1 text-xs font-medium text-brand-purple">
                  Clickable
                </span>
              }
              content={
                <p className="mt-4 text-sm text-brand-text-secondary">
                  This card uses `href` and an `action` area.
                </p>
              }
            />

            <Card
              title="Custom Styled Card"
              description="Cards also accept class overrides for special cases."
              icon={<Calendar size={22} />}
              className="border-emerald-200 bg-emerald-50/60"
              iconWrapperClassName="bg-emerald-100 text-emerald-700"
              content={
                <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-brand-text-secondary">
                  Use this for highlighted notices, stat panels, or module entry cards.
                </div>
              }
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-brand-text-primary">Form Controls</h2>
          <div className="mt-4 max-w-3xl rounded-2xl border border-brand-border bg-white p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <FormInput
                label="Report Title"
                placeholder="e.g. Compressor room gas leak"
                hint="Regular inputs continue to work beside the new controls."
              />

              <FormDatePicker
                label="Incident Date"
                value={incidentDate}
                onValueChange={setIncidentDate}
                max="2026-12-31"
                hint="Styled after the alumni app calendar trigger and popover pattern."
              />

              <FormSelect
                label="Incident Type"
                options={incidentTypeOptions}
                value={incidentType}
                onValueChange={setIncidentType}
                hint="Search turns on automatically here because there are more than 5 options."
              />

              <FormSelect
                label="Priority"
                options={priorityOptions}
                value={priority}
                onValueChange={setPriority}
                hint="Search stays off by default here because there are only 3 options."
              />
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-brand-text-secondary">
              <p>
                <span className="font-medium text-brand-text-primary">Selected date:</span>{" "}
                {incidentDate || "None"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-brand-text-primary">Incident type:</span>{" "}
                {incidentType}
              </p>
              <p className="mt-1">
                <span className="font-medium text-brand-text-primary">Priority:</span>{" "}
                {priority}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => {
                setIncidentDate("2026-05-15");
                setIncidentType("near_miss");
                setPriority("medium");
              }}>
                Reset Demo State
              </Button>
              <Button loading={loading} loadingText="Saving Demo..." onClick={simulateSave}>
                Simulate Save
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

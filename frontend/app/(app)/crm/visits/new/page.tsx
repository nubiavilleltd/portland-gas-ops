"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import Button from "@/components/ui/Button";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import { useCustomerVisits } from "@/lib/modules/crm";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import { useCustomerContactsByCustomer } from "@/lib/modules/crm";

import { useToast } from "@/hooks/useToast";
import { useCustomerOnboarding } from "@/lib/modules/crm";

export default function NewCustomerVisitsPage() {
  const router = useRouter();
  const toast = useToast();

  const { data: customers = [] } = useCustomerOnboarding();

  const customerOptions = useMemo(
    () =>
      customers
        .filter((c) => c.customer_status === "active")
        .map((customer) => ({
          label: customer.customer_name,
          value: customer.id,
        })),
    [customers],
  );
  const { data: customerVisits = [] } = useCustomerVisits();
  const [form, setForm] = useState({
    customerId: "",
    contact_person: "",
    visitType: "Sales",
    relatedVisitId: "",
    visitDateTime: "",
    location: "",
    purpose: "",
  });

  const previousVisitOptions = useMemo(() => {
    return customerVisits
      .filter(
        (visit) =>
          visit.customer_id === form.customerId && visit.status !== "Scheduled",
      )
      .map((visit) => ({
        value: visit.id,
        visitNumber: visit.visit_number,
        visitType: visit.visit_type,
        visitDate: visit.visit_date,
        status: visit.status,
      }));
  }, [form.customerId]);

  function submit() {
    console.log(form);

    toast.success("Customer visit scheduled successfully.");

    setTimeout(() => {
      router.push("/crm/visits");
    }, 800);
  }

  const { data: customerContacts } = useCustomerContactsByCustomer(
    form.customerId,
  );

  const contactOptions = useMemo(() => {
    if (!customerContacts) return [];

    return [
      customerContacts.primary_contact,
      ...customerContacts.additional_contacts,
    ].map((contact) => ({
      value: contact.id,
      label: `${contact.first_name} ${contact.last_name}`,
    }));
  }, [customerContacts]);

  return (
    <AppLayout pageTitle="Schedule Visit">
      <BackButton href="/crm/visits" label="Back to Visits" />

      <PageHeader
        title="Schedule Customer Visit"
        description="Schedule a visit for an existing customer."
      />

      <div className="space-y-6"></div>

      <FormSection
        title="Visit Information"
        description="Provide visit details."
      >
        <FormSelect
          label="Customer"
          value={form.customerId}
          options={customerOptions}
          placeholder="Select Customer"
          onValueChange={(value) => setForm({ ...form, customerId: value })}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <FormSelect
            label="Visit Type"
            value={form.visitType}
            options={[
              { label: "Sales", value: "Sales" },
              { label: "Courtesy", value: "Courtesy" },
              { label: "Follow-up", value: "Follow-up" },
              { label: "Complaint", value: "Complaint" },
              { label: "Collection", value: "Collection" },
            ]}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                visitType: value,
                relatedVisitId:
                  value === "Follow-up" ? prev.relatedVisitId : "",
              }))
            }
          />

          {form.visitType === "Follow-up" && (
            <FormSelect
              label="Related Visit"
              placeholder="Select previous visit"
              value={form.relatedVisitId}
              options={previousVisitOptions.map((visit) => ({
                value: visit.value,
                label: `${visit.visitNumber} • ${visit.visitType} • ${visit.visitDate} `,
              }))}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  relatedVisitId: value,
                }))
              }
            />
          )}
          <FormSelect
            label="Contact Person"
            value={form.contact_person}
            options={contactOptions}
            placeholder="Select Contact Person"
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                contact_person_id: value,
              }))
            }
          />

          <FormDateTimeInput
            label="Visit Date & Time"
            required
            value={form.visitDateTime}
            min={new Date().toISOString().slice(0, 16)}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                visitDateTime: value,
              }))
            }
          />

          <FormInput
            placeholder="Enter Location"
            label="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <FormTextarea
          label="Purpose of Visit"
          rows={5}
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
        />
      </FormSection>

      <div className="mt-8 flex justify-end gap-3 pb-10">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={submit}>Schedule Visit</Button>
      </div>
    </AppLayout>
  );
}

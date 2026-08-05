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
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useToast } from "@/hooks/useToast";
import { useCustomerOnboarding } from "@/lib/modules/crm";

export default function NewCustomerVisitsPage() {
  const router = useRouter();
  const toast = useToast();

  const { data: customers = [] } = useCustomerOnboarding();

  const customerOptions = useMemo(
    () =>
      customers
        .filter((c: any) => c.customer_status === "active")
        .map((customer: any) => ({
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
    visitObjective: "",
    relatedVisitId: "",
    visitDateTime: "",
    location: "",
    purpose: "",
    participants: "",
    reminderDate: "",
    followUpRequired: false,
    followUpDate: "",
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

    return [...customerContacts.additional_contacts].map((contact) => ({
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

      <div className="space-y-6">
        <FormSection
          title="Visit Information"
          description="Provide the basic visit details."
        >
          <FormSelect
            label="Customer"
            value={form.customerId}
            options={customerOptions}
            placeholder="Select Customer"
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                customerId: value,
              }))
            }
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
              <div className="mt-6">
                <FormSelect
                  label="Related Visit"
                  placeholder="Select previous visit"
                  value={form.relatedVisitId}
                  options={previousVisitOptions.map((visit) => ({
                    value: visit.value,
                    label: `${visit.visitNumber} • ${visit.visitType} • ${visit.visitDate}`,
                  }))}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      relatedVisitId: value,
                    }))
                  }
                />
              </div>
            )}
            {/* <FormSelect
            label="Visit Objective"
            value={form.purpose}
            options={[
              { label: "New Business", value: "New Business" },
              { label: "Contract Renewal", value: "Contract Renewal" },
              {
                label: "Relationship Management",
                value: "Relationship Management",
              },
              { label: "Complaint Resolution", value: "Complaint Resolution" },
              { label: "Payment Collection", value: "Payment Collection" },
              { label: "Technical Support", value: "Technical Support" },
            ]}
            onValueChange={(value) =>
              setForm((prev) => ({
                ...prev,
                visitObjective: value,
              }))
            }
          /> */}

            <FormSelect
              label="Contact Person"
              value={form.contact_person}
              options={contactOptions}
              placeholder="Select Contact Person"
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  contact_person: value,
                }))
              }
            />

            <FormDateTimeInput
              label="Visit Date & Time"
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
              label="Location"
              placeholder="Enter visit location"
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
            />

            <FormTextarea
              label="Purpose of Visit"
              rows={5}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />
            <FormTextarea
              label="Participants"
              rows={3}
              placeholder="Enter participant names separated by commas"
              value={form.participants}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  participants: e.target.value,
                }))
              }
            />
          </div>
        </FormSection>

        <FormSection
          title="Planning"
          description="Additional scheduling information."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormDatePicker
              label="Reminder Date"
              value={form.reminderDate}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  reminderDate: value,
                }))
              }
            />

            <FormSelect
              label="Follow-up Required?"
              value={form.followUpRequired ? "Yes" : "No"}
              options={[
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ]}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  followUpRequired: value === "Yes",
                }))
              }
            />

            {form.followUpRequired && (
              <FormDatePicker
                label="Expected Follow-up Date"
                value={form.followUpDate}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    followUpDate: value,
                  }))
                }
              />
            )}
          </div>
        </FormSection>
      </div>
      <div className="mt-8 flex justify-end gap-3 pb-10">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={submit}>Schedule Visit</Button>
      </div>
    </AppLayout>
  );
}

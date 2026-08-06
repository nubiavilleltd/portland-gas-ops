"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import Button from "@/components/ui/Button";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import {
  useCustomerContactDetails,
  useCustomerVisits,
  useCustomerOnboarding,
  useCreateCustomerVisit,
} from "@/lib/modules/crm";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  validateVisit,
  buildVisitPayload,
} from "@/lib/modules/crm/utils/visit";

export default function NewCustomerVisitsPage() {
  const router = useRouter();
  const toast = useToast();
  const createVisit = useCreateCustomerVisit();
  const { data: customers = [] } = useCustomerOnboarding();
  const { user } = useCurrentUser();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const customerOptions = useMemo(() => {
    const filtered = customers.filter((customer: any) => {
      const isVisible = isAdmin || customer.created_by === user?.employee?.id;

      const isActive =
        customer.status === "approved" ||
        customer.status === "active" ||
        customer.customer_status === "active";

      return isVisible && isActive;
    });

    return filtered.map((customer: any) => ({
      label: customer.customer_name,
      value: customer.id,
    }));
  }, [customers, isAdmin, user]);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  async function submit() {
    const { valid, errors } = validateVisit(form);

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }
    try {
      await createVisit.mutateAsync(buildVisitPayload(form));

      toast.success("Customer visit scheduled successfully.");
      router.push("/crm/visits");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ??
          "Failed to schedule customer visit.",
      );
    }
  }

  const { data: customerContacts = [], isLoading: contactsLoading } =
    useCustomerContactDetails(form.customerId);

  const contactOptions = useMemo(() => {
    return [...customerContacts]
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((contact) => ({
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
            required
            error={errors.customerId}
            onValueChange={(value) => {
              setForm((prev) => ({
                ...prev,
                customerId: value,
                contact_person: "",
                relatedVisitId: "",
              }));

              setErrors((prev) => ({
                ...prev,
                customerId: "",
                contact_person: "",
                relatedVisitId: "",
              }));
            }}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormSelect
              label="Visit Type"
              value={form.visitType}
              required
              error={errors.visitType}
              options={[
                { label: "Sales", value: "Sales" },
                { label: "Courtesy", value: "Courtesy" },
                { label: "Follow-up", value: "Follow-up" },
                { label: "Complaint", value: "Complaint" },
                { label: "Collection", value: "Collection" },
              ]}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  visitType: value,
                  relatedVisitId:
                    value === "Follow-up" ? prev.relatedVisitId : "",
                }));

                setErrors((prev) => ({
                  ...prev,
                  visitType: "",
                  relatedVisitId: "",
                }));
              }}
            />
            {form.visitType === "Follow-up" && (
              <div className="mt-6">
                <FormSelect
                  label="Related Visit"
                  placeholder={
                    previousVisitOptions.length === 0
                      ? "No completed visits available"
                      : "Select previous visit"
                  }
                  disabled={previousVisitOptions.length === 0}
                  value={form.relatedVisitId}
                  required
                  error={errors.relatedVisitId}
                  options={previousVisitOptions.map((visit) => ({
                    value: visit.value,
                    label: `${visit.visitNumber} • ${visit.visitType} • ${visit.visitDate}`,
                  }))}
                  onValueChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      relatedVisitId: value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      relatedVisitId: "",
                    }));
                  }}
                />
              </div>
            )}
            <FormSelect
              label="Contact Person"
              value={form.contact_person}
              options={contactOptions}
              placeholder="Select Contact Person"
              disabled={!form.customerId || contactsLoading}
              required
              error={errors.contact_person}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  contact_person: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  contact_person: "",
                }));
              }}
            />

            <FormDateTimeInput
              label="Visit Date & Time"
              value={form.visitDateTime}
              required
              error={errors.visitDateTime}
              min={new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 16)}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  visitDateTime: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  visitDateTime: "",
                }));
              }}
            />
            <FormInput
              label="Location"
              placeholder="Enter visit location"
              value={form.location}
              required
              error={errors.location}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  location: e.target.value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  location: "",
                }));
              }}
            />

            <FormTextarea
              label="Purpose of Visit"
              rows={5}
              value={form.purpose}
              required
              error={errors.purpose}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  purpose: e.target.value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  purpose: "",
                }));
              }}
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
              min={new Date().toISOString().split("T")[0]}
              max={form.visitDateTime?.split("T")[0]}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  reminderDate: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  reminderDate: "",
                }));
              }}
            />
            <FormSelect
              label="Follow-up Required?"
              value={form.followUpRequired ? "Yes" : "No"}
              options={[
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ]}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  followUpRequired: value === "Yes",
                  followUpDate: value === "Yes" ? prev.followUpDate : "",
                }));

                setErrors((prev) => ({
                  ...prev,
                  followUpDate: "",
                }));
              }}
            />

            {form.followUpRequired && (
              <FormDatePicker
                label="Expected Follow-up Date"
                required
                error={errors.followUpDate}
                value={form.followUpDate}
                min={
                  form.visitDateTime
                    ? (() => {
                        const date = new Date(form.visitDateTime);
                        date.setDate(date.getDate() + 7);
                        return date.toISOString().split("T")[0];
                      })()
                    : undefined
                }
                onValueChange={(value) => {
                  setForm((prev) => ({
                    ...prev,
                    followUpDate: value,
                  }));

                  setErrors((prev) => ({
                    ...prev,
                    followUpDate: "",
                  }));
                }}
              />
            )}
          </div>
        </FormSection>
      </div>
      <div className="mt-8 flex justify-start gap-3 pb-10">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={createVisit.isPending}
        >
          Cancel
        </Button>

        <Button loading={createVisit.isPending} onClick={submit}>
          Schedule Visit
        </Button>
      </div>
    </AppLayout>
  );
}

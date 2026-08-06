"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import {
  useCustomerVisitDetails,
  useUpdateCustomerVisit,
  useCRMActivityByCustomer,
} from "@/lib/modules/crm";
import FormSection from "@/components/ui/FormSection";
import FormTextarea from "@/components/forms/FormTextarea";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import { useToast } from "@/hooks/useToast";
import FormDateTimeInput from "@/components/forms/FormDateTimeInput";
import {
  validateVisitCompletion,
  buildVisitUpdatePayload,
} from "@/lib/modules/crm/utils/visit";
import CRMActivityTimeline from "@/lib/modules/crm/components/CRMActivityTimeline";
import { formatDateTime } from "@/lib/modules/crm/utils";

export default function CustomerVisitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: visit, isLoading, isError } = useCustomerVisitDetails(id);
  const toast = useToast();
  const updateVisit = useUpdateCustomerVisit();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    outcome: "",
    nextAction: "",
    status: "Completed",
    comment: "",

    customerFeedback: "",
    discussionPoints: "",
    recommendations: "",

    opportunityCreated: false,
    opportunityValue: "",
    opportunityNotes: "",
  });
  useEffect(() => {
    if (!visit) return;

    setForm({
      outcome: visit.outcome ?? "",
      nextAction: visit.next_action ?? "",
      status: visit.status,
      comment: visit.comment ?? "",

      customerFeedback: visit.customer_feedback ?? "",
      discussionPoints: visit.customer_comments ?? "",
      recommendations: visit.recommendation ?? "",

      opportunityCreated: visit.opportunity_identified ?? false,
      opportunityValue: visit.opportunity_value?.toString() ?? "",
      opportunityNotes: visit.opportunity_notes ?? "",
    });
  }, [visit]);
  const { entries } = useCRMActivityByCustomer(visit?.customer_id);

  if (isLoading) {
    return (
      <AppLayout pageTitle="Visit Details">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  async function handleCompleteVisit() {
    const { valid, errors } = validateVisitCompletion(form);

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    try {
      await updateVisit.mutateAsync({
        id,
        data: buildVisitUpdatePayload(form),
      });

      toast.success("Customer visit updated successfully.");

      router.push("/crm/visits");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ?? "Failed to update customer visit.",
      );
    }
  }

  const crmRoles: MockUserRoleOption<"sales_executive">[] = [
    {
      value: "sales_executive",
      label: "Sales Executive",
    },
  ];
  if (isError || !visit) {
    return (
      <AppLayout pageTitle="Visit Details">
        <div className="py-20 text-center text-brand-text-secondary">
          Visit not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Visit Details">
      <BackButton href="/crm/visits" label="Back to Visits" />
      <div className="mb-3">
        <RoleBasedRecordHeader
          id={visit.visit_number}
          currentRole="sales_executive"
          roles={crmRoles}
          onRoleChange={() => {}}
          roleLabel="Sales Executive"
          recordLabel={visit.customer_name}
          status={<ApprovalBadge status={visit.status.toLowerCase()} />}
          showRoleSwitcher={false}
        />
      </div>
      <div className="mb-3">
        <RequesterDetailsSection
          requester={{
            desc: "Information about the user who created this visit record.",
            name: visit.created_by,
            department: "Commercial",
            role: "Sales Executive",
            requestDate: formatDateTime(visit.created_at),
          }}
        />
      </div>
      <div className="space-y-6">
        <FormSection
          title="Visit Information"
          description="Basic details of the scheduled visit."
        >
          <FormSelect
            label="Customer"
            value={visit.customer_id}
            options={[
              {
                label: visit.customer_name,
                value: visit.customer_id,
              },
            ]}
            disabled
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormSelect
              label="Visit Type"
              value={visit.visit_type}
              options={[{ label: visit.visit_type, value: visit.visit_type }]}
              disabled
            />

            <FormInput
              label="Contact Person"
              value={visit.contact_person}
              disabled
            />

            <FormDateTimeInput
              label="Visit Date"
              value={visit.visit_date}
              disabled
            />

            <FormInput label="Location" value={visit.location} disabled />

            <FormTextarea
              label="Purpose of Visit"
              value={visit.purpose}
              rows={5}
              disabled
            />

            <FormTextarea
              label="Participants"
              value={visit.participants}
              rows={3}
              disabled
            />
          </div>
        </FormSection>
        {visit.visit_type === "Follow-up" && (
          <FormSection
            title="Related Visit"
            description="Previous visit associated with this follow-up."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <FormInput
                label="Visit Number"
                value={visit.related_visit_number}
                disabled
              />

              <FormInput
                label="Visit Type"
                value={visit.related_visit_type}
                disabled
              />

              <FormDatePicker
                label="Visit Date"
                value={visit.related_visit_date}
                disabled
              />

              <FormSelect
                label="Visit Status"
                value={visit.related_visit_status}
                options={[
                  {
                    label: visit.related_visit_status,
                    value: visit.related_visit_status,
                  },
                ]}
                disabled
              />
            </div>
          </FormSection>
        )}
        <FormSection
          title="Planning"
          description="Additional scheduling information."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormDatePicker
              label="Reminder Date"
              value={visit.reminder_date}
              disabled
            />

            <FormSelect
              label="Follow-up Required"
              value={visit.follow_up_required ? "Yes" : "No"}
              options={[
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ]}
              disabled
            />

            {visit.follow_up_required && (
              <FormDatePicker
                label="Expected Follow-up Date"
                value={visit.follow_up_date}
                disabled
              />
            )}
          </div>
        </FormSection>
        {visit.status === "Scheduled" ? (
          <>
            <FormSection
              title="Visit Outcome"
              description="Complete the visit by providing the outcome and next action."
            >
              <div className="space-y-6">
                <FormTextarea
                  label="Outcome"
                  rows={5}
                  value={form.outcome}
                  error={errors.outcome}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      outcome: e.target.value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      outcome: "",
                    }));
                  }}
                />
                <FormTextarea
                  label="Customer Feedback"
                  rows={4}
                  value={form.customerFeedback}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customerFeedback: e.target.value,
                    }))
                  }
                />

                <FormTextarea
                  label="Key Discussion Points"
                  rows={4}
                  value={form.discussionPoints}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      discussionPoints: e.target.value,
                    }))
                  }
                />

                <FormTextarea
                  label="Recommendations"
                  rows={4}
                  value={form.recommendations}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      recommendations: e.target.value,
                    }))
                  }
                />

                <FormTextarea
                  label="Next Action"
                  rows={4}
                  error={errors.nextAction}
                  required
                  value={form.nextAction}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      nextAction: e.target.value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      nextAction: "",
                    }));
                  }}
                />
                <FormTextarea
                  label="Comment"
                  rows={3}
                  placeholder="Add any additional observations or notes..."
                  value={form.comment}
                  error={errors.comment}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      comment: "",
                    }));
                  }}
                />
                <FormSelect
                  label="Visit Status"
                  value={form.status}
                  options={[
                    { label: "Completed", value: "Completed" },
                    { label: "Scheduled", value: "Scheduled" },
                    {
                      label: "Follow-up Required",
                      value: "Follow-up Required",
                    },
                    { label: "Cancelled", value: "Cancelled" },
                  ]}
                  onValueChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      status: value,
                    }));

                    setErrors((prev) => ({
                      ...prev,
                      outcome: "",
                      nextAction: "",
                      comment: "",
                    }));
                  }}
                />
              </div>
            </FormSection>

            {form.status !== "Cancelled" && (
              <FormSection
                title="Sales Opportunity"
                description="Capture any opportunity identified during the visit."
              >
                <FormSelect
                  label="Opportunity Created?"
                  value={form.opportunityCreated ? "Yes" : "No"}
                  options={[
                    { label: "Yes", value: "Yes" },
                    { label: "No", value: "No" },
                  ]}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      opportunityCreated: value === "Yes",
                      opportunityValue:
                        value === "Yes" ? prev.opportunityValue : "",
                      opportunityNotes:
                        value === "Yes" ? prev.opportunityNotes : "",
                    }))
                  }
                />
                {form.opportunityCreated && (
                  <>
                    <FormInput
                      label="Opportunity Value"
                      value={form.opportunityValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          opportunityValue: e.target.value,
                        }))
                      }
                    />
                    <FormTextarea
                      label="Opportunity Notes"
                      rows={4}
                      value={form.opportunityNotes}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          opportunityNotes: e.target.value,
                        }))
                      }
                    />
                  </>
                )}
              </FormSection>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={updateVisit.isPending}
              >
                Cancel
              </Button>

              <Button
                onClick={handleCompleteVisit}
                loading={updateVisit.isPending}
              >
                Update Visit
              </Button>
            </div>
          </>
        ) : (
          <>
            <FormSection
              title="Visit Outcome"
              description="Outcome recorded after the visit."
            >
              <div className="space-y-6">
                {visit.status !== "Cancelled" && (
                  <>
                    <FormTextarea
                      label="Outcome"
                      value={visit.outcome}
                      rows={5}
                      disabled
                    />

                    <FormTextarea
                      label="Customer Feedback"
                      value={visit.customer_feedback}
                      rows={4}
                      disabled
                    />

                    <FormTextarea
                      label="Key Discussion Points"
                      value={visit.customer_comments}
                      rows={4}
                      disabled
                    />

                    <FormTextarea
                      label="Recommendations"
                      value={visit.recommendation}
                      rows={4}
                      disabled
                    />
                  </>
                )}
                <FormTextarea
                  label="Next Action"
                  value={visit.next_action}
                  rows={4}
                  disabled
                />

                <FormTextarea
                  label="Comment"
                  value={visit.comment}
                  rows={3}
                  disabled
                />

                <FormSelect
                  label="Visit Status"
                  value={visit.status}
                  options={[
                    {
                      label: visit.status,
                      value: visit.status,
                    },
                  ]}
                  disabled
                />
              </div>
            </FormSection>

            {(visit.opportunity_identified ||
              visit.opportunity_value ||
              visit.opportunity_notes) && (
              <FormSection
                title="Sales Opportunity"
                description="Opportunity identified during the visit."
              >
                <div className="space-y-6">
                  <FormSelect
                    label="Opportunity Created?"
                    value={visit.opportunity_identified ? "Yes" : "No"}
                    options={[
                      { label: "Yes", value: "Yes" },
                      { label: "No", value: "No" },
                    ]}
                    disabled
                  />

                  {visit.opportunity_identified && (
                    <>
                      <FormInput
                        label="Opportunity Value"
                        value={visit.opportunity_value?.toString() ?? ""}
                        disabled
                      />

                      <FormTextarea
                        label="Opportunity Notes"
                        value={visit.opportunity_notes ?? ""}
                        rows={4}
                        disabled
                      />
                    </>
                  )}
                </div>
              </FormSection>
            )}
          </>
        )}
        <FormSection
          title="Activity"
          description="Timeline of actions taken on this customer"
        >
          <CRMActivityTimeline
            entries={entries.filter(
              (item) =>
                item?.entity_type == "visit" && item?.entity_id == visit.id,
            )}
          />
        </FormSection>
      </div>
    </AppLayout>
  );
}

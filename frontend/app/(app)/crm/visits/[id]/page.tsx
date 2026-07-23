"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import { useCustomerVisitDetails } from "@/lib/modules/crm";
import FormSection from "@/components/ui/FormSection";
import FormTextarea from "@/components/forms/FormTextarea";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import { useToast } from "@/hooks/useToast";
import AuditTrail from "@/components/forms/AuditTrail";

export default function CustomerVisitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: visit, isLoading, isError } = useCustomerVisitDetails(id);
  const toast = useToast();
  const [outcome, setOutcome] = useState(visit?.outcome ?? "");
  const [nextAction, setNextAction] = useState(visit?.next_action ?? "");
  const [status, setStatus] = useState("Completed");
  const [comment, setComment] = useState("");
  if (isLoading) {
    return (
      <AppLayout pageTitle="Visit Details">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  function handleCompleteVisit() {
    console.log({
      outcome,
      nextAction,
      status,
      comment,
    });

    toast.success("Customer visit updated successfully.");

    setTimeout(() => {
      router.push("/crm/visits");
    }, 800);
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
          recordLabel="Customer Visit"
          status={<ApprovalBadge status={visit.status?.toLowerCase()} />}
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
            requestDate: visit.created_at,
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
            {visit.visit_type === "Follow-up" && (
              <FormInput
                label="Related Visit"
                value={
                  visit.related_visit_number
                    ? `${visit.related_visit_number} • ${visit.related_visit_type} • ${visit.related_visit_date} • ${visit.related_visit_status}`
                    : "-"
                }
                disabled
              />
            )}
            <FormInput
              label="Contact Person"
              value={visit.contact_person}
              disabled
            />

            <FormDatePicker
              label="Visit Date"
              value={visit.visit_date}
              disabled
            />

            <FormInput label="Visit Time" value={visit.visit_time} disabled />

            <FormInput label="Location" value={visit.location} disabled />
          </div>

          <FormTextarea
            label="Purpose of Visit"
            value={visit.purpose}
            rows={5}
            disabled
          />
        </FormSection>

        {visit.status === "Scheduled" ? (
          <FormSection
            title="Visit Outcome"
            description="Complete the visit by providing the outcome and next action."
          >
            <div className="space-y-6">
              <FormTextarea
                label="Outcome"
                rows={5}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />

              <FormTextarea
                label="Next Action"
                rows={4}
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
              />
              <FormTextarea
                label="Comment"
                rows={3}
                placeholder="Add any additional observations or notes..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <FormSelect
                label="Visit Status"
                value={status}
                options={[
                  {
                    label: "Completed",
                    value: "Completed",
                  },
                  {
                    label: "Follow-up Required",
                    value: "Follow-up Required",
                  },
                  {
                    label: "Cancelled",
                    value: "Cancelled",
                  },
                ]}
                onValueChange={setStatus}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>

                <Button onClick={handleCompleteVisit}>Update Visit</Button>
              </div>
            </div>
          </FormSection>
        ) : (
          <FormSection
            title="Visit Outcome"
            description="Outcome recorded after the visit."
          >
            <FormTextarea
              label="Outcome"
              value={visit.outcome}
              rows={5}
              disabled
            />

            <FormTextarea
              label="Next Action"
              value={visit.next_action}
              rows={5}
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
          </FormSection>
        )}

        <AuditTrail
          items={(visit.activities ?? []).map((activity) => ({
            action: activity.action.replaceAll("_", " "),
            actor: activity.performedBy,
            role: activity.performedByRole,
            dateTime: activity.performedAt,
            comment: activity.comment ?? "-",
          }))}
        />
      </div>
    </AppLayout>
  );
}

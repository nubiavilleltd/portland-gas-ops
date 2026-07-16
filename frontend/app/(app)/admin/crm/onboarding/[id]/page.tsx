"use client";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter, useParams } from "next/navigation";
import CustomerInformationCard from "@/lib/modules/crm/components/CustomerInformationCard";
import BusinessInformationCard from "@/lib/modules/crm/components/BusinessInformationCard";
import PrimaryContactCard from "@/lib/modules/crm/components/PrimaryContactCard";
import AddressInformationCard from "@/lib/modules/crm/components/AddressInformationCard";
import CommercialInformationCard from "@/lib/modules/crm/components/CommercialInformationCard";
import InternalNotesCard from "@/lib/modules/crm/components/InternalNotesCard";
import CustomerAttachmentsSection from "@/lib/modules/crm/components/CustomerAttachmentsSection";
import AuditTrail from "@/components/forms/AuditTrail";
import ApprovalPanel from "@/components/ui/ApprovalPanel";
import { BackButton } from "@/components/ui/BackButton";
import {
  useCustomerOnboarding,
  useCustomerOnboardingDetails,
} from "@/lib/modules/crm";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import Button from "@/components/ui/Button";
import CustomerAttachmentsCard from "@/lib/modules/crm/components/CustomerAttachmentsCard";
import { useToast } from "@/hooks/useToast";

export default function CustomerOnboardingDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const toast = useToast();

  const { data: customer } = useCustomerOnboardingDetails(id);
  const isReturned = customer?.status?.toLowerCase() === "returned";
  const isDraft = customer?.status?.toLowerCase() === "draft";
  const isAcknowledged = customer?.status?.toLowerCase() === "acknowledged";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const [form, setForm] = useState({
    attachments: {
      cacCertificate: null as File | null,
      tinCertificate: null as File | null,
      vatCertificate: null as File | null,
      businessLogo: null as File | null,
      otherDocuments: [] as File[],
    },
  });
  // Only returned requests can be edited
  const readOnly = !(isReturned || isDraft);
  const crmRoles: MockUserRoleOption<"crm_admin">[] = [
    {
      value: "crm_admin",
      label: "CRM Administrator",
    },
  ];

  function handleChange(
    field: string,
    value:
      | string
      | string[]
      | File
      | File[]
      | null
      | {
          cacCertificate: File | null;
          tinCertificate: File | null;
          vatCertificate: File | null;
          businessLogo: File | null;
          otherDocuments: File[];
        },
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  }

  if (!customer) return null;

  return (
    <AppLayout pageTitle="Customer Onboarding Details">
      <div className="flex justify-between mb-2">
        <BackButton
          href="/admin/crm/onboarding"
          label="Back to Customer Onboarding"
        />
        {isAcknowledged && (
          <Button href={`/admin/crm/contacts/${customer.id}`}>
            Manage Contacts
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <RoleBasedRecordHeader
          id={customer.onboarding_number}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel="CRM Administrator"
          roles={crmRoles}
          recordLabel="Customer Onboarding"
          status={<ApprovalBadge status={customer.status} />}
          //nextActor="Sales Manager"
          showRoleSwitcher={false}
        />
        <RequesterDetailsSection
          requester={{
            name: customer.submitted_by,
            department: "Commercial",
            role: "Sales Executive",
            requestDate: customer.submitted_at,
          }}
        />
        <CustomerInformationCard
          readOnly={readOnly}
          values={{
            customerName: customer.customer_name,
            entityType: customer.entity_type,
            category: customer.category,
          }}
        />
        <BusinessInformationCard
          readOnly={readOnly}
          values={{
            rcNumber: customer.rc_number,
            tin: customer.tin,
            vatNumber: customer.vat_number,
            industry: customer.industry,
          }}
        />
        <PrimaryContactCard
          readOnly={readOnly}
          values={{
            contactPerson: customer.contact_person,
            department: customer.department,
            email: customer.email,
            phone: customer.phone,
            alternatePhone: customer.alternate_phone,
          }}
        />
        <AddressInformationCard
          readOnly={readOnly}
          values={{
            country: customer.country,
            state: customer.state,
            city: customer.city,
            addressLine1: customer.address_line1,
            addressLine2: customer.address_line2,
            postalCode: customer.postal_code,
          }}
        />
        <CommercialInformationCard
          readOnly={readOnly}
          values={{
            preferredProducts: customer.preferred_products,
            supplyMethod: customer.supply_method,
            estimatedMonthlyDemand: customer.estimated_monthly_demand,
          }}
        />
        {(isReturned || isDraft) && (
          <CustomerAttachmentsCard
            values={form.attachments}
            onChange={(attachments) => handleChange("attachments", attachments)}
          />
        )}
        {!isReturned && !isDraft && (
          <CustomerAttachmentsSection attachments={customer.attachments} />
        )}
        <InternalNotesCard
          readOnly={readOnly}
          value={customer.internal_notes}
          onChange={() => {}}
        />
        {customer.status === "submitted" && (
          <ApprovalPanel
            reviewingAs="CRM Administrator"
            showReject={false}
            approveLabel="Acknowledge"
            onApprove={() => {
              toast.success(
                "Customer onboarding request has been acknowledged successfully.",
              );

              setTimeout(() => {
                router.push("/admin/crm/onboarding");
              }, 1000);
            }}
            onReturn={() => {
              toast.success(
                "Customer onboarding request has been returned successfully.",
              );

              setTimeout(() => {
                router.push("/admin/crm/onboarding");
              }, 1000);
            }}
          />
        )}
        {(isReturned || isDraft) && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                toast.success(
                  "Customer onboarding request has been resubmitted successfully.",
                );

                router.push("/admin/crm/onboarding");
              }}
            >
              Resubmit
            </Button>
          </div>
        )}
        <AuditTrail
          items={customer.activities.map((activity) => ({
            action: activity.action.replaceAll("_", " "),
            actor: activity.performedBy,
            role: activity.performedByRole,
            dateTime: activity.performedAt,
            comment: activity.comment ?? "-",
          }))}
        />{" "}
      </div>
    </AppLayout>
  );
}

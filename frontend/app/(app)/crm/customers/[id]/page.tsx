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
import { BackButton } from "@/components/ui/BackButton";
import {
  useCustomerOnboardingDetails,
  useCustomerContactDetails,
} from "@/lib/modules/crm";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import Button from "@/components/ui/Button";
import CustomerAttachmentsCard from "@/lib/modules/crm/components/CustomerAttachmentsCard";
import FormSection from "@/components/ui/FormSection";
import AccountManagementCard from "@/lib/modules/crm/components/AccountManagementCard";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer } = useCustomerOnboardingDetails(id);
  const { data: contacts } = useCustomerContactDetails(id);

  const isReturned = customer?.status?.toLowerCase() === "returned";
  const isDraft = customer?.status?.toLowerCase() === "draft";
  const isAcknowledged = customer?.status?.toLowerCase() === "active";
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
    <AppLayout pageTitle="Customer Details">
      <div className="flex justify-between mb-2">
        <BackButton href="/crm/customers" label="Back to Customers" />

        <div>
          <Button
            variant="outline"
            className="mr-2"
            href={`/crm/customers/${customer.id}/edit`}
          >
            Edit Customer
          </Button>
          {isAcknowledged && (
            <Button href={`/crm/contacts/${customer.id}`}>
              Manage Contacts
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <RoleBasedRecordHeader
          id={customer.onboarding_number}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel="CRM Administrator"
          roles={crmRoles}
          recordLabel="Customer Detail"
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
            companyEmail: customer.company_email,
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
        <FormSection
          title="Additional Contacts"
          description="Other contacts assigned to this customer."
        >
          {contacts?.additional_contacts.length ? (
            <div className="overflow-x-auto rounded-lg border border-brand-border">
              <table className="min-w-full divide-y divide-brand-border">
                <thead className="bg-brand-surface">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                      Preferred Channel
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-border bg-white">
                  {contacts.additional_contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-brand-surface/40">
                      <td className="px-4 py-3 font-medium text-sm">
                        {contact.first_name} {contact.last_name}
                      </td>

                      <td className="px-4 py-3 text-sm">
                        {contact.department || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm">{contact.email}</td>

                      <td className="px-4 py-3 text-sm">{contact.phone}</td>

                      <td className="px-4 py-3 text-sm">
                        {contact.preferred_channel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-8 text-center text-sm text-brand-text-secondary">
              No additional contacts available.
            </div>
          )}
        </FormSection>
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
        <AccountManagementCard
          readOnly={readOnly}
          values={{
            customerType: customer.customer_type,
            salesContact: customer.sales_contact,
            referrerType: customer.referrer_type,
            referrerId: customer.referrer,
          }}
          onChange={() => {}}
        />

        <InternalNotesCard
          readOnly={readOnly}
          value={customer.internal_notes}
          onChange={() => {}}
        />
      </div>
    </AppLayout>
  );
}

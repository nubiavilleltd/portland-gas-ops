"use client";
import AppLayout from "@/components/layout/AppLayout";
import { useParams } from "next/navigation";
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
  useActivateCustomer,
  useDeactivateCustomer,
} from "@/lib/modules/crm";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import RequesterDetailsSection from "@/lib/modules/crm/components/RequesterDetailsSection";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import AccountManagementCard from "@/lib/modules/crm/components/AccountManagementCard";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/lib/modules/crm/components/Skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import CRMActivityTimeline from "@/lib/modules/crm/components/CRMActivityTimeline";
import { useCRMActivityByCustomer } from "@/lib/modules/crm";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useCurrentUser();

  const { data: customer, isLoading: customerLoading } =
    useCustomerOnboardingDetails(id);
  const { data: contacts = [] } = useCustomerContactDetails(id);

  const primaryContact = contacts.find((c) => c.is_primary);
  const additionalContacts = contacts.filter((c) => !c.is_primary);
  const { entries } = useCRMActivityByCustomer(id);
  const deactivateCustomerMutation = useDeactivateCustomer();
  const activateCustomerMutation = useActivateCustomer();

  const { data: employees = [], isLoading: employeesLoading } = useEmployees();

  if (customerLoading || employeesLoading) {
    return (
      <AppLayout pageTitle="Customer Details">
        <div className="space-y-6">
          <Skeleton className="h-8 w-60" />

          <div className="rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!customer)
    return (
      <AppLayout pageTitle="Customer Details">Customer not found.</AppLayout>
    );
  const isActive = customer?.status?.toLowerCase() === "active";

  const readOnly = true;
  const crmRoles: MockUserRoleOption<"crm_admin">[] = [
    {
      value: "crm_admin",
      label: "CRM Administrator",
    },
  ];
  const requester = employees.find(
    (employee) => employee.id === customer?.created_by,
  );
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "super_admin";

  const canManage =
    isAdmin || customer.created_by === currentUser?.employee?.id;

  async function activateCustomer() {
    try {
      await activateCustomerMutation.mutateAsync(id);

      toast.success("Customer activated successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ??
          "Failed to activate customer.",
      );
    }
  }

  async function deactivateCustomer() {
    try {
      await deactivateCustomerMutation.mutateAsync(id);

      toast.success("Customer deactivated successfully.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ??
          "Failed to deactivate customer.",
      );
    }
  }

  const canActivateDeactivate = isAdmin;

  return (
    <AppLayout pageTitle="Customer Details">
      <div className="flex justify-between mb-2">
        <BackButton href="/crm/customers" label="Back to Customers" />

        <div>
          {canActivateDeactivate && customer.status !== "inactive" && (
            <Button
              variant="outline"
              loading={deactivateCustomerMutation.isPending}
              onClick={deactivateCustomer}
            >
              Deactivate Customer
            </Button>
          )}

          {canActivateDeactivate && customer.status === "inactive" && (
            <Button
              variant="outline"
              loading={activateCustomerMutation.isPending}
              onClick={activateCustomer}
            >
              Activate Customer
            </Button>
          )}
          {canManage && customer.status !== "inactive" && (
            <>
              <Button
                variant="outline"
                className="mr-2 ml-2"
                href={`/crm/customers/${customer.id}/edit`}
              >
                Edit Customer
              </Button>

              {isActive && (
                <Button href={`/crm/contacts/${customer.id}`}>
                  Manage Contacts
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="space-y-6 mb-3">
        <RoleBasedRecordHeader
          id={customer.customer_no}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel={
            requester?.user?.role
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Staff"
          }
          roles={crmRoles}
          recordLabel="Customer Detail"
          status={<ApprovalBadge status={customer.status} />}
          showRoleSwitcher={false}
        />
        <RequesterDetailsSection
          requester={{
            name: requester
              ? `${requester.user?.first_name ?? ""} ${requester.user?.last_name ?? ""}`.trim()
              : "Unknown",
            department: requester?.department ?? "-",
            role: requester?.job_title ?? "-",
            requestDate: formatDateTime(customer.created_at),
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
            rcNumber: customer.rc_number ?? "",
            tin: customer.tin ?? "",
            vatNumber: customer.vat_number ?? "",
            industry: customer.industry ?? "",
          }}
        />
        <PrimaryContactCard
          readOnly={readOnly}
          values={{
            contactPerson: customer.contact_person,
            department: customer.department,
            email: customer.email,
            phone: customer.phone,
            alternatePhone: customer.alternate_phone ?? "",
            position: customer.position ?? "",
            role: customer.role ?? "",
            preferredChannel: customer.preferred_channel ?? "",
          }}
        />
        <FormSection
          title="Additional Contacts"
          description="Other contacts assigned to this customer."
        >
          {additionalContacts.length ? (
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
                  {additionalContacts.map((contact) => (
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
            addressLine2: customer.address_line2 ?? "",
            postalCode: customer.postal_code ?? "",
          }}
        />
        <CommercialInformationCard
          readOnly={readOnly}
          values={{
            preferredProducts: customer.preferred_products ?? "",
            supplyMethod: customer.supply_method ?? "",
            estimatedMonthlyDemand: customer.estimated_monthly_demand ?? "",
          }}
        />
        <AccountManagementCard
          readOnly={readOnly}
          values={{
            customerType: customer.customer_type,
            salesContact: customer.sales_contact ?? "",
            referrerType: customer.referrer_type ?? "",
            referrerId: customer.referrer_id ?? "",
          }}
          onChange={() => {}}
        />

        <InternalNotesCard
          readOnly={readOnly}
          value={customer.internal_notes ?? ""}
          onChange={() => {}}
        />
      </div>

      <FormSection
        title="Activity"
        description="Timeline of actions taken on this customer"
      >
        <CRMActivityTimeline entries={entries} />
      </FormSection>
    </AppLayout>
  );
}

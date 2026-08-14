"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedTabSection from "@/components/ui/RoleBasedTabSection";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import {
  type CustomerContact,
  useCustomerContactDetails,
  useCRMActivityByCustomer,
  useUpdateCustomerContacts,
  useActivateCustomerContact,
  useDeactivateCustomerContact,
  ContactPerson,
  PreferredChannel,
  ContactPersonStatus,
} from "@/lib/modules/crm";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import ContactInformationCard from "@/lib/modules/crm/components/ContactInformationCard";
import EmploymentInformationCard from "@/lib/modules/crm/components/EmploymentInformationCard";
import { useToast } from "@/hooks/useToast";
import CRMActivityTimeline from "@/lib/modules/crm/components/CRMActivityTimeline";
import { useEmployees } from "@/lib/modules/employees/hooks";
import {
  buildUpdateContactsPayload,
  validateContacts2,
} from "@/lib/modules/crm/utils/contact";
import ContactDetailsPageSkeleton from "@/lib/modules/crm/components/ContactDetailsPageSkeleton";
import { Pencil, PowerOff, Power, X, CheckCircle2 } from "lucide-react";

export default function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { data: contacts = [], isLoading } = useCustomerContactDetails(id);
  console.log({ contacts }, "contacts");
  const primaryContact = contacts.find((c) => c.is_primary);
  const { entries } = useCRMActivityByCustomer(id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CustomerContact | null>(null);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const updateContacts = useUpdateCustomerContacts();
  const activateContact = useActivateCustomerContact();
  const deactivateContact = useDeactivateCustomerContact();
  const [statusLoadingId, setStatusLoadingId] = useState<
    number | string | null
  >(null);

  const mapAdditionalContacts = (): ContactPerson[] =>
    contacts
      .filter((c) => !c.is_primary)
      .map((c) => ({
        id: c.id,
        is_primary: c.is_primary,

        first_name: c.first_name,
        last_name: c.last_name,

        email: c.email,

        phone: c.phone,
        alternate_phone: c.alternate_phone ?? "",

        department: c.department ?? "",
        position: c.position ?? "",

        role: c.role ?? "",

        preferred_channel: c.preferred_channel as PreferredChannel,

        status: c.status as ContactPersonStatus,
      }));

  useEffect(() => {
    if (!primaryContact) return;

    setForm({
      ...primaryContact,
      additional_contacts: mapAdditionalContacts(),
    });
  }, [contacts, primaryContact]);

  const crmRoles: MockUserRoleOption<"crm_admin">[] = [
    {
      value: "crm_admin",
      label: "CRM Administrator",
    },
  ];

  async function updateContact() {
    if (!form) return;

    const { valid, errors } = validateContacts2(form, form.additional_contacts);

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    try {
      await updateContacts.mutateAsync({
        customerId: form.customer_id,
        data: buildUpdateContactsPayload(form),
      });

      toast.success("Customer contact updated successfully.");

      setIsEditing(false);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail ?? "Failed to update customer contact.",
      );
    }
  }

  function cancelEdit() {
    if (!primaryContact) return;

    setForm({
      ...primaryContact,
      additional_contacts: mapAdditionalContacts(),
    });

    setErrors({});
    setIsEditing(false);
  }

  async function togglePersonStatus(isPrimary: boolean, index?: number) {
    if (!form) return;

    const contact = isPrimary ? form : form.additional_contacts[index!];

    setStatusLoadingId(contact.id);

    try {
      if (contact.status === "active") {
        await deactivateContact.mutateAsync(contact.id);
      } else {
        await activateContact.mutateAsync(contact.id);
      }
      toast.success("Status updated successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? "Failed to update status.");
    } finally {
      setStatusLoadingId(null);
    }
  }
  if (isLoading) {
    return <ContactDetailsPageSkeleton />;
  }
  if (!primaryContact || !form) return null;
  console.log(form);

  const requester = employees.find(
    (employee) => employee.id === form?.created_by,
  );

  const primaryContactFieldMap = {
    firstName: "first_name",
    lastName: "last_name",
    email: "email",
    phone: "phone",
    alternatePhone: "alternate_phone",
  } as const;

  const primaryEmploymentFieldMap = {
    department: "department",
    position: "position",
    role: "role",
    preferred_channel: "preferred_channel",
  } as const;

  const primaryContactErrorMap = {
    firstName: "primaryFirstName",
    lastName: "primaryLastName",
    email: "primaryEmail",
    phone: "primaryPhone",
  } as const;

  const primaryEmploymentErrorMap = {
    department: "primaryDepartment",
    position: "primaryPosition",
    role: "primaryRole",
    preferred_channel: "primaryPreferredChannel",
  } as const;

  return (
    <AppLayout pageTitle="Customer Contact Details">
      <div className="flex gap-3 justify-between mb-2">
        <BackButton href="/crm/contacts" label="Back to Contacts" />
        {!isEditing && form.status == "active" && (
          <Button
            variant="primary"
            disabled={employeesLoading}
            onClick={() => setIsEditing(true)}
            leftIcon={<Pencil size={14} />}
          >
            Edit
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <RoleBasedTabSection
          id={form.contact_no}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel={
            requester?.user?.role
              ?.replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Staff"
          }
          roles={crmRoles}
          recordLabel={form.customer_name}
          status={<></>}
          showRoleSwitcher={false}
        />

        {/* Primary Contact */}

        <FormSection title="Primary Contact">
          {/* <div className="flex items-center gap-2 justify-between"> */}
          {/* <ApprovalBadge status={form.status} /> */}
          {/* <Button
              variant="outline"
              size="sm"
              disabled={isEditing}
              onClick={() => togglePersonStatus(true)}
              loading={statusLoadingId === form.id}
            >
              {form.status === "active" ? "Deactivate" : "Activate"}
            </Button> */}
          {/* </div> */}
          <ContactInformationCard
            readOnly={!isEditing}
            values={{
              firstName: form.first_name ?? "",
              lastName: form.last_name ?? "",
              email: form.email ?? "",
              phone: form.phone ?? "",
              alternatePhone: form.alternate_phone ?? "",
            }}
            errors={{
              firstName: errors.primaryFirstName,
              lastName: errors.primaryLastName,
              email: errors.primaryEmail,
              phone: errors.primaryPhone,
            }}
            onChange={(field, value) => {
              const errorKey =
                primaryContactErrorMap[
                  field as keyof typeof primaryContactErrorMap
                ];

              if (errorKey) {
                setErrors((prev) => ({
                  ...prev,
                  [errorKey]: "",
                }));
              }

              const apiField =
                primaryContactFieldMap[
                  field as keyof typeof primaryContactFieldMap
                ];

              setForm((prev) => {
                if (!prev) return prev;

                return {
                  ...prev,
                  [apiField]: value,
                };
              });
            }}
          />

          <EmploymentInformationCard
            readOnly={!isEditing}
            values={{
              department: form.department ?? "",
              position: form.position ?? "",
              role: form.role ?? "",
              preferred_channel: form.preferred_channel ?? "",
            }}
            errors={{
              department: errors.primaryDepartment,
              position: errors.primaryPosition,
              role: errors.primaryRole,
              preferred_channel: errors.primaryPreferredChannel,
            }}
            onChange={(field, value) => {
              const errorKey =
                primaryEmploymentErrorMap[
                  field as keyof typeof primaryEmploymentErrorMap
                ];

              if (errorKey) {
                setErrors((prev) => ({
                  ...prev,
                  [errorKey]: "",
                }));
              }

              const apiField =
                primaryEmploymentFieldMap[
                  field as keyof typeof primaryEmploymentFieldMap
                ];

              setForm((prev) => {
                if (!prev) return prev;

                return {
                  ...prev,
                  [apiField]: value,
                };
              });
            }}
          />
        </FormSection>

        {/* Additional Contacts */}
        {form.additional_contacts?.length > 0 && (
          <FormSection
            title="Additional Contacts"
            description="Other contacts linked to this customer."
          >
            <div className="space-y-6">
              {form.additional_contacts?.map((person, index) => (
                <div key={person.id} className="rounded-lg space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <h3 className="font-semibold mr-2">
                        Contact #{index + 2}
                      </h3>
                      <ApprovalBadge status={person.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant={
                          person.status === "active" ? "danger" : "primary"
                        }
                        size="sm"
                        disabled={isEditing}
                        loading={statusLoadingId === person.id}
                        onClick={() => togglePersonStatus(false, index)}
                        leftIcon={
                          person.status === "active" ? (
                            <PowerOff size={14} />
                          ) : (
                            <Power size={14} />
                          )
                        }
                      >
                        {person.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>

                  <ContactInformationCard
                    readOnly={!isEditing}
                    values={{
                      firstName: person.first_name ?? "",
                      lastName: person.last_name ?? "",
                      email: person.email ?? "",
                      phone: person.phone ?? "",
                      alternatePhone: person.alternate_phone ?? "",
                    }}
                    errors={{
                      firstName: errors[`additional_${index}_firstName`],
                      lastName: errors[`additional_${index}_lastName`],
                      email: errors[`additional_${index}_email`],
                      phone: errors[`additional_${index}_phone`],
                    }}
                    onChange={(field, value) => {
                      const errorMap = {
                        firstName: `additional_${index}_firstName`,
                        lastName: `additional_${index}_lastName`,
                        email: `additional_${index}_email`,
                        phone: `additional_${index}_phone`,
                      } as const;

                      const errorKey = errorMap[field as keyof typeof errorMap];

                      if (errorKey) {
                        setErrors((prev) => ({
                          ...prev,
                          [errorKey]: "",
                        }));
                      }

                      const apiField =
                        primaryContactFieldMap[
                          field as keyof typeof primaryContactFieldMap
                        ];

                      setForm((prev) => {
                        if (!prev) return prev;

                        const contacts = [...prev.additional_contacts];

                        contacts[index] = {
                          ...contacts[index],
                          [apiField]: value,
                        };

                        return {
                          ...prev,
                          additional_contacts: contacts,
                        };
                      });
                    }}
                  />

                  <EmploymentInformationCard
                    readOnly={!isEditing}
                    values={{
                      department: person.department ?? "",
                      position: person.position ?? "",
                      role: person.role ?? "",
                      preferred_channel: person.preferred_channel ?? "",
                    }}
                    errors={{
                      department: errors[`additional_${index}_department`],
                      position: errors[`additional_${index}_position`],
                      role: errors[`additional_${index}_role`],
                      preferred_channel:
                        errors[`additional_${index}_preferred_channel`],
                    }}
                    onChange={(field, value) => {
                      const errorMap = {
                        department: `additional_${index}_department`,
                        position: `additional_${index}_position`,
                        role: `additional_${index}_role`,
                        preferred_channel: `additional_${index}_preferred_channel`,
                      } as const;

                      const errorKey = errorMap[field as keyof typeof errorMap];

                      if (errorKey) {
                        setErrors((prev) => ({
                          ...prev,
                          [errorKey]: "",
                        }));
                      }

                      const apiField =
                        primaryEmploymentFieldMap[
                          field as keyof typeof primaryEmploymentFieldMap
                        ];

                      setForm((prev) => {
                        if (!prev) return prev;

                        const contacts = [...prev.additional_contacts];

                        contacts[index] = {
                          ...contacts[index],
                          [apiField]: value,
                        };

                        return {
                          ...prev,
                          additional_contacts: contacts,
                        };
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </FormSection>
        )}
        <div className="flex justify-between pb-3">
          <div className="flex gap-3">
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  leftIcon={<X size={14} />}
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateContact}
                  disabled={updateContacts.isPending}
                  leftIcon={<CheckCircle2 size={15} />}
                >
                  {updateContacts.isPending ? "Updating..." : "Update"}
                </Button>{" "}
              </>
            )}
          </div>
        </div>

        <FormSection
          title="Activity"
          description="Timeline of actions taken on this customer"
        >
          <CRMActivityTimeline
            entries={entries.filter((item) => item?.entity_type == "contact")}
          />
        </FormSection>
      </div>
    </AppLayout>
  );
}

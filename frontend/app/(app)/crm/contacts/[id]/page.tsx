"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import RoleBasedRecordHeader from "@/components/ui/RoleBasedRecordHeader";
import AuditTrail from "@/components/forms/AuditTrail";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import { Trash2, Plus } from "lucide-react";
import {
  useCustomerContactDetails,
  type CustomerContact,
} from "@/lib/modules/crm";
import type { MockUserRoleOption } from "@/components/ui/MockUserSwitcher";
import ContactInformationCard from "@/lib/modules/crm/components/ContactInformationCard";
import EmploymentInformationCard from "@/lib/modules/crm/components/EmploymentInformationCard";
import { useToast } from "@/hooks/useToast";

export default function ContactDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: contact } = useCustomerContactDetails(id);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CustomerContact | null>(null);

  useEffect(() => {
    if (contact) {
      setForm(contact);
    }
  }, [contact]);

  const crmRoles: MockUserRoleOption<"crm_admin">[] = [
    {
      value: "crm_admin",
      label: "CRM Administrator",
    },
  ];

  function updateContact() {
    console.log("UPDATE CONTACT", form);

    // await updateContactApi(form)

    toast.success("Customer contact has been updated successfully.");

    setIsEditing(false);
  }

  function cancelEdit() {
    if (contact) {
      setForm(contact);
    }

    setIsEditing(false);
  }

  function togglePersonStatus(isPrimary: boolean, index?: number) {
    setForm((prev) => {
      if (!prev) return prev;

      if (isPrimary) {
        return {
          ...prev,
          primary_contact: {
            ...prev.primary_contact,
            status:
              prev.primary_contact.status === "active" ? "inactive" : "active",
          },
        };
      }

      const contacts = [...prev.additional_contacts];

      contacts[index!] = {
        ...contacts[index!],
        status: contacts[index!].status === "active" ? "inactive" : "active",
      };

      return {
        ...prev,
        additional_contacts: contacts,
      };
    });

    toast.success("Contact status updated successfully.");
  }
  if (!contact || !form) return null;
  console.log(form);

  return (
    <AppLayout pageTitle="Customer Contact Details">
      <div className="flex gap-3 justify-between mb-2">
        <BackButton href="/crm/contacts" label="Back to Contacts" />
        {!isEditing && form.status == "active" && (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <RoleBasedRecordHeader
          id={form.customer_name}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel="CRM Administrator"
          roles={crmRoles}
          recordLabel="Customer Contact"
          status={<></>}
          showRoleSwitcher={false}
        />

        {/* Primary Contact */}

        <FormSection title="Primary Contact">
          <div className="flex items-center gap-3 justify-between">
            <ApprovalBadge status={form.primary_contact.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => togglePersonStatus(true)}
            >
              {form.primary_contact.status === "active"
                ? "Deactivate"
                : "Activate"}
            </Button>
          </div>
          <ContactInformationCard
            readOnly={!isEditing}
            values={{
              firstName: form.primary_contact.first_name,
              lastName: form.primary_contact.last_name,
              email: form.primary_contact.email,
              phone: form.primary_contact.phone,
              alternatePhone: form.primary_contact.alternate_phone,
            }}
            onChange={(field, value) => {
              setForm((prev) => {
                if (!prev) return prev;

                return {
                  ...prev,
                  primary_contact: {
                    ...prev.primary_contact,
                    [field]: value,
                  },
                };
              });
            }}
          />

          <EmploymentInformationCard
            readOnly={!isEditing}
            values={{
              department: form.primary_contact.department,
              preferred_channel: form.primary_contact.preferred_channel,
            }}
            onChange={(field, value) => {
              setForm((prev) => {
                if (!prev) return prev;

                return {
                  ...prev,
                  primary_contact: {
                    ...prev.primary_contact,
                    [field]: value,
                  },
                };
              });
            }}
          />
        </FormSection>

        {/* Additional Contacts */}

        <FormSection
          title="Additional Contacts"
          description="Other contacts linked to this customer."
        >
          <div className="space-y-6">
            {form.additional_contacts.length === 0 && (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-brand-text-secondary">
                No additional contacts added.
              </div>
            )}

            {form.additional_contacts.map((person, index) => (
              <div
                key={person.id}
                className="rounded-lg border border-brand-border p-6 space-y-6"
              >
                <div className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <h3 className="font-semibold mr-2">
                        Contact #{index + 2}
                      </h3>
                      <ApprovalBadge status={person.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePersonStatus(false, index)}
                      >
                        {person.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setForm((prev) => {
                              if (!prev) return prev;

                              return {
                                ...prev,
                                additional_contacts:
                                  prev.additional_contacts.filter(
                                    (_, i) => i !== index,
                                  ),
                              };
                            })
                          }
                        >
                          {/* <Trash2
                            size={16}
                            className="text-red-600 hover:text-red-700"
                          /> */}
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-sm text-brand-text-secondary">
                    Additional customer contact.
                  </p>
                </div>

                <ContactInformationCard
                  readOnly={!isEditing}
                  values={{
                    firstName: person.first_name,
                    lastName: person.last_name,
                    email: person.email,
                    phone: person.phone,
                    alternatePhone: person.alternate_phone,
                  }}
                  onChange={(field, value) => {
                    setForm((prev) => {
                      if (!prev) return prev;

                      const contacts = [...prev.additional_contacts];

                      contacts[index] = {
                        ...contacts[index],
                        [field]: value,
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
                    department: person.department,
                    preferred_channel: person.preferred_channel,
                  }}
                  onChange={(field, value) => {
                    setForm((prev) => {
                      if (!prev) return prev;

                      const contacts = [...prev.additional_contacts];

                      contacts[index] = {
                        ...contacts[index],
                        [field]: value,
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

            {isEditing && (
              <Button
                variant="secondary"
                leftIcon={<Plus size={16} />}
                onClick={() =>
                  setForm((prev) => {
                    if (!prev) return prev;

                    return {
                      ...prev,
                      additional_contacts: [
                        ...prev.additional_contacts,
                        {
                          id: crypto.randomUUID(),
                          is_primary: false,
                          first_name: "",
                          last_name: "",
                          email: "",
                          phone: "",
                          alternate_phone: "",
                          department: "",
                          preferred_channel: "Email",
                          status: "active",
                        },
                      ],
                    };
                  })
                }
              >
                Add Contact
              </Button>
            )}
          </div>
        </FormSection>

        <div className="flex justify-between pb-10">
          <div className="flex gap-3">
            {isEditing && (
              <>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>

                <Button onClick={updateContact}>Update</Button>
              </>
            )}
          </div>
        </div>

        <AuditTrail
          items={form.activities.map((activity) => ({
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

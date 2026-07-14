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

  function deactivateContact() {
    const payload = {
      id,
      action: "deactivate",
      status: "deactivated",
    };

    console.log("DEACTIVATE CONTACT", payload);

    // await deactivateContactApi(payload)

    toast.success("Customer contact has been deactivated successfully.");

    setTimeout(() => {
      router.push("/admin/crm/contacts");
    }, 1000);
  }
  if (!contact || !form) return null;
  console.log(form);

  return (
    <AppLayout pageTitle="Customer Contact Details">
      <BackButton href="/admin/crm/contacts" label="Back to Contacts" />

      <div className="space-y-6">
        <RoleBasedRecordHeader
          id={form.contact_number}
          currentRole="crm_admin"
          onRoleChange={() => {}}
          roleLabel="CRM Administrator"
          roles={crmRoles}
          recordLabel="Customer Contact"
          status={<ApprovalBadge status={contact.primary_contact.status} />}
          showRoleSwitcher={false}
        />

        {/* Primary Contact */}

        <FormSection
          title="Primary Contact"
          description={`Primary contact for ${form.customer_name}.`}
        >
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
                    <h3 className="font-semibold">Contact #{index + 2}</h3>

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
                        <Trash2
                          size={16}
                          className="text-red-600 hover:text-red-700"
                        />
                      </Button>
                    )}
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
          <Button variant="outline" onClick={deactivateContact}>
            {form.status === "inactive" ||
            form.primary_contact.status === "inactive"
              ? "Activate Contact"
              : "Deactivate Contact"}
          </Button>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>

                <Button onClick={updateContact}>Update</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
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

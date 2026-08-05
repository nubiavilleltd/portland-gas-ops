"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import { BackButton } from "@/components/ui/BackButton";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import FormSelect from "@/components/forms/FormSelect";
import { useToast } from "@/hooks/useToast";
import ContactInformationCard from "@/lib/modules/crm/components/ContactInformationCard";
import EmploymentInformationCard from "@/lib/modules/crm/components/EmploymentInformationCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCustomerOnboarding } from "@/lib/modules/crm";
import { useCreateCustomerContacts } from "@/lib/modules/crm";
import type { ContactForm } from "@/lib/modules/crm";
import {
  validateContacts,
  buildContactsPayload,
} from "@/lib/modules/crm/utils/contact";

function emptyContact(): ContactForm {
  return {
    firstName: "",
    lastName: "",

    email: "",
    phone: "",
    alternatePhone: "",
    position: "",
    role: "",
    department: "",

    preferred_channel: "email",
  };
}

export default function NewCustomerContactPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: customers = [] } = useCustomerOnboarding();
  console.log(customers, "customers");
  const { user } = useCurrentUser();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const createContacts = useCreateCustomerContacts(); /**
   * Only approved / active customers can have contacts
   */
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

  const [form, setForm] = useState({
    customerId: "",
    additionalContacts: [emptyContact()],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleCustomerChange(customerId: string) {
    const customer = customers.find((c: any) => c.id === customerId);

    if (!customer) return;

    setForm({
      customerId,
      additionalContacts: [emptyContact()],
    });
  }

  function updateAdditional(
    index: number,
    field: keyof ContactForm,
    value: string,
  ) {
    setForm((prev) => {
      const contacts = [...prev.additionalContacts];

      contacts[index] = {
        ...contacts[index],
        [field]: value,
      };

      return {
        ...prev,
        additionalContacts: contacts,
      };
    });
  }

  function addContact() {
    setForm((prev) => ({
      ...prev,

      additionalContacts: [...prev.additionalContacts, emptyContact()],
    }));

    toast.success("Additional contact section added.");
  }

  function removeContact(index: number) {
    setForm((prev) => ({
      ...prev,

      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index),
    }));
  }

  async function submit() {
    const { valid, errors } = validateContacts(
      form.customerId,
      form.additionalContacts,
    );

    if (!valid) {
      setErrors(errors);
      toast.error("Please correct the highlighted errors.");
      return;
    }

    try {
      await createContacts.mutateAsync({
        customerId: form.customerId,
        data: buildContactsPayload(form.additionalContacts),
      });

      toast.success("Contacts created successfully.");
      router.push("/crm/contacts");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail?.message ?? "Failed to create contacts.",
      );
    }
  }

  return (
    <AppLayout pageTitle="New Contact">
      <BackButton href="/crm/contacts" label="Back to Contacts" />

      <PageHeader
        title="New Contact"
        description="Assign and manage contacts for an existing customer."
      />

      <div className="space-y-6">
        <FormSection
          title="Customer"
          description="Select the customer this contact belongs to."
        >
          <FormSelect
            label="Customer"
            value={form.customerId}
            options={customerOptions}
            searchable={true}
            placeholder="Select Customer"
            onValueChange={handleCustomerChange}
          />
        </FormSection>

        {form.customerId && (
          <>
            {form.additionalContacts.map((contact, index) => (
              <div key={index} className="rounded-lg border p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Additional Contact #{index + 1}
                  </h4>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeContact(index)}
                  >
                    Remove
                  </Button>
                </div>

                <ContactInformationCard
                  values={{
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    alternatePhone: contact.alternatePhone,
                  }}
                  errors={{
                    firstName: errors[`firstName-${index}`],
                    lastName: errors[`lastName-${index}`],
                    email: errors[`email-${index}`],
                    phone: errors[`phone-${index}`],
                  }}
                  onChange={(field, value) =>
                    updateAdditional(index, field as keyof ContactForm, value)
                  }
                />

                <EmploymentInformationCard
                  values={{
                    department: contact.department,
                    preferred_channel: contact.preferred_channel,
                    position: contact.position,
                    role: contact.role,
                  }}
                  errors={{
                    department: errors[`department-${index}`],
                    position: errors[`position-${index}`],
                    role: errors[`role-${index}`],
                    preferred_channel: errors[`preferred_channel-${index}`],
                  }}
                  onChange={(field, value) =>
                    updateAdditional(index, field as keyof ContactForm, value)
                  }
                />
              </div>
            ))}
            <Button variant="secondary" onClick={addContact}>
              + Add Contact
            </Button>

            <div className="flex justify-start gap-3 pb-10">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>

              <Button loading={createContacts.isPending} onClick={submit}>
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

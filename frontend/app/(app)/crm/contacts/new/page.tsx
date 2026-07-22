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

import { useCustomerOnboarding } from "@/lib/modules/crm";

type ContactForm = {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  alternatePhone: string;

  department: string;

  preferred_channel: string;
};

function emptyContact(): ContactForm {
  return {
    firstName: "",
    lastName: "",

    email: "",
    phone: "",
    alternatePhone: "",

    department: "",

    preferred_channel: "Email",
  };
}

export default function NewCustomerContactPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: customers = [] } = useCustomerOnboarding();

  /**
   * Only approved / active customers can have contacts
   */
  const customerOptions = useMemo(
    () =>
      customers
        .filter(
          (c) =>
            c.status === "approved" ||
            c.status === "active" ||
            c.customer_status === "active",
        )
        .map((customer) => ({
          label: customer.customer_name,
          value: customer.id,
        })),
    [customers],
  );

  const [form, setForm] = useState({
    customerId: "",

    primaryContact: emptyContact(),

    additionalContacts: [] as ContactForm[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function splitName(name: string) {
    const names = name.trim().split(" ");

    return {
      firstName: names[0] ?? "",
      lastName: names.slice(1).join(" "),
    };
  }

  function handleCustomerChange(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);

    if (!customer) return;

    const names = splitName(customer.contact_person);

    setForm({
      customerId,

      primaryContact: {
        firstName: names.firstName,
        lastName: names.lastName,

        email: customer.email,

        phone: customer.phone,

        alternatePhone: customer.alternate_phone,

        department: "",

        preferred_channel: "Email",
      },

      additionalContacts: [],
    });
  }

  function updatePrimary(field: keyof ContactForm, value: string) {
    setForm((prev) => ({
      ...prev,

      primaryContact: {
        ...prev.primaryContact,

        [field]: value,
      },
    }));
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

  function saveDraft() {
    const payload = {
      status: "draft",
      ...form,
    };

    console.log(payload);

    toast.success("Customer contact has been saved as draft.");

    setTimeout(() => {
      router.push("/crm/contacts");
    }, 1000);
  }

  function submit() {
    const payload = {
      status: "submitted",
      ...form,
    };

    console.log(payload);

    toast.success("Customer contact has been submitted successfully.");

    setTimeout(() => {
      router.push("/crm/contacts");
    }, 1000);
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
            placeholder="Select Customer"
            onValueChange={handleCustomerChange}
          />
        </FormSection>

        {form.customerId && (
          <>
            <ContactInformationCard
              values={{
                firstName: form.primaryContact.firstName,
                lastName: form.primaryContact.lastName,
                email: form.primaryContact.email,
                phone: form.primaryContact.phone,
                alternatePhone: form.primaryContact.alternatePhone,
              }}
              errors={errors}
              onChange={(field, value) =>
                updatePrimary(field as keyof ContactForm, value)
              }
            />

            <EmploymentInformationCard
              values={{
                department: form.primaryContact.department,
                preferred_channel: form.primaryContact.preferred_channel,
              }}
              onChange={(field, value) =>
                updatePrimary(field as keyof ContactForm, value)
              }
            />

            <div className="rounded-lg border border-dashed p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Additional Contacts</h3>

                  <p className="text-sm text-brand-text-secondary">
                    Add more contacts for this customer.
                  </p>
                </div>
              </div>

              {form.additionalContacts.length === 0 && (
                <div className="rounded-lg border border-dashed py-8 text-center text-sm text-brand-text-secondary">
                  No additional contacts added.
                </div>
              )}

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
                    onChange={(field, value) =>
                      updateAdditional(index, field as keyof ContactForm, value)
                    }
                  />

                  <EmploymentInformationCard
                    values={{
                      department: contact.department,
                      preferred_channel: contact.preferred_channel,
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
            </div>

            <div className="flex justify-start gap-3 pb-10">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>

              {/* <Button variant="secondary" onClick={saveDraft}>
                Save Draft
              </Button> */}

              <Button onClick={submit}>Submit</Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

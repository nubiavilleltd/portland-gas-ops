"use client";

import { UserPlus, Users, Contact, LayoutGrid } from "lucide-react";

import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

export default function CRMQuickActions() {
  return (
    <FormSection
      title="Quick Actions"
      description="Frequently used CRM actions."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          href="/crm/contacts/new"
          variant="secondary"
          leftIcon={<UserPlus size={18} />}
          className="justify-start"
        >
          New Contact
        </Button>

        <Button
          href="/crm/customers"
          variant="secondary"
          leftIcon={<Users size={18} />}
          className="justify-start"
        >
          Customers
        </Button>

        <Button
          href="/crm/contacts"
          variant="secondary"
          leftIcon={<Contact size={18} />}
          className="justify-start"
        >
          Contacts
        </Button>

        <Button
          href="/crm/customers/new"
          variant="secondary"
          leftIcon={<UserPlus size={18} />}
          className="justify-start"
        >
          Onboard Customer
        </Button>
      </div>
    </FormSection>
  );
}

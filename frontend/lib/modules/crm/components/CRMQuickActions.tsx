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
          href="/admin/crm/contacts/new"
          variant="outline"
          leftIcon={<UserPlus size={18} />}
          className="justify-start"
        >
          New Contact
        </Button>

        <Button
          href="/admin/crm/customers"
          variant="outline"
          leftIcon={<Users size={18} />}
          className="justify-start"
        >
          Customers
        </Button>

        <Button
          href="/admin/crm/contacts"
          variant="outline"
          leftIcon={<Contact size={18} />}
          className="justify-start"
        >
          Contacts
        </Button>

        <Button
          href="/admin/crm/onboarding/new"
          variant="outline"
          leftIcon={<UserPlus size={18} />}
          className="justify-start"
        >
          Onboard Customer
        </Button>
      </div>
    </FormSection>
  );
}

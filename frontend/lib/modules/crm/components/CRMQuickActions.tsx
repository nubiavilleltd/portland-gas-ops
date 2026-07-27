"use client";

import {
  UserPlus,
  Users,
  Contact,
  CalendarPlus,
  ShoppingCart,
} from "lucide-react";

import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

export default function CRMQuickActions() {
  return (
    <FormSection
      title="Quick Actions"
      description="Frequently used CRM actions."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Button
          href="/crm/customers/new"
          variant="secondary"
          leftIcon={<UserPlus size={18} />}
          className="justify-start"
        >
          New Customer
        </Button>

        <Button
          href="/crm/contacts/new"
          variant="secondary"
          leftIcon={<Contact size={18} />}
          className="justify-start"
        >
          New Contact
        </Button>

        <Button
          href="/crm/visits/new"
          variant="secondary"
          leftIcon={<CalendarPlus size={18} />}
          className="justify-start"
        >
          Schedule Visit
        </Button>

        <Button
          href="/crm/visits"
          variant="secondary"
          leftIcon={<Users size={18} />}
          className="justify-start"
        >
          View Visits
        </Button>

        <Button
          href="/admin/crm/purchase-trends"
          variant="secondary"
          leftIcon={<ShoppingCart size={18} />}
          className="justify-start"
        >
          Purchase Trends
        </Button>
      </div>
    </FormSection>
  );
}

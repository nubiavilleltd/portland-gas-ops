"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { useCustomerOnboarding, useCustomerContacts } from "@/lib/modules/crm";
import { Users, UserCheck, Clock3, Contact } from "lucide-react";
import CRMStatCards from "@/lib/modules/crm/components/CRMStatCards";
import ActiveCustomersTable from "@/lib/modules/crm/components/ActiveCustomersTable";
import RecentContactsTable from "@/lib/modules/crm/components/RecentContactsTable";
import CRMQuickActions from "@/lib/modules/crm/components/CRMQuickActions";
import Card from "@/components/ui/Card";

export default function CRMDashboardPage() {
  const {
    data: customers = [],
    isLoading: loadingCustomers,
    isError: customerError,
  } = useCustomerOnboarding();

  const {
    data: contacts = [],
    isLoading: loadingContacts,
    isError: contactError,
  } = useCustomerContacts();

  const loading = loadingCustomers || loadingContacts;

  if (loading) {
    return (
      <AppLayout pageTitle="CRM Dashboard">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (customerError || contactError) {
    return (
      <AppLayout pageTitle="CRM Dashboard">
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load CRM dashboard.
        </div>
      </AppLayout>
    );
  }

  const activeCustomers = customers.filter(
    (customer) =>
      customer.status === "acknowledged" ||
      customer.customer_status === "active",
  );

  const pendingCustomers = customers.filter(
    (customer) => customer.status === "submitted",
  );

  return (
    <AppLayout pageTitle="CRM Dashboard">
      <PageHeader
        title="CRM Dashboard"
        description="Overview of customers, contacts and onboarding activities."
      />

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<Users className="h-5 w-5" />}
            title="Total Customers"
            description={
              <span className="text-3xl font-bold text-brand-text-primary">
                {customers.length}
              </span>
            }
          />

          <Card
            icon={<UserCheck className="h-5 w-5" />}
            title="Active Customers"
            description={
              <span className="text-3xl font-bold text-brand-text-primary">
                {activeCustomers.length}
              </span>
            }
          />

          <Card
            icon={<Clock3 className="h-5 w-5" />}
            title="Pending Customers"
            description={
              <span className="text-3xl font-bold text-brand-text-primary">
                {pendingCustomers.length}
              </span>
            }
          />

          <Card
            icon={<Contact className="h-5 w-5" />}
            title="Total Contacts"
            description={
              <span className="text-3xl font-bold text-brand-text-primary">
                {contacts.length}
              </span>
            }
          />
        </div>
        {/* <CRMStatCards
          totalCustomers={customers.length}
          activeCustomers={activeCustomers.length}
          pendingCustomers={pendingCustomers.length}
          totalContacts={contacts.length}
        /> */}
        <CRMQuickActions />
        <ActiveCustomersTable customers={activeCustomers.slice(0, 5)} />
        <RecentContactsTable
          contacts={contacts
            .filter((item) => item?.status?.toLowerCase() == "active")
            .slice(0, 5)}
        />
      </div>
    </AppLayout>
  );
}

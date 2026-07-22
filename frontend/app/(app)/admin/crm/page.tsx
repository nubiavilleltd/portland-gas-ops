"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { useCustomerOnboarding, useCustomerContacts } from "@/lib/modules/crm";
import { Users, UserCheck, Clock3, Contact } from "lucide-react";
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

  const topSales = customers.reduce<Record<string, number>>((acc, customer) => {
    if (!customer.sales_contact) return acc;

    acc[customer.sales_contact] = (acc[customer.sales_contact] || 0) + 1;

    return acc;
  }, {});

  const topSalesPerson = Object.entries(topSales).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const activeCustomers = customers.filter(
    (customer) =>
      customer.status === "active" || customer.customer_status === "active",
  );

  const pendingCustomers = customers.filter(
    (customer) => customer.status === "submitted",
  );

  const topReferrer = customers.reduce<Record<string, number>>(
    (acc, customer) => {
      if (!customer.referrer) return acc;

      acc[customer.referrer] = (acc[customer.referrer] || 0) + 1;

      return acc;
    },
    {},
  );

  const topReferrerPerson = Object.entries(topReferrer).sort(
    (a, b) => b[1] - a[1],
  )[0];

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

        <CRMQuickActions />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Top Sales Contact"
            description={
              topSalesPerson
                ? `${topSalesPerson[0]} • ${topSalesPerson[1]} Customers`
                : "No data available"
            }
          />

          <Card
            title="Top Referrer"
            description={
              topReferrerPerson
                ? `${topReferrerPerson[0]} • ${topReferrerPerson[1]} Referrals`
                : "No data available"
            }
          />
        </div>
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

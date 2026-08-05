"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";

import {
  useCustomerOnboarding,
  useCustomerContacts,
  useCustomerVisits,
} from "@/lib/modules/crm";

import {
  Users,
  UserCheck,
  Clock3,
  Contact,
  CalendarDays,
  CheckCircle2,
  RotateCw,
  XCircle,
  Wallet,
  ShoppingCart,
  TrendingUp,
  BadgeDollarSign,
} from "lucide-react";

import RecentContactsTable from "@/lib/modules/crm/components/RecentContactsTable";
import ActiveCustomersTable from "@/lib/modules/crm/components/ActiveCustomersTable";
import CRMQuickActions from "@/lib/modules/crm/components/CRMQuickActions";
import UpcomingVisitsTable from "@/lib/modules/crm/components/UpcomingVisitsTable";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";

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

  const {
    data: visits = [],
    isLoading: loadingVisits,
    isError: visitError,
  } = useCustomerVisits();
  const {
    orders = [],
    isLoading: loadingOrders,
    error: orderError,
  } = useOrders();
  const loading =
    loadingCustomers || loadingContacts || loadingVisits || loadingOrders;

  if (loading) {
    return (
      <AppLayout pageTitle="CRM Dashboard">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }
  if (customerError || contactError || visitError || orderError) {
    return (
      <AppLayout pageTitle="CRM Dashboard">
        <div className="py-20 text-center text-brand-text-secondary">
          Failed to load CRM dashboard.
        </div>
      </AppLayout>
    );
  }

  const activeCustomers = customers.filter(
    (c: any) => c.status === "active" || c.customer_status === "active",
  );

  const pendingCustomers = customers.filter(
    (c: any) => c.status === "submitted",
  );

  const scheduledVisits = visits.filter((v) => v.status === "Scheduled");

  const completedVisits = visits.filter((v) => v.status === "Completed");

  const cancelledVisits = visits.filter((v) => v.status === "Cancelled");

  const followUpsDue = visits.filter((v) => v.follow_up_required);

  // const topSales = customers.reduce<Record<string, number>>((acc, customer) => {
  //   if (!customer.sales_contact) return acc;

  //   acc[customer.sales_contact] = (acc[customer.sales_contact] || 0) + 1;

  //   return acc;
  // }, {});

  // const topSalesPerson = Object.entries(topSales).sort(
  //   (a, b) => b[1] - a[1],
  // )[0];

  // const topReferrer = customers.reduce<Record<string, number>>(
  //   (acc, customer) => {
  //     if (!customer.referrer) return acc;

  //     acc[customer.referrer] = (acc[customer.referrer] || 0) + 1;

  //     return acc;
  //   },
  //   {},
  // );

  // const topReferrerPerson = Object.entries(topReferrer).sort(
  //   (a, b) => b[1] - a[1],
  // )[0];
  // const customerVisitCounts = visits.reduce<Record<string, number>>(
  //   (acc, visit) => {
  //     acc[visit.customer_name] = (acc[visit.customer_name] || 0) + 1;
  //     return acc;
  //   },
  //   {},
  // );

  // const mostVisitedCustomer = Object.entries(customerVisitCounts).sort(
  //   (a, b) => b[1] - a[1],
  // )[0];

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const customerPurchaseCounts = orders.reduce<Record<string, number>>(
    (acc, order) => {
      if (!order.customerName) return acc;

      acc[order.customerName] =
        (acc[order.customerName] || 0) + Number(order.totalAmount || 0);

      return acc;
    },
    {},
  );

  const topPurchasingCustomer = Object.entries(customerPurchaseCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  return (
    <AppLayout pageTitle="CRM Dashboard">
      <PageHeader
        title="CRM Dashboard"
        description="Overview of customers, contacts and visit activities."
      />

      <div className="space-y-8">
        {/* Customer Overview */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card
            icon={<Users className="h-5 w-5" />}
            title="Total Customers"
            description={
              <span className="text-3xl font-bold">{customers.length}</span>
            }
          />

          <Card
            icon={<UserCheck className="h-5 w-5" />}
            title="Active Customers"
            description={
              <span className="text-3xl font-bold">
                {activeCustomers.length}
              </span>
            }
          />

          <Card
            icon={<Contact className="h-5 w-5" />}
            title="Total Contacts"
            description={
              <span className="text-3xl font-bold">{contacts.length}</span>
            }
          />
        </div>

        {/* Sales & Purchase Performance */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<BadgeDollarSign className="h-5 w-5" />}
            title="Top Purchasing Customer"
            description={
              topPurchasingCustomer ? (
                <span className="text-2xl font-bold">
                  {topPurchasingCustomer[0]} • ₦
                  {topPurchasingCustomer[1].toLocaleString()}
                </span>
              ) : (
                <span className="text-2xl font-bold">
                  No purchase data available
                </span>
              )
            }
          />
          <Card
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Total Orders"
            description={
              <span className="text-3xl font-bold">{totalOrders}</span>
            }
          />
          <Card
            icon={<Wallet className="h-5 w-5" />}
            title="Total Revenue"
            description={
              <span className="text-3xl font-bold">
                ₦{totalRevenue.toLocaleString()}
              </span>
            }
          />

          <Card
            icon={<TrendingUp className="h-5 w-5" />}
            title="Average Order Value"
            description={
              <span className="text-3xl font-bold">
                ₦{averageOrderValue.toLocaleString()}
              </span>
            }
          />
        </div>

        {/* Customer Engagement */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<CalendarDays className="h-5 w-5" />}
            title="Scheduled Visits"
            description={
              <span className="text-3xl font-bold">
                {scheduledVisits.length}
              </span>
            }
          />
          <Card
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Completed Visits"
            description={
              <span className="text-3xl font-bold">
                {completedVisits.length}
              </span>
            }
          />

          <Card
            icon={<RotateCw className="h-5 w-5" />}
            title="Follow-ups Due"
            description={
              <span className="text-3xl font-bold">{followUpsDue.length}</span>
            }
          />

          <Card
            icon={<XCircle className="h-5 w-5" />}
            title="Cancelled Visits"
            description={
              <span className="text-3xl font-bold">
                {cancelledVisits.length}
              </span>
            }
          />

          {/* <Card
            icon={<Clock3 className="h-5 w-5" />}
            title="Visits This Month"
            description={
              <span className="text-3xl font-bold">{visits.length}</span>
            }
          /> */}
        </div>

        {/* Business Insights */}
        {/* <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title="Top Sales Executive"
            description={
              topSalesPerson
                ? `${topSalesPerson[0]} • ${topSalesPerson[1]} Customers`
                : "No data available"
            }
          /> */}

        {/* <Card
            title="Top Referral Source"
            description={
              topReferrerPerson
                ? `${topReferrerPerson[0]} • ${topReferrerPerson[1]} Referrals`
                : "No data available"
            }
          />

          <Card
            title="Most Visited Customer"
            description={
              mostVisitedCustomer
                ? `${mostVisitedCustomer[0]} • ${mostVisitedCustomer[1]} Visit${mostVisitedCustomer[1] > 1 ? "s" : ""}`
                : "No visit data available"
            }
          />
        </div> */}
        <CRMQuickActions />

        {/* Data Tables */}
        <ActiveCustomersTable customers={activeCustomers.slice(0, 5)} />

        <RecentContactsTable
          contacts={contacts
            .filter((item: any) => item?.status?.toLowerCase() === "active")
            .slice(0, 5)}
        />

        <UpcomingVisitsTable
          visits={scheduledVisits
            .sort(
              (a, b) =>
                new Date(a.visit_date).getTime() -
                new Date(b.visit_date).getTime(),
            )
            .slice(0, 5)}
        />
      </div>
    </AppLayout>
  );
}

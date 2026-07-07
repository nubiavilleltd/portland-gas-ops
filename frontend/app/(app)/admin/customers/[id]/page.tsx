"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  PowerOff,
  Power,
} from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useCustomerByNo } from "@/lib/modules/customers/hooks/useCustomers";
import { CustomersService } from "@/lib/modules/customers/services/customers.service";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";
import { parseError } from "@/lib/errors";
import { formatDate, formatCurrency } from "@/lib/utils";
import FormSection from "@/components/ui/FormSection";
import { BackButton } from "@/components/ui/BackButton";
import { useToggleCustomerStatus } from "@/lib/modules/customers/hooks/useCustomerMutations";

import SimpleTable, {
  SimpleTableColumn,
} from "@/components/ui/SimpleTable";

import { useCustomerOrders } from "@/lib/modules/customers/hooks/useCustomers";

import { ORDER_ROUTES } from "@/lib/routes";


import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { Order } from "@/lib/modules/orders/types/orders.types";



// ── Page ──────────────────────────────────────────────────
export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerNo = params.id as string;

  const { customer, isLoading, error } = useCustomerByNo(customerNo);
  const {
  orders,
  isLoading: loadingOrders,
} = useCustomerOrders(customerNo);
  // const [isToggling, setIsToggling] = useState(false);

  const isActive = customer?.status === "active"
  const { mutate: toggleStatus, isPending: isToggling } = useToggleCustomerStatus(customerNo);

  const orderColumns: SimpleTableColumn<Order>[] = [
    {
      label: "Order No",
      render: (order) => (
        <span className="font-medium">
          {order.orderNumber}
        </span>
      ),
    },

    {
      label: "Date",
      render: (order) => formatDate(order.createdAt),
    },

    {
      label: "Status",
      render: (order) => (
        <OrderStatusBadge status={order.orderStatus} />
      ),
    },

    {
      label: "Amount",
      align: "right",
      render: (order) =>
        formatCurrency(order.totalAmount),
    },

    {
      label: "",
      align: "right",
      render: (order) => (
        <Button
          size="sm"
          variant="ghost"
          href={ORDER_ROUTES.detail(order.orderNumber)}
        >
          View
        </Button>
      ),
    },
  ];

  // ── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Customer">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found ─────────────────────────────────────────
  if (error || !customer) {
    return (
      <AppLayout pageTitle="Customer Not Found">
        <ErrorBanner message={error ?? "This customer could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(CUSTOMER_ROUTES.list())}
        >
          Back to Customers
        </Button>
      </AppLayout>
    );
  }





  // ── Render ────────────────────────────────────────────
  return (
    <AppLayout pageTitle={customer.name}>
      {/* Back */}
      <BackButton
        href={CUSTOMER_ROUTES.list()}
        label="Back to Customers"
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-text-primary">
            {customer.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={
                customer.type === "corporate"
                  ? "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  : "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600"
              }
            >
              {customer.type === "corporate" ? "Corporate" : "Individual"}
            </span>
            <span className="text-xs text-brand-text-secondary">
              Added {formatDate(customer.createdAt)}
            </span>
          </div>
        </div>

        {/* Action buttons — wrapped in a div so they sit side by side */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            href={CUSTOMER_ROUTES.edit(customer.customerNo)}
            leftIcon={<Pencil size={14} />}
          >
            Edit
          </Button>
          <Button
            variant={isActive ? "danger" : "primary"}
            loading={isToggling}
            loadingText={isActive ? "Deactivating…" : "Activating…"}
            onClick={() => toggleStatus(isActive ?? false)}
            leftIcon={
              isActive
                ? <PowerOff size={14} />
                : <Power size={14} />
            }
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      <FormSection
        title="Customer Details"
        description="View customer information and contact details"
      >

        <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-3">
          <InfoRow
            // icon={
            //   customer.type === "corporate"
            //     ? <Building2 size={16} />
            //     : <User size={16} />
            // }
            label="Type"
            value={customer.type === "corporate" ? "Corporate" : "Individual"}
          />
          <InfoRow
            // icon={<Phone size={16} />}
            label="Phone"
            value={customer.phone}
          />
          <InfoRow
            // icon={<Mail size={16} />}
            label="Email"
            value={customer.email}
          />
          <InfoRow
            // icon={<MapPin size={16} />}
            label="Address"
            value={customer.address}
          />
        </div>

      </FormSection>

      <FormSection
        title="Order History"
        description="Orders placed by this customer"
        className="mt-4"
      >
        <SimpleTable
          columns={orderColumns}
          rows={orders}
          // loading={loadingOrders}
          emptyMessage="This customer has not placed any orders yet."
          keyExtractor={(o) => o.id}
        />
      </FormSection>
    </AppLayout>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
  );
}
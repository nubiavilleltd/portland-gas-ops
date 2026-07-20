"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import DataTable, { type Column } from "@/components/ui/DataTable";

// import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import { useInvoices } from "@/lib/modules/invoices/hooks/useInvoices";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { Invoice } from "@/lib/modules/invoices/types/invoice.types";

export default function InvoicesPage() {
  const { invoices } = useInvoices();
  const { orders } = useOrders();

  const orderMap = Object.fromEntries(orders.map((order) => [order.id, order]));

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_number",
      label: "Invoice",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "order_id",
      label: "Order",
      render: (value) => (
        <span className="font-medium">
          {orderMap[value as string].orderNumber}
        </span>
      ),
    },
    {
      key: "issued_date",
      label: "Date",
      render: (value) => formatDate(value as string),
    },
    {
      key: "due_date",
      label: "Due",
      render: (value) => formatDate(value as string),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (value) => (
        <span className="font-medium">{formatCurrency(value as number)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const s = value as Invoice["status"];

        return <PaymentStatusBadge status={s} />;
        // const styles =
        //   s === "paid"
        //     ? "bg-green-100 text-green-700"
        //     : s === "partially_paid"
        //     ? "bg-yellow-100 text-yellow-700"
        //     : "bg-red-100 text-red-700";
        // return (
        //   <span className={`text-xs px-2 py-1 rounded-full ${styles}`}>{s}</span>
        // );
      },
    },
  ];

  return (
    <AppLayout pageTitle="Invoices">
      <PageHeader
        title="Invoices"
        description="Manage all invoices and track payments"
    
      />

      
      <DataTable<Invoice>
        columns={columns}
        data={invoices}
        rowHref={(invoice) => `/invoices/${invoice.id}`}
        emptyMessage="No invoices found."
      />
    </AppLayout>
  );
}

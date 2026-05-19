"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";



export default function InvoicesPage() {
  return (
    <AppLayout pageTitle="Invoices">
      <PageHeader
        title="Invoices"
        description="Manage all invoices and track payments"
        action={
          <Button href="/orders">
            Create From Order
          </Button>
        }
      />

      {/* TABLE WRAPPER */}
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        {invoices.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No invoices found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Due</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => {
                  const isPaid = invoice.status === "paid";
                  const isPartial = invoice.status === "partially_paid";

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-brand-border"
                    >
                      {/* Invoice Number */}
                      <td className="py-4 font-medium">
                        {invoice.invoice_number}
                      </td>

                      {/* Order */}
                      <td>{invoice.order_id}</td>

                      {/* Date */}
                      <td>
                        {formatDate(invoice.issued_date)}
                      </td>

                      {/* Due Date */}
                      <td>
                        {formatDate(invoice.due_date)}
                      </td>

                      {/* Amount */}
                      <td className="font-medium">
                        {formatCurrency(invoice.total_amount)}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isPaid
                              ? "bg-green-100 text-green-700"
                              : isPartial
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/invoices/${invoice.id}`}
                        >
                          View
                        </Button>

                        {!isPaid && (
                          <Button
                            size="sm"
                            href={`/payments/new?invoiceId=${invoice.id}`}
                          >
                            Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
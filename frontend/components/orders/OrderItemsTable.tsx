"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  order: any;
}

export default function OrderItemsTable({
  order,
}: Props) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">

      <h3 className="text-base font-semibold mb-4">
        Order Items
      </h3>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b border-brand-border text-left">
              <th className="pb-3">
                Product
              </th>

              <th className="pb-3">
                Quantity
              </th>

              <th className="pb-3">
                Unit Price
              </th>

              <th className="pb-3">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b border-brand-border">

              <td className="py-4">
                {order.order_type}
              </td>

              <td>
                {Number(order.quantity).toLocaleString()} kg
              </td>

              <td>
                {formatCurrency(order.unit_price)}
              </td>

              <td>
                {formatCurrency(order.total_amount)}
              </td>

            </tr>
          </tbody>

        </table>

      </div>

    </div>
  );
}
"use client";

import Link from "next/link";

import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import { formatDate } from "@/lib/utils";
import type {
  ConsumableStock,
  StockMovement,
} from "@/lib/modules/inventory/types/inventory.types";
import type { BadgeVariant } from "@/config/badge.config";

const MOVEMENT_VARIANT: Record<string, BadgeVariant> = {
  check_in: "success",
  check_out: "info",
  reservation: "warning",
  reservation_release: "neutral",
  return: "cyan",
  adjustment: "neutral",
};

interface Props {
  stock: ConsumableStock[];
  movements: StockMovement[];
  productId: string;
  isLoading: boolean;
}

export default function StockQuantitySection({
  stock,
  movements,
  productId,
  isLoading,
}: Props) {
  const columns: Column<ConsumableStock>[] = [
    {
      key: "location_name",
      label: "Location",
    },
    {
      key: "quantity",
      label: "On Hand",
      render: (_v, row) => row.quantity.toLocaleString(),
    },
    {
      key: "reserved_quantity",
      label: "Reserved",
      render: (_v, row) => row.reserved_quantity.toLocaleString(),
    },
    {
      key: "id",
      label: "Available",
      render: (_v, row) =>
        (row.quantity - row.reserved_quantity).toLocaleString(),
    },
    {
      key: "sold_quantity",
      label: "Sold",
      render: (_v, row) => row.sold_quantity.toLocaleString(),
    },
  ];

  const recentMovements = [...movements]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-brand-text-primary mb-3">
          Stock by Location
        </h2>
        <DataTable<ConsumableStock>
          columns={columns}
          data={stock}
          isLoading={isLoading}
          rowHref={(s) => INVENTORY_ROUTES.stockDetail(s.id)}
          emptyMessage="No stock records for this product."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-brand-text-primary">
            Recent Movements
          </h2>
          <Link
            href={`${INVENTORY_ROUTES.movements()}?product_id=${productId}`}
            className="text-xs text-brand-purple hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentMovements.length === 0 ? (
          <p className="text-sm text-brand-text-secondary py-6 text-center border border-brand-border rounded-xl">
            No movements yet.
          </p>
        ) : (
          <div className="border border-brand-border rounded-xl divide-y divide-brand-border">
            {recentMovements.map((movement) => {
              const isPositive =
                movement.movement_type === "check_in" ||
                movement.movement_type === "return";

              return (
                <div
                  key={movement.id}
                  className="flex items-start justify-between px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          MOVEMENT_VARIANT[movement.movement_type] ??
                          "neutral"
                        }
                        label={movement.movement_type
                          .replace("_", " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      />
                      {movement.reference_id && (
                        <span className="text-xs text-brand-text-secondary">
                          Ref: {movement.reference_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary">
                      By {movement.recorded_by_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        isPositive ? "text-green-700" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : "−"}
                      {movement.quantity.toLocaleString()}
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      {formatDate(movement.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
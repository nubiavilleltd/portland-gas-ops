"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import Badge from "@/components/ui/Badge";
import PageErrorState from "@/components/ui/PageError";

import { useConsumableStockDetail } from "@/lib/modules/inventory/hooks/useInventory";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

import { formatDate } from "@/lib/utils";
import StockDetailSkeleton from "@/lib/modules/inventory/components/StockDetailSkeleton";
import type { BadgeVariant } from "@/config/badge.config";

const MOVEMENT_VARIANT: Record<string, BadgeVariant> = {
  check_in: "success",
  check_out: "danger",
  reservation: "warning",
  reservation_release: "neutral",
  return: "cyan",
  adjustment: "neutral",
};

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const { stock, isLoading, error } = useConsumableStockDetail(id);

  if (isLoading) {
    return <StockDetailSkeleton />;
  }

  if (error || !stock) {
    return (
      <AppLayout pageTitle="Stock Quantity">
        <PageErrorState
          title="Unable to load stock"
          message={error ?? "This stock record could not be found."}
        >
          <Button
            variant="outline"
            onClick={() => router.push(INVENTORY_ROUTES.list())}
          >
            Back to Inventory
          </Button>
        </PageErrorState>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle={stock.product_name}>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text-primary">
          {stock.product_name}
        </h1>
        <p className="text-sm text-brand-text-secondary mt-1">
          {stock.location_name}
        </p>
      </div>

      <FormSection
        title="Stock Details"
        description="Current inventory information for this warehouse location."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
          <InfoRow label="Product" value={stock.product_name} />
          <InfoRow label="Location" value={stock.location_name} />
          <InfoRow
            label="On Hand"
            value={stock.quantity.toLocaleString()}
          />
          <InfoRow
            label="Reserved"
            value={stock.reserved_quantity.toLocaleString()}
          />
          <InfoRow
            label="Available"
            value={(
              stock.quantity - stock.reserved_quantity
            ).toLocaleString()}
          />
          <InfoRow
            label="Sold"
            value={stock.sold_quantity.toLocaleString()}
          />
          <InfoRow
            label="Last Updated"
            value={formatDate(stock.updated_at)}
          />
        </div>
      </FormSection>

      <FormSection
        title="Movement History"
        description="Chronological history of inventory activity for this stock."
        className="mt-4"
      >
        {stock.movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-text-secondary">
            No movement history found.
          </p>
        ) : (
          <div className="divide-y divide-brand-border border-t border-brand-border">
            {[...stock.movements]
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .map((movement) => {
                const isPositive =
                  movement.movement_type === "check_in" ||
                  movement.movement_type === "return";

                return (
                  <div
                    key={movement.id}
                    className="flex items-start justify-between py-4"
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

                        {movement.reference_type && (
                          <span className="text-xs text-brand-text-secondary">
                            {movement.reference_type}
                            {movement.reference_id &&
                              ` • ${movement.reference_id}`}
                          </span>
                        )}
                      </div>

                      {movement.notes && (
                        <p className="text-sm text-brand-text-primary">
                          {movement.notes}
                        </p>
                      )}

                      <p className="text-xs text-brand-text-secondary">
                        Recorded by {movement.recorded_by_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          isPositive ? "text-green-700" : "text-red-600"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
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
      </FormSection>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
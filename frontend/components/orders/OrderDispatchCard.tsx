"use client";

import Button from "@/components/ui/Button";

interface Props {
  orderId: string;
  dispatch?: any;
}

export default function OrderDispatchCard({
  orderId,
  dispatch,
}: Props) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">

      <div className="flex items-center justify-between mb-4">

        <h3 className="text-base font-semibold">
          Dispatch Information
        </h3>

        <Button
          size="sm"
          href={`/orders/${orderId}/dispatch`}
        >
          {dispatch
            ? "Update Dispatch"
            : "Create Dispatch"}
        </Button>

      </div>

      {!dispatch ? (
        <p className="text-sm text-brand-text-secondary">
          No dispatch has been created yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 text-sm">

          <Info
            label="Driver"
            value={dispatch.driver_name}
          />

          <Info
            label="Vehicle"
            value={dispatch.vehicle_name}
          />

          <Info
            label="Delivery Status"
            value={dispatch.delivery_status}
          />

        </div>
      )}

    </div>
  );
}

function Info({
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

      <p className="font-medium mt-1 capitalize">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}
"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

interface Props {
  orderId: string;
  orderNumber: string;
}

export default function OrderDetailsHeader({
  orderId,
  orderNumber,
}: Props) {
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Orders
      </button>

      <PageHeader
        title={orderNumber}
        description="Customer gas order workflow and transaction details"
        action={
          <div className="flex gap-2">

            <Button
              variant="outline"
              href={`/orders/${orderId}/edit`}
            >
              Edit Order
            </Button>

            {/* <Button
              href={`/orders/${orderId}/dispatch`}
            >
              Dispatch
            </Button> */}

          </div>
        }
        className="mb-6"
      />
    </>
  );
}
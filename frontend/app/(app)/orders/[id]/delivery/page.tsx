"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Truck } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import FormSection from "@/components/ui/FormSection";

export default function OrderDeliveryPage() {
  const router = useRouter();
  return (
    <AppLayout pageTitle="Orders & Dispatch">
      {/* <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back
      </button> */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-lg">
       <FormSection
  title="Delivery Tracking"
  description="Track vehicle and delivery destination details"
>
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-lg bg-brand-purple-faint text-brand-purple">
      <Truck size={18} />
    </div>

    <div>
      <p className="text-sm font-medium">Vehicle: LAG-492 CNG Truck</p>
      <p className="text-xs text-brand-text-secondary">
        Driver: Musa Abdullahi
      </p>
    </div>

    <div className="ml-auto">
      <FulfillmentStatusBadge status="in_transit" />
    </div>
  </div>

  <div className="flex items-start gap-3 mt-4 p-3 bg-brand-purple-faint rounded-lg">
    <MapPin size={16} className="text-brand-purple mt-0.5" />

    <div>
      <p className="text-xs text-brand-text-secondary">
        Delivery Address
      </p>
      <p className="text-sm font-medium">
        Obajana, Kogi State
      </p>
    </div>
  </div>
</FormSection>
        {/* <p className="text-xs text-brand-text-secondary mt-4">TODO: Integrate real-time delivery tracking map</p> */}
      </div>
    </AppLayout>
  );
}

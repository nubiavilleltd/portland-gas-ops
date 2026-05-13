"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function OrderDetailPage() {
  const router = useRouter();
  return (
    <AppLayout pageTitle="Orders & Dispatch">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to Orders
      </button>
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-brand-text-secondary">ORD-20240512-C3D4</p>
            <h2 className="text-lg font-semibold text-brand-text-primary mt-1">CNG Delivery — Dangote Cement Plc</h2>
          </div>
          <ApprovalBadge status="in_progress" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[["Customer", "Dangote Cement Plc"], ["Gas Type", "CNG"], ["Quantity", "12,000 kg"], ["Unit Price", formatCurrency(850)], ["Total Amount", formatCurrency(10200000)], ["Delivery Address", "Obajana, Kogi State"], ["Requested Date", formatDate("2024-05-14")], ["Assigned Driver", "Musa Abdullahi"]].map(([l, v]) => (
            <div key={l}><p className="text-brand-text-secondary text-xs">{l}</p><p className="font-medium mt-0.5">{v}</p></div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

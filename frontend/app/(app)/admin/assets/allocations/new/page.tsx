"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import SelectInput from "@/components/forms/SelectInput";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { useAssetRequest, useAllocateAssetRequest, useAssets } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { capitalize } from "@/lib/utils";
import type { AssetRequestItem } from "@/types";

interface ItemSectionProps {
  item: AssetRequestItem;
  slots: Record<string, string>;
  selectedIds: Set<string>;
  onSlotChange: (key: string, assetId: string) => void;
}

function ItemSection({ item, slots, selectedIds, onSlotChange }: ItemSectionProps) {
  const { data: assetsOfType = [] } = useAssets({
    asset_type_id: item.asset_type_id,
    status: "available",
  });

  const typeName = item.asset_type?.name ?? "Unknown type";
  const qty = item.quantity;

  return (
    <FormSection
      title={`${typeName} — ${qty} unit${qty !== 1 ? "s" : ""} requested`}
      description={`Select ${qty === 1 ? "an available" : qty + " available"} ${typeName.toLowerCase()} unit${qty !== 1 ? "s" : ""} from the registry`}
    >
      <div className="space-y-4">
        {Array.from({ length: qty }, (_, i) => {
          const slotKey = `${item.id}_${i}`;
          const currentVal = slots[slotKey] ?? "";
          const options = assetsOfType
            .filter((a) => !selectedIds.has(a.id) || a.id === currentVal)
            .map((a) => ({
              value: a.id,
              label: [a.asset_tag, a.name, a.location ? `(${a.location})` : ""].filter(Boolean).join(" · "),
            }));

          return (
            <div key={slotKey}>
              {qty > 1 && (
                <p className="text-xs font-medium text-brand-text-secondary mb-1.5">Unit {i + 1}</p>
              )}
              <SelectInput
                placeholder={
                  assetsOfType.length === 0
                    ? `No available ${typeName.toLowerCase()} units — register one first`
                    : `Select a ${typeName.toLowerCase()}…`
                }
                options={options}
                value={currentVal}
                onValueChange={(v) => onSlotChange(slotKey, v)}
                disabled={assetsOfType.length === 0}
                searchable={options.length > 5}
                sortOptions={false}
              />
            </div>
          );
        })}
      </div>
    </FormSection>
  );
}

function AllocateAssetsContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId") ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { user } = useCurrentUser();

  const { data: request, isLoading, isError } = useAssetRequest(requestId);
  const allocate = useAllocateAssetRequest();

  const [slots, setSlots] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!request) return;
    const initial: Record<string, string> = {};
    for (const item of request.items) {
      for (let i = 0; i < item.quantity; i++) {
        initial[`${item.id}_${i}`] = "";
      }
    }
    setSlots(initial);
  }, [request?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin route = admin access; also check explicit roles
  const isAssetAdmin =
    pathname.startsWith("/admin") ||
    user?.role === "asset_admin" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  const selectedIds = useMemo(
    () => new Set(Object.values(slots).filter(Boolean)),
    [slots]
  );

  const totalUnits = request?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const filledCount = Object.values(slots).filter(Boolean).length;
  const allFilled = totalUnits > 0 && filledCount === totalUnits;

  function handleSlotChange(key: string, assetId: string) {
    setSlots((prev) => ({ ...prev, [key]: assetId }));
  }

  async function handleSubmit() {
    if (!request || !allFilled) return;
    const allocations = request.items.map((item) => ({
      itemId: item.id,
      assetIds: Array.from({ length: item.quantity }, (_, i) => slots[`${item.id}_${i}`]).filter(Boolean),
    }));
    try {
      await allocate.mutateAsync({
        requestId: request.id,
        allocations,
        allocatedByName: user?.name ?? "Asset Admin",
      });
      toast.success("Assets allocated successfully");
      router.push(`/admin/assets/requests/${request.id}`);
    } catch {
      toast.error("Failed to allocate assets");
    }
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Admin — Assets">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (!requestId || isError || !request) {
    return (
      <AppLayout pageTitle="Admin — Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">Request not found or no request ID provided.</p>
          <Link href="/admin/assets/requests" className="text-brand-purple text-sm hover:underline">Back to Requests</Link>
        </div>
      </AppLayout>
    );
  }

  if (!isAssetAdmin) {
    return (
      <AppLayout pageTitle="Admin — Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">You don&apos;t have permission to allocate assets.</p>
          <button onClick={() => router.back()} className="text-brand-purple text-sm hover:underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  if (request.status !== "approved") {
    return (
      <AppLayout pageTitle="Admin — Assets">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-brand-text-secondary">
          <AlertCircle size={32} />
          <p className="text-sm">
            This request cannot be allocated — current status is{" "}
            <ApprovalBadge status={request.status} className="inline" />.
          </p>
          <Link href={`/admin/assets/requests/${request.id}`} className="text-brand-purple text-sm hover:underline">
            View request
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Admin — Assets">

      <Link
        href={`/admin/assets/requests/${request.id}`}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Back to Request
      </Link>

      <PageHeader
        title="Allocate Assets"
        description={`Matching assets from the registry to ${request.reference}`}
        className="mb-6"
      />

      <div className="space-y-6">

        {/* Request summary */}
        <FormSection
          title="Request Details"
          description="Read-only summary of the approved request"
          bodyClassName="p-6 space-y-0"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Reference</p>
              <p className="text-sm font-mono font-medium text-brand-text-primary">{request.reference}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Requester</p>
              <p className="text-sm font-medium text-brand-text-primary">{request.requester_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Type</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                request.request_type === "loan"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-purple-50 text-purple-700 border border-purple-200"
              }`}>
                {capitalize(request.request_type)}
              </span>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary mb-0.5">Status</p>
              <ApprovalBadge status={request.status} />
            </div>
          </div>
          {request.purpose && (
            <p className="mt-4 pt-4 border-t border-brand-border text-sm text-brand-text-secondary leading-relaxed">
              {request.purpose}
            </p>
          )}
        </FormSection>

        {/* Asset pickers per item */}
        {request.items.map((item) => (
          <ItemSection
            key={item.id}
            item={item}
            slots={slots}
            selectedIds={selectedIds}
            onSlotChange={handleSlotChange}
          />
        ))}

        {/* Submit */}
        <div className="py-2">
          <button
            onClick={handleSubmit}
            disabled={!allFilled || allocate.isPending}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {allocate.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Allocating…
              </>
            ) : (
              `Confirm Allocation${!allFilled ? ` (${filledCount}/${totalUnits} selected)` : ""}`
            )}
          </button>
        </div>

      </div>
    </AppLayout>
  );
}

export default function AdminAllocateAssetsPage() {
  return (
    <Suspense
      fallback={
        <AppLayout pageTitle="Admin — Assets">
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        </AppLayout>
      }
    >
      <AllocateAssetsContent />
    </Suspense>
  );
}

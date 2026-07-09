"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSection from "@/components/ui/FormSection";

import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";
import { useCancelTripWorkflow } from "@/lib/modules/fleet/hooks/useCancelTripWorkflow";
import { canCancelTrip } from "@/lib/modules/fleet/guards/trip.guards";
import { FLEET_ROUTES } from "@/lib/modules/fleet/constants/routes";

export default function CancelTripPage() {
  const { id:tripNo } = useParams<{ id: string }>();
  const router = useRouter();
  const { trip, isLoading } = useTripByNo(tripNo);
  const cancelTrip = useCancelTripWorkflow();
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <AppLayout pageTitle="Cancel Trip">
        <p className="text-brand-text-secondary">Loading…</p>
      </AppLayout>
    );
  }

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  if (!canCancelTrip(trip)) {
    return (
      <AppLayout pageTitle="Cannot Cancel Trip">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">This trip cannot be cancelled</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Trips that are already dispatched, in transit, completed, or
            already cancelled cannot be cancelled from here.
          </p>
          <Button variant="outline" href={FLEET_ROUTES.tripDetail(tripNo)}>
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Cancel Trip">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Trip
      </button>

      <PageHeader
        title={`Cancel Trip — ${trip.trip_number}`}
        description="This action cannot be undone"
        className="mb-6"
      />

      <div className="max-w-xl space-y-6">
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">What happens when you cancel:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Driver and vehicle will be released and made available</li>
              <li>Any reserved inventory units will be returned to available stock</li>
              {trip.order_ids.length > 0 && (
                <li>
                  {trip.order_ids.length} order(s) on this trip will return to
                  the dispatch queue
                </li>
              )}
            </ul>
          </div>
        </div>

        <FormSection
          title="Cancellation Reason"
          description="Optional — helps with reporting and operational review"
        >
          <FormTextarea
            label="Reason"
            placeholder="e.g. Vehicle breakdown, driver unavailable, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={cancelTrip.isPending}
          >
            Keep Trip
          </Button>
          <Button
            variant="danger"
            loading={cancelTrip.isPending}
            loadingText="Cancelling…"
            onClick={() => cancelTrip.mutate({ trip, reason: reason || undefined })}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
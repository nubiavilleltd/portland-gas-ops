"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import Button from "@/components/ui/Button";

import { formatCurrency } from "@/lib/utils";

export default function DispatchOrderPage() {
  const router = useRouter();

  return (
    <AppLayout pageTitle="Dispatch Order">

      <PageHeader
        title="Dispatch Order"
        description="Assign logistics and manage delivery workflow"
        className="mb-6"
      />

      <div className="space-y-6">

        {/* ORDER SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Order Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">

            <div>
              <p className="text-xs text-brand-text-secondary">
                Order Number
              </p>

              <p className="font-medium mt-1">
                ORD-20260515-A102
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Customer
              </p>

              <p className="font-medium mt-1">
                Dangote Cement Plc
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Product
              </p>

              <p className="font-medium mt-1">
                CNG
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Order Value
              </p>

              <p className="font-medium mt-1">
                {formatCurrency(10200000)}
              </p>
            </div>

          </div>

        </div>

        {/* DISPATCH INFORMATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Dispatch Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <FormSelect
              label="Assign Driver"
              required
              options={[
                {
                  value: "musa",
                  label: "Musa Abdullahi",
                },

                {
                  value: "john",
                  label: "John Okafor",
                },

                {
                  value: "ibrahim",
                  label: "Ibrahim Bello",
                },
              ]}
            />

            <FormSelect
              label="Assign Vehicle"
              required
              options={[
                {
                  value: "trk-001",
                  label: "LNG-TRK-001",
                },

                {
                  value: "trk-002",
                  label: "LNG-TRK-002",
                },

                {
                  value: "trk-003",
                  label: "LNG-TRK-003",
                },
              ]}
            />

            <FormDatePicker
              label="Dispatch Date"
            />

            <FormDatePicker
              label="Estimated Delivery Date"
            />

            <FormSelect
              label="Delivery Status"
              required
              options={[
                {
                  value: "assigned",
                  label: "Assigned",
                },

                {
                  value: "dispatched",
                  label: "Dispatched",
                },

                {
                  value: "in_transit",
                  label: "In Transit",
                },

                {
                  value: "delivered",
                  label: "Delivered",
                },

                {
                  value: "failed",
                  label: "Failed Delivery",
                },
              ]}
            />

          </div>

          <div className="mt-5">

            <FormTextarea
              label="Dispatch Notes"
              placeholder="Driver instructions, delivery notes, customer directions..."
            />

          </div>

        </div>

        {/* DELIVERY LOCATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Delivery Information
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-xs text-brand-text-secondary">
                Delivery Address
              </p>

              <p className="font-medium mt-1">
                Obajana Industrial Layout,
                Kogi State, Nigeria
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Customer Contact
              </p>

              <p className="font-medium mt-1">
                +234 801 234 5678
              </p>
            </div>

          </div>

        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pb-10">

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button variant="secondary">
            Save Dispatch
          </Button>

          <Button>
            Mark In Transit
          </Button>

        </div>

      </div>

    </AppLayout>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import Button from "@/components/ui/Button";

const schema = z.object({
  customer_id: z.string().min(1, "Select a customer"),
  gas_type: z.enum(["CNG", "LNG"]),
  quantity_kg: z.string().min(1, "Enter quantity"),
  unit_price: z.string().min(1, "Enter unit price"),
  delivery_address: z.string().min(3, "Enter delivery address"),
  delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewOrderPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    void data;
    await new Promise((r) => setTimeout(r, 600));
    router.push("/orders");
  }

  return (
    <AppLayout pageTitle="Orders & Dispatch">
      <PageHeader title="New Gas Order" description="Create a new customer gas order" className="mb-6" />
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSelect label="Customer" required options={[{ value: "c1", label: "Dangote Cement Plc" }, { value: "c2", label: "Julius Berger Nigeria" }, { value: "c3", label: "MTN Nigeria HQ" }]} placeholder="Select customer" error={errors.customer_id?.message} {...register("customer_id")} />
          <div className="grid grid-cols-3 gap-4">
            <FormSelect label="Gas Type" required options={[{ value: "CNG", label: "CNG" }, { value: "LNG", label: "LNG" }]} error={errors.gas_type?.message} {...register("gas_type")} />
            <FormInput label="Quantity (kg)" type="number" required error={errors.quantity_kg?.message} {...register("quantity_kg")} />
            <FormInput label="Unit Price (₦/kg)" type="number" required error={errors.unit_price?.message} {...register("unit_price")} />
          </div>
          <FormInput label="Delivery Address" required placeholder="Street, City, State" error={errors.delivery_address?.message} {...register("delivery_address")} />
          <FormDatePicker label="Requested Delivery Date" {...register("delivery_date")} />
          <FormTextarea label="Notes" placeholder="Any special delivery instructions…" {...register("notes")} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} loadingText="Creating...">
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

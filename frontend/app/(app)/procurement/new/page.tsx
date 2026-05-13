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

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department: z.string().min(1, "Select a department"),
  estimated_amount: z.string().optional(),
  vendor_name: z.string().optional(),
  vendor_contact: z.string().optional(),
  required_by: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const deptOptions = [
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "safety", label: "Safety" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT" },
  { value: "logistics", label: "Logistics" },
  { value: "executive", label: "Executive" },
  { value: "engineering", label: "Engineering" },
];

export default function NewProcurementPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(_data: FormData) {
    // TODO: call post<ProcurementResponse>("/api/procurement", data)
    await new Promise((r) => setTimeout(r, 600));
    router.push("/procurement");
  }

  return (
    <AppLayout pageTitle="Procurement">
      <PageHeader title="New Purchase Request" description="Submit a new procurement requisition for approval" className="mb-6" />
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput label="Request Title" required placeholder="e.g. Generator fuel supply — Q3 2024" error={errors.title?.message} {...register("title")} />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect label="Department" required options={deptOptions} placeholder="Select department" error={errors.department?.message} {...register("department")} />
            <FormInput label="Estimated Amount (₦)" type="number" placeholder="0.00" error={errors.estimated_amount?.message} {...register("estimated_amount")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Vendor Name" placeholder="e.g. Total Energies Nigeria" {...register("vendor_name")} />
            <FormInput label="Vendor Contact" placeholder="email or phone" {...register("vendor_contact")} />
          </div>
          <FormDatePicker label="Required By" {...register("required_by")} />
          <FormTextarea label="Description / Justification" placeholder="Describe what is needed and why…" {...register("description")} />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

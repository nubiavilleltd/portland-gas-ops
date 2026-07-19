"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import Button from "@/components/ui/Button";
import { useCreateLeaveType } from "@/lib/modules/leave-types/hooks";
import { LeaveTypeCreatePayload } from "@/lib/modules/leave-types/types";
import { useToast } from "@/hooks/useToast";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl shadow-sm">
      <div className="rounded-t-2xl border-b border-brand-border bg-gray-50 px-6 py-4">
        <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
      </div>
      <div className="px-6 pt-5 pb-6">{children}</div>
    </div>
  );
}

export default function NewLeaveTypePage() {
  const router = useRouter();
  const toast = useToast();
  const create = useCreateLeaveType();

  const [formData, setFormData] = useState<LeaveTypeCreatePayload>({
    leave_type_name: "",
    entitlement_days: 0,
    description: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue =
      type === "number" ? (value ? parseInt(value) : 0) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.leave_type_name.trim()) {
      newErrors.leave_type_name = "Leave type name is required";
    }

    if (formData.entitlement_days <= 0) {
      newErrors.entitlement_days = "Entitlement days must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await create.mutateAsync(formData);
      toast.success("Leave type created successfully");
      router.push("/admin/leave-types");
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        "Failed to create leave type. Please try again.";
      toast.error(message);
    }
  };

  return (
    <AppLayout pageTitle="Add Leave Type">
      <Link
        href="/admin/leave-types"
        className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary hover:text-brand-purple transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Leave Types
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-brand-text-primary">Add Leave Type</h1>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          Create a new leave type for your organization
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Leave Type Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Leave Type Name"
              name="leave_type_name"
              value={formData.leave_type_name}
              onChange={handleChange}
              placeholder="e.g., Annual Leave"
              error={errors.leave_type_name}
              required
              disabled={create.isPending}
            />

            <FormInput
              label="Entitlement Days"
              name="entitlement_days"
              type="number"
              value={formData.entitlement_days}
              onChange={handleChange}
              placeholder="e.g., 21"
              min={1}
              error={errors.entitlement_days}
              required
              disabled={create.isPending}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Brief description of this leave type..."
              rows={4}
              disabled={create.isPending}
            />
          </div>
        </Section>

        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={create.isPending}
            loading={create.isPending}
          >
            Create Leave Type
          </Button>
          <Link href="/admin/leave-types">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </AppLayout>
  );
}

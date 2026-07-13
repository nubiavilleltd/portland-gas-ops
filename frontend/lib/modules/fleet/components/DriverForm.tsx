// lib/modules/fleet/components/DriverForm.tsx

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";
import ProfilePicUpload from "@/components/forms/ProfilePicUpload";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { toast } from "sonner";

export type DriverFormValues = {
  employee_id: string;
  license_number: string;
  license_expiry_date: string;
  experience_years: string;
  address: string;
};

export const DEFAULT_DRIVER_FORM_VALUES: DriverFormValues = {
  employee_id: "",
  license_number: "",
  license_expiry_date: "",
  experience_years: "",
  address: "",
};

interface DriverFormProps {
  defaultValues?: Partial<DriverFormValues>;
  employees: PickedEmployee[];              // ← new prop
  defaultEmployee?: PickedEmployee | null;   // ← new prop, for edit mode
  onSubmit: (data: DriverFormValues) => Promise<void>;   // ← no more profilePic param
  onCancel: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
}

export default function DriverForm({
  defaultValues,
  employees,
  defaultEmployee,
  onSubmit,
  onCancel,
  submitLabel = "Add Driver",
  submitLoadingLabel = "Saving...",
}: DriverFormProps) {
  const [form, setForm] = useState<DriverFormValues>({
    ...DEFAULT_DRIVER_FORM_VALUES,
    ...defaultValues,
  });

 const [pickedEmployee, setPickedEmployee] = useState<PickedEmployee | null>(null);

const selectedEmployee = pickedEmployee ?? defaultEmployee ?? null;
  const [loading, setLoading] = useState(false);

  function patch(field: keyof DriverFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !selectedEmployee ||
      !form.license_number ||
      !form.license_expiry_date ||
      !form.experience_years
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ ...form, employee_id: selectedEmployee?.id as string});
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <FormSection
        title="Driver Profile"
        description="Personal and professional information of the driver"
      >
        <div className="space-y-5">

          {/* <ProfilePicUpload
            value={profilePic}
            onChange={setProfilePic}
            shape="circle"
            size={110}
            fallback={form.full_name?.[0] ?? "D"}
            label="Driver Profile Picture"
          /> */}

          <div className="grid grid-cols-2 gap-5">
            <EmployeePicker
              label="Employee"
              required
              employees={employees}
              value={selectedEmployee}
              onChange={setPickedEmployee}
              disabled={!!defaultEmployee}
            />

            <FormInput
              label="Home Address"
              placeholder="e.g. 14 Bode Thomas Street, Lagos"
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
            />
          </div>

          {/* <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="Phone Number"
              required
              placeholder="e.g. 08031234567"
              value={form.phone_number}
              onChange={(e) => patch("phone_number", e.target.value)}
            />

            <FormInput
              label="Home Address"
              placeholder="e.g. 14 Bode Thomas Street, Lagos"
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
            />
          </div> */}

        </div>
      </FormSection>

      <FormSection
        title="License & Experience"
        description="Driver license details and years of experience"
      >
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="License Number"
              required
              placeholder="e.g. DRV-20394-LA"
              value={form.license_number}
              onChange={(e) => patch("license_number", e.target.value)}
            />

            <FormDatePicker
              label="License Expiry Date"
              required
              value={form.license_expiry_date}
              onValueChange={(v) => patch("license_expiry_date", v)}
            />
          </div>

          <FormInput
            label="Experience (Years)"
            required
            type="number"
            placeholder="e.g. 5"
            value={form.experience_years}
            onChange={(e) => patch("experience_years", e.target.value)}
          />

        </div>
      </FormSection>

      <div className="flex justify-end gap-3 pb-10">
        {/* <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button> */}
        <Button type="submit" disabled={loading}>
          {loading ? submitLoadingLabel : submitLabel}
        </Button>
      </div>

    </form>
  );
}
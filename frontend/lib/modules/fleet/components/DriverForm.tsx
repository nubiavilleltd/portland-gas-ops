// lib/modules/fleet/components/DriverForm.tsx

"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";
import EmployeePicker, { type PickedEmployee } from "@/components/ui/EmployeePicker";
import { toast } from "sonner";



import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createDriverSchema,
  editDriverSchema,
  type CreateDriverFormInput,
  type CreateDriverFormData,
  type EditDriverFormInput,
  type EditDriverFormData,
  type DriverFormInput,
  type DriverFormData,
} from "../schemas/driver.schema";
import FormSelect from "@/components/forms/FormSelect";

export type DriverFormValues = DriverFormData;



// interface DriverFormProps {
//   defaultValues?: Partial<CreateDriverFormInput>;
//   employees: PickedEmployee[];              // ← new prop
//   defaultEmployee?: PickedEmployee | null;   // ← new prop, for edit mode
//   onSubmit: (data: CreateDriverFormData) => Promise<void>;
//   onCancel: () => void;
//   submitLabel?: string;
//   submitLoadingLabel?: string;
//   isEdit?: boolean;
//   status?: "off_duty" | "suspended";
// }



interface DriverFormBaseProps {
  employees: PickedEmployee[];
  defaultEmployee?: PickedEmployee | null;
  onCancel: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
  status:string;
}

type CreateDriverFormProps = DriverFormBaseProps & {
  isEdit?: false;
  defaultValues?: Partial<CreateDriverFormInput>;
  onSubmit: (data: CreateDriverFormData) => Promise<void>;
};

type EditDriverFormProps = DriverFormBaseProps & {
  isEdit: true;
  status: "available" | "assigned" | "in_transit" | "off_duty" | "suspended"
  defaultValues?: Partial<EditDriverFormInput>;
  onSubmit: (data: EditDriverFormData) => Promise<void>;
};

type DriverFormProps =
  | CreateDriverFormProps
  | EditDriverFormProps;

export default function DriverForm({
  defaultValues,
  employees,
  defaultEmployee,
  onSubmit,
  onCancel,
  status,
  isEdit,
  submitLabel = "Add Driver",
  submitLoadingLabel = "Saving...",
}: DriverFormProps) {


  const schema = isEdit ? editDriverSchema : createDriverSchema;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormInput, unknown, DriverFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employee_id: defaultEmployee?.id ?? "",
      license_number: "",
      license_expiry_date: "",
      experience_years: "0",
      address: "",
      ...(isEdit ? { status: "off_duty" as const } : {}),
      ...defaultValues,
    },
  });


  // const employeeMap = useMemo(
  //   () => new Map(employees.map((e) => [e.id, e])),
  //   [employees]
  // );


  async function submit(data: DriverFormData) {
    await onSubmit(data as CreateDriverFormData & EditDriverFormData);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">

      <FormSection
        title="Driver Profile"
        description="Personal and professional information of the driver"
      >
        <div className="space-y-5">

          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="employee_id"
              render={({ field, fieldState }) => (
                <EmployeePicker
                  label="Employee"
                  required
                  employees={employees}
                  disabled={!!defaultEmployee}
                  value={
                    employees.find((e) => e.id === field.value) ??
                    defaultEmployee ??
                    null
                  }
                  onChange={(employee) => field.onChange(employee?.id ?? "")}
                  error={fieldState.error?.message}
                />
              )}
            />

            <FormInput
              label="Home Address"
              placeholder="e.g. 14 Bode Thomas Street, Lagos"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>


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
              error={errors.license_number?.message}
              {...register("license_number")}
            />

            <Controller
              control={control}
              name="license_expiry_date"
              render={({ field, fieldState }) => (
                <FormDatePicker
                  label="License Expiry Date"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  ={new Date().toISOString().split("T")[0]}min

                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
       <Controller
            control={control}
            name="experience_years"
            render={({ field, fieldState }) => (
              <FormInput
                label="Experience (Years)"
                required
                type="text"
                inputMode="numeric"
                placeholder="e.g. 5"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />


          {/* {isEdit && (
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Driver Status"
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={status === "assigned" || status === "in_transit"}
                  options={[
                    {
                      label: "Off Duty",
                      value: "off_duty",
                    },
                    {
                      label: "Suspended",
                      value: "suspended",
                    },
                    {
                      label: "Assigned",
                      value: "assigned",
                    },
                    {
                      label: "Available",
                      value: "available",
                    },
                    {
                      label: "In Transit",
                      value: "in_transit",
                    },
                  ]}
                />
              )}
            />
          )} */}
          </div>

     

        </div>
      </FormSection>

      <div className="flex gap-3 pb-10">
        {/* <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button> */}
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? submitLoadingLabel : submitLabel}
        </Button>
      </div>

    </form>
  );
}
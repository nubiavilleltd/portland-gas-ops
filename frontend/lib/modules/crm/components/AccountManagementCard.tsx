"use client";
import type { CustomerForm } from "../types";

import FormSection from "@/components/ui/FormSection";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import EmployeePicker, {
  type PickedEmployee,
} from "@/components/ui/EmployeePicker";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useCustomers } from "@/lib/modules/crm";

type Props = {
  values: {
    customerType: string;
    salesContact: string | null;
    referrerType: string;
    referrerId: string;
  };
  readOnly?: boolean;
  errors?: Record<string, string>;
  onChange: <K extends keyof CustomerForm>(
    field: K,
    value: CustomerForm[K],
  ) => void;
};

const REFERRER_TYPES = [
  { label: "Employee", value: "employee" },
  { label: "Existing Customer", value: "customer" },
  { label: "Partner", value: "partner" },
  { label: "Consultant", value: "consultant" },
  { label: "Marketing", value: "marketing" },
];

export default function AccountManagementCard({
  values,
  errors = {},
  readOnly = false,
  onChange,
}: Props) {
  const { data: employeeList = [] } = useEmployees();
  const { data: customerList = [] } = useCustomers();
  const employees: PickedEmployee[] = employeeList.map((e) => ({
    id: e.id,
    name:
      [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") ||
      "Unknown",
    role: e.job_title ?? e.user?.role ?? "",
    department: e.department ?? "",
    avatar_url: e.user?.profile_picture_url,
  }));
  const CUSTOMER_OPTIONS = customerList
    .filter((item: any) => item.status == "active")
    .map((customer: any) => ({
      label: customer.customer_name,
      value: String(customer.id),
    }));
  const selectedReferrer =
    employees.find((emp) => String(emp.id) === values.referrerId) ?? null;
  const selectedSalesContact =
    employees.find((emp) => String(emp.id) === values.salesContact) ?? null;
  return (
    <FormSection
      title="Account Management"
      description="Assign ownership of this customer and capture referral information."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Customer Type"
          value={
            values.customerType === "purchasing"
              ? "Purchasing Customer"
              : "Potential Customer"
          }
          disabled={readOnly}
        />
        <EmployeePicker
          label="Sales Contact"
          placeholder="Select sales contact"
          employees={employees}
          value={selectedSalesContact}
          onChange={(employee) =>
            onChange("salesContact", employee ? String(employee.id) : null)
          }
        />

        <FormSelect
          label="Referrer Type"
          value={values.referrerType}
          options={REFERRER_TYPES}
          error={errors.referrerType}
          onValueChange={(value) => {
            onChange("referrerType", value as CustomerForm["referrerType"]);
            onChange("referrerId", "");
          }}
          disabled={readOnly}
        />

        {values.referrerType === "employee" ? (
          <EmployeePicker
            label="Referrer"
            placeholder="Select employee"
            employees={employees}
            value={selectedReferrer}
            onChange={(employee) =>
              onChange("referrerId", employee ? String(employee.id) : "")
            }
          />
        ) : values.referrerType === "customer" ? (
          <FormSelect
            label="Referrer"
            placeholder="Select customer"
            value={values.referrerId}
            options={CUSTOMER_OPTIONS}
            error={errors.referrer}
            onValueChange={(value) => onChange("referrerId", value)}
            disabled={readOnly}
          />
        ) : (
          <FormInput
            label="Referrer"
            placeholder="Enter referrer"
            value={values.referrerId}
            error={errors.referrer}
            onChange={(e) => onChange("referrerId", e.target.value)}
            disabled={readOnly}
          />
        )}
      </div>
    </FormSection>
  );
}

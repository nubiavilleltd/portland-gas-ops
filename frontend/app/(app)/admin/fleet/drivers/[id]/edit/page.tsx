"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DriverForm, { type DriverFormValues } from "@/lib/modules/fleet/components/DriverForm";
// import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { useDriverById, useUpdateDriver } from "@/lib/modules/fleet/hooks/useDrivers";
import { useEmployees, useEmployee } from "@/lib/modules/employees/hooks";
import type { PickedEmployee } from "@/components/ui/EmployeePicker";
import { FLEET_ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { useMemo } from "react";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { driver } = useDriverById(id);
  const { data: allEmployees = [] } = useEmployees({ limit: 200 });
  const { data: currentEmployee } = useEmployee(driver?.employee_id ?? "");
  const { updateDriver } = useUpdateDriver();


  const employeeOptions: PickedEmployee[] = useMemo(() => allEmployees.map((e) => ({
    id: e.id,
    name: e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : e.employee_no,
    role: e.job_title ?? "—",
    department: e.department ?? "—",
    avatar_url: e.user?.profile_picture_url ?? null,
  })), [allEmployees])

  if (!driver) {
    return (
      <AppLayout pageTitle="Driver Not Found">
        <p>Driver not found.</p>
      </AppLayout>
    );
  }


  const defaultEmployee: PickedEmployee | null = currentEmployee
    ? {
        id: currentEmployee.id,
        name: currentEmployee.user
          ? `${currentEmployee.user.first_name ?? ""} ${currentEmployee.user.last_name ?? ""}`.trim()
          : currentEmployee.employee_no,
        role: currentEmployee.job_title ?? "—",
        department: currentEmployee.department ?? "—",
        avatar_url: currentEmployee.user?.profile_picture_url ?? null,
      }
    : null;

async function handleSubmit(data: DriverFormValues) {
  await updateDriver({
    id,
    input: {
      license_number: data.license_number,
      license_expiry_date: data.license_expiry_date,
      experience_years: Number(data.experience_years),
      address: data.address,
    },
  });

  toast.success("Driver successfully updated");
  router.push(`/admin/${FLEET_ROUTES.driverDetail(id)}`);
}

  return (
    <AppLayout pageTitle="Edit Driver">
      <BackButton href={`/admin/${FLEET_ROUTES.driverDetail(id)}`} label="Back to Driver" />
      <PageHeader title={`Edit — ${driver.full_name}`} description={driver.license_number} className="mb-6" />
 

      <DriverForm
        isEdit
        status={driver.status}
        employees={employeeOptions}
        defaultEmployee={defaultEmployee}
        defaultValues={{
          license_number: driver.license_number,
          license_expiry_date: driver.license_expiry_date,
          experience_years: String(driver.experience_years),
          address: driver.address ?? "",
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/${FLEET_ROUTES.driverDetail(id)}`)}
        submitLabel="Save Changes"
        submitLoadingLabel="Saving..."
      />
    </AppLayout>
  );
}

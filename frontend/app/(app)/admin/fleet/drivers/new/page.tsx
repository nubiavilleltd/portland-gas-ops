
// "use client";

// import { useRouter } from "next/navigation";
// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import DriverForm, { type DriverFormValues } from "@/lib/modules/fleet/components/DriverForm";
// import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
// import { UploadService } from "@/lib/services/upload.service";
// import { FLEET_ROUTES } from "@/lib/routes";
// import { toast } from "sonner";
// import { BackButton } from "@/components/ui/BackButton";

// export default function AddDriverPage() {
//   const router = useRouter();

//   async function handleSubmit(data: DriverFormValues, profilePic: File | null) {
//     let profileImageUrl: string | undefined = undefined;

//     if (profilePic) {
//       profileImageUrl = await UploadService.uploadImage(profilePic);
//     }

//     await DriversService.createDriver({
//       full_name: data.full_name,
//       email: data.email,
//       phone_number: data.phone_number,
//       license_number: data.license_number,
//       license_expiry_date: data.license_expiry_date,
//       experience_years: Number(data.experience_years),
//       address: data.address,
//       profile_image: profileImageUrl ?? "",
//       status: "available",
//     });

//     toast.success("Driver successfully created")
//     router.push(`/admin/${FLEET_ROUTES.driverList()}`);
//   }

//   return (
//     <AppLayout pageTitle="Add Driver">

//       <BackButton
//         href={`/admin${FLEET_ROUTES.driverList()}`}
//         label="Back to Drivers"
//       />
//       <PageHeader
//         title="Add Driver"
//         description="Register a new fleet driver for dispatch operations"
//         className="mb-6"
//       />
//       <DriverForm
//         onSubmit={handleSubmit}
//         onCancel={() => router.back()}
//         submitLabel="Add Driver"
//         submitLoadingLabel="Adding..."
//       />
//     </AppLayout>
//   );
// }





"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DriverForm, { type DriverFormValues } from "@/lib/modules/fleet/components/DriverForm";
import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { useEmployees } from "@/lib/modules/employees/hooks";
import { useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import type { PickedEmployee } from "@/components/ui/EmployeePicker";
import { FLEET_ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";

export default function AddDriverPage() {
  const router = useRouter();

  const { data: allEmployees = [] } = useEmployees({ limit: 200 });
  const { drivers: existingDrivers } = useDrivers();

  const driverEmployeeIds = new Set(existingDrivers.map((d) => d.employee_id));

  const employeeOptions: PickedEmployee[] = allEmployees
    .filter((e) => !driverEmployeeIds.has(e.id))
    .map((e) => ({
      id: e.id,
      name: e.user ? `${e.user.first_name ?? ""} ${e.user.last_name ?? ""}`.trim() : e.employee_no,
      role: e.job_title ?? "—",
      department: e.department ?? "—",
      avatar_url: e.user?.profile_picture_url ?? null,
    }));

  async function handleSubmit(data: DriverFormValues) {
    await DriversService.createDriver({
      employee_id: data.employee_id,
      license_number: data.license_number,
      license_expiry_date: data.license_expiry_date,
      experience_years: Number(data.experience_years),
      address: data.address,
    });

    toast.success("Driver successfully created");
    router.push(`/admin/${FLEET_ROUTES.driverList()}`);
  }

  return (
    <AppLayout pageTitle="Add Driver">
      <BackButton href={`/admin${FLEET_ROUTES.driverList()}`} label="Back to Drivers" />
      <PageHeader
        title="Add Driver"
        description="Register a new fleet driver for dispatch operations"
        className="mb-6"
      />
      <DriverForm
        employees={employeeOptions}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Add Driver"
        submitLoadingLabel="Adding..."
      />
    </AppLayout>
  );
}
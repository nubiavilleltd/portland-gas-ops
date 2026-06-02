
"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DriverForm, { type DriverFormValues } from "@/lib/modules/fleet/components/DriverForm";
import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { UploadService } from "@/lib/services/upload.service";
import { FLEET_ROUTES } from "@/lib/routes";

export default function AddDriverPage() {
  const router = useRouter();

  async function handleSubmit(data: DriverFormValues, profilePic: File | null) {
    let profileImageUrl: string | undefined = undefined;

    if (profilePic) {
      profileImageUrl = await UploadService.uploadImage(profilePic);
    }

    await DriversService.createDriver({
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      license_number: data.license_number,
      license_expiry_date: data.license_expiry_date,
      experience_years: Number(data.experience_years),
      address: data.address,
      profile_image: profileImageUrl ?? "",
      status: "available",
    });


    router.push(`/admin/${FLEET_ROUTES.driverList()}`);
  }

  return (
    <AppLayout pageTitle="Add Driver">
      <PageHeader
        title="Add Driver"
        description="Register a new fleet driver for dispatch operations"
        className="mb-6"
      />
      <DriverForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Add Driver"
        submitLoadingLabel="Adding..."
      />
    </AppLayout>
  );
}
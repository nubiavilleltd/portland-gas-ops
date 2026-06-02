"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DriverForm, { type DriverFormValues } from "@/lib/modules/fleet/components/DriverForm";
import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { UploadService } from "@/lib/services/upload.service";
import { useDriverById } from "@/lib/modules/fleet/hooks/useDrivers";
import { FLEET_ROUTES } from "@/lib/routes";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { driver } = useDriverById(id);

  if (!driver) {
    return (
      <AppLayout pageTitle="Driver Not Found">
        <p>Driver not found.</p>
      </AppLayout>
    );
  }

  async function handleSubmit(data: DriverFormValues, profilePic: File | null) {
    let profileImageUrl = driver?.profile_image;

    if (profilePic) {
      profileImageUrl = await UploadService.uploadImage(profilePic);
    }

    await DriversService.updateDriver(id, {
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      license_number: data.license_number,
      license_expiry_date: data.license_expiry_date,
      experience_years: Number(data.experience_years),
      address: data.address,
      profile_image: profileImageUrl,
    });

    router.push(`/admin/${FLEET_ROUTES.driverDetail(id)}`);
  }

  return (
    <AppLayout pageTitle="Edit Driver">
      <PageHeader
        title={`Edit — ${driver.full_name}`}
        description={driver.license_number}
        className="mb-6"
      />
      <DriverForm
        defaultValues={{
          full_name: driver.full_name,
          email: driver.email,
          phone_number: driver.phone_number,
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
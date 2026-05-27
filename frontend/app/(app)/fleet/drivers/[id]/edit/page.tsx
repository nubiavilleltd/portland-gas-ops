"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import ProfilePicUpload from "@/components/forms/ProfilePicUpload";

import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
import FormSection from "@/components/ui/FormSection";
import { useDriverById } from "@/lib/modules/fleet/hooks/useDrivers";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const {driver:existingDriver} = useDriverById(id);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    license_number: "",
    experience_years: "",
    status: "available",
  });

  // 👇 NEW: profile picture state (NO REWORK, just extension)
  const [profilePic, setProfilePic] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  /* --------------------------------------------
     HYDRATE FORM
  ---------------------------------------------*/
  useEffect(() => {
    if (!existingDriver) return;

    setForm({
      full_name: existingDriver.full_name || "",
      email: existingDriver.email || "",
      phone_number: existingDriver.phone_number || "",
      license_number: existingDriver.license_number || "",
      experience_years: String(existingDriver.experience_years || ""),
      status: existingDriver.status || "available",
    });

    // no file hydration (correct behavior for File-based upload)
    setProfilePic(null);
  }, [existingDriver]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!existingDriver) return;

    setLoading(true);

    const driverIndex = drivers.findIndex((d) => d.id === id);

    if (driverIndex === -1) {
      setLoading(false);
      return;
    }

    drivers[driverIndex] = {
      ...drivers[driverIndex],

      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number,
      license_number: form.license_number,
      experience_years: Number(form.experience_years),
      status: form.status as any,

      // 👇 placeholder for backend upload integration later
      // profile_image: profilePic ? URL.createObjectURL(profilePic) : drivers[driverIndex].profile_image,
    };

    console.log("Driver updated:", drivers[driverIndex]);

    setLoading(false);

    router.push(`/fleet/drivers/${id}`);
  }

  if (!existingDriver) {
    return (
      <AppLayout pageTitle="Driver Not Found">
        Driver not found.
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Edit Driver">

      <PageHeader
        title="Edit Driver"
        description="Update driver profile and operational status"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">

      

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
       <FormSection
  title="Driver Profile"
  description="Personal and professional information of the driver"
>
  {/* 👇 NEW PROFILE PIC FIELD */}
  <div className="md:col-span-2">
    <ProfilePicUpload
      value={profilePic}
      onChange={setProfilePic}
    />
  </div>

  <FormInput
    label="Full Name"
    name="full_name"
    value={form.full_name}
    onChange={handleChange}
  />

  <FormInput
    label="Email"
    name="email"
    value={form.email}
    onChange={handleChange}
  />

  <FormInput
    label="Phone Number"
    name="phone_number"
    value={form.phone_number}
    onChange={handleChange}
  />

  <FormInput
    label="License Number"
    name="license_number"
    value={form.license_number}
    onChange={handleChange}
  />

  <FormInput
    label="Experience (Years)"
    name="experience_years"
    type="number"
    value={form.experience_years}
    onChange={handleChange}
  />

  {/* <FormInput
    label="Status"
    name="status"
    value={form.status}
    onChange={handleChange}
  /> */}
</FormSection>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">

            {/* <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button> */}

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Driver"}
            </Button>

          </div>

        </form>

      </div>

    </AppLayout>
  );
}
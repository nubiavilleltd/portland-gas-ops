"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";

import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";

export default function EditDriverPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const existingDriver = getDriverById(id);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    license_number: "",
    experience_years: "",
    status: "available",
  });

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

    // UPDATE MOCK STORE
    drivers[driverIndex] = {
      ...drivers[driverIndex],

      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number,
      license_number: form.license_number,
      experience_years: Number(form.experience_years),
      status: form.status as any,
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

          <FormInput
            label="Status (available | assigned | maintenance | inactive)"
            name="status"
            value={form.status}
            onChange={handleChange}
          />

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Driver"}
            </Button>

          </div>

        </form>

      </div>

    </AppLayout>
  );
}
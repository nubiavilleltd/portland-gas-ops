"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";

import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";

export default function AddDriverPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    license_number: "",
    experience_years: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,

      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number,
      license_number: form.license_number,
      experience_years: Number(form.experience_years),

      status: "available", // default fleet state

      created_at: new Date().toISOString().split("T")[0],
    };

    // MOCK SAVE (replace later with API)
    drivers.push(newDriver);

    console.log("Driver created:", newDriver);

    setLoading(false);

    router.push("/fleet/drivers");
  }

  return (
    <AppLayout pageTitle="Add Driver">
      <PageHeader
        title="Add Driver"
        description="Register a new fleet driver for dispatch operations"
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

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Driver"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

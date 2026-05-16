"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

export default function NewCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    type: "corporate",
    phone: "",
    email: "",
    address: ""
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("Customer Created:", form);

    // mock save
    alert("Customer created (mock)");

    router.push("/customers");
  }

  return (
    <AppLayout pageTitle="Customers">
      
      <PageHeader
        title="Create Customer"
        description="Add a new customer to the system"
        className="mb-6"
      />

      {/* Form Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Customer Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Customer Name
            </label>
            <input
              placeholder="Enter customer name"
              className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Customer Type
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="corporate">Corporate</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Phone Number
            </label>
            <input
              placeholder="Enter phone number"
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Email Address
            </label>
            <input
              placeholder="Enter email"
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Address
            </label>
            <textarea
              placeholder="Enter full address"
              className="w-full border border-gray-200 rounded-lg p-3 min-h-[100px]"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-brand-border rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
            >
              Save Customer
            </button>
          </div>

        </form>
      </div>

    </AppLayout>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { customers } from "@/lib/mock/customers";
import { useParams } from "next/navigation";

export default function EditCustomerPage() {
  const router = useRouter();

  const params = useParams();
const id = params.id as string;

  const existingCustomer = customers.find(
    (c) => c.id === params.id
  );

  const [form, setForm] = useState({
    name: "",
    type: "corporate",
    phone: "",
    email: "",
    address: ""
  });

  // Load existing data into form
  useEffect(() => {
    if (existingCustomer) {
      setForm({
        name: existingCustomer.name,
        type: existingCustomer.type,
        phone: existingCustomer.phone,
        email: existingCustomer.email,
        address: existingCustomer.address
      });
    }
  }, [existingCustomer]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("Updated Customer:", {
      id: params.id,
      ...form
    });

    alert("Customer updated (mock)");

    router.push(`/customers/${params.id}`);
  }

  if (!existingCustomer) {
    return (
      <AppLayout pageTitle="Customer">
        <div className="p-6">Customer not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Edit Customer">

      <PageHeader
        title="Edit Customer"
        description="Update customer information"
        className="mb-6"
      />

      {/* Form Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Customer Name
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
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
              onChange={(e) =>
                setForm({ ...form, type: e.target.value })
              }
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
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Email Address
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg p-3"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Address
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 min-h-25"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
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
              className="px-5 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark"
            >
              Save Changes
            </button>

          </div>

        </form>

      </div>

    </AppLayout>
  );
}
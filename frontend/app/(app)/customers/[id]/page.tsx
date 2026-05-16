"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { customers } from "@/lib/mock/customers";
import { useParams } from "next/navigation";

export default function CustomerDetailsPage() {
  const router = useRouter();
const params = useParams();
const id = params.id as string;

  const customer = customers.find((c) => c.id === params.id);

  if (!customer) {
    return (
      <AppLayout pageTitle="Customer">
        <div className="p-6">Customer not found</div>
      </AppLayout>
    );
  }

  function handleDelete() {
    const confirmDelete = confirm("Are you sure you want to delete this customer?");
    if (confirmDelete) {
      console.log("Deleted:", customer?.id);
      router.push("/customers");
    }
  }

  function handleEdit() {
    router.push(`/customers/${customer?.id}/edit`);
  }

  return (
    <AppLayout pageTitle="Customer Details">

      <PageHeader
        title={customer.name}
        description="Customer profile and account details"
        className="mb-6"
        action={
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>

            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        }
      />

      {/* Customer Info Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl space-y-4">

        <div>
          <p className="text-sm text-gray-500">Customer Type</p>
          <p className="font-medium">{customer.type}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Phone</p>
          <p className="font-medium">{customer.phone}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{customer.email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Address</p>
          <p className="font-medium">{customer.address}</p>
        </div>

      </div>

    </AppLayout>
  );
}
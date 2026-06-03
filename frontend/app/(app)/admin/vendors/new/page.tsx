"use client";

import { useRouter } from "next/navigation";
import { useCreateVendor } from "@/hooks/useVendors";
import { useToast } from "@/hooks/useToast";
import type { VendorCategory } from "@/types";
import VendorForm, { EMPTY_VENDOR_FORM, type VendorFormValues } from "../_components/VendorForm";

export default function NewVendorPage() {
  const router = useRouter();
  const toast = useToast();
  const createVendor = useCreateVendor();

  function handleSubmit(values: VendorFormValues) {
    createVendor.mutate(
      { ...values, category: values.category as VendorCategory, logo_url: values.logo_url || null },
      {
        onSuccess: () => {
          toast.success("Vendor added");
          router.push("/admin/vendors");
        },
        onError: () => toast.error("Failed to add vendor"),
      }
    );
  }

  return (
    <VendorForm
      title="Add New Vendor"
      description="Register a new supplier or service provider"
      initial={EMPTY_VENDOR_FORM}
      loading={createVendor.isPending}
      onSubmit={handleSubmit}
    />
  );
}

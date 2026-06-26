"use client";

import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { useCreateVendor, useUploadVendorLogo, VENDOR_ERRORS } from "@/lib/modules/vendors";
=======
import { useCreateVendor, useUploadVendorLogo } from "@/hooks/useVendors";
>>>>>>> c7b4c06 (merging)
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { VendorCategory } from "@/types";
import VendorForm, { EMPTY_VENDOR_FORM, type VendorFormValues } from "../_components/VendorForm";

export default function NewVendorPage() {
  const router = useRouter();
  const toast = useToast();
  const createVendor = useCreateVendor();
  const uploadLogo = useUploadVendorLogo();

  async function handleSubmit(values: VendorFormValues, logoFile: File | null) {
    createVendor.mutate(
      { ...values, category: values.category as VendorCategory },
      {
        onSuccess: async (vendor) => {
          if (logoFile) {
            try {
              await uploadLogo.mutateAsync({ id: vendor.id, file: logoFile });
            } catch {
              toast.error("Vendor created but logo upload failed. You can re-upload from the edit page.");
              router.push("/admin/vendors");
              return;
            }
          }
          toast.success("Vendor added");
          router.push("/admin/vendors");
        },
        onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
      }
    );
  }

  return (
    <VendorForm
      title="Add New Vendor"
      description="Register a new supplier or service provider"
      initial={EMPTY_VENDOR_FORM}
      loading={createVendor.isPending || uploadLogo.isPending}
      onSubmit={handleSubmit}
    />
  );
}

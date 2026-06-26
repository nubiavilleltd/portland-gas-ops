"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useVendor, useUpdateVendor, useUploadVendorLogo, VENDOR_ERRORS } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { VendorCategory } from "@/types";
import VendorForm, { type VendorFormValues } from "../../_components/VendorForm";

export default function EditVendorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: vendor, isLoading, isError } = useVendor(id);
  const updateVendor = useUpdateVendor(id);
  const uploadLogo = useUploadVendorLogo();

  if (isLoading) {
    return (
      <AppLayout pageTitle="Admin — Vendors">
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      </AppLayout>
    );
  }

  if (isError || !vendor) {
    return (
      <AppLayout pageTitle="Admin — Vendors">
        <div className="text-center py-20 text-brand-text-secondary">Vendor not found.</div>
      </AppLayout>
    );
  }

  const initial: VendorFormValues = {
    name: vendor.name ?? "",
    category: vendor.category ?? "",
    contact_person: vendor.contact_person ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    address: vendor.address ?? "",
    bank_name: vendor.bank_name ?? "",
    account_name: vendor.account_name ?? "",
    account_number: vendor.account_number ?? "",
    logo_url: vendor.logo_url ?? "",
  };

  async function handleSubmit(values: VendorFormValues, logoFile: File | null) {
    updateVendor.mutate(
      { ...values, category: values.category as VendorCategory },
      {
        onSuccess: async () => {
          if (logoFile) {
            try {
              await uploadLogo.mutateAsync({ id, file: logoFile });
            } catch {
              toast.error("Vendor updated but logo upload failed. Try re-uploading.");
              router.push("/admin/vendors");
              return;
            }
          }
          toast.success("Vendor updated");
          router.push("/admin/vendors");
        },
        onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
      }
    );
  }

  return (
    <VendorForm
      title="Edit Vendor"
      description={`Update details for ${vendor.name}`}
      initial={initial}
      loading={updateVendor.isPending || uploadLogo.isPending}
      onSubmit={handleSubmit}
    />
  );
}

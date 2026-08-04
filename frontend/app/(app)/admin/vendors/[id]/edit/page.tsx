"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useVendor, useUpdateVendor, useUploadVendorLogo, useUploadVendorDocument, VENDOR_ERRORS } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { VendorCategory, VendorSize } from "@/types";
import VendorForm, { type VendorFormValues, type VendorDocumentFiles } from "../../_components/VendorForm";

export default function EditVendorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: vendor, isLoading, isError } = useVendor(id);
  const updateVendor = useUpdateVendor(id);
  const uploadLogo = useUploadVendorLogo();
  const uploadDocument = useUploadVendorDocument();

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
    business_size: vendor.business_size ?? "",
    contact_person: vendor.contact_person ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    address: vendor.address ?? "",
    bank_name: vendor.bank_name ?? "",
    account_name: vendor.account_name ?? "",
    account_number: vendor.account_number ?? "",
    logo_url: vendor.logo_url ?? "",
    cac_certificate_url: vendor.cac_certificate_url ?? "",
    tin_certificate_url: vendor.tin_certificate_url ?? "",
    vat_certificate_url: vendor.vat_certificate_url ?? "",
  };

  async function handleSubmit(values: VendorFormValues, logoFile: File | null, documentFiles: VendorDocumentFiles) {
    updateVendor.mutate(
      {
        ...values,
        category: values.category as VendorCategory,
        business_size: values.business_size as VendorSize,
      },
      {
        onSuccess: async () => {
          const uploadErrors: string[] = [];

          // Upload logo if provided
          if (logoFile) {
            try {
              await uploadLogo.mutateAsync({ id, file: logoFile });
            } catch {
              uploadErrors.push("logo");
            }
          }

          // Upload compliance documents if provided
          if (documentFiles.cac) {
            try {
              await uploadDocument.mutateAsync({ id, documentType: "cac", file: documentFiles.cac });
            } catch {
              uploadErrors.push("CAC certificate");
            }
          }
          if (documentFiles.tin) {
            try {
              await uploadDocument.mutateAsync({ id, documentType: "tin", file: documentFiles.tin });
            } catch {
              uploadErrors.push("TIN certificate");
            }
          }
          if (documentFiles.vat) {
            try {
              await uploadDocument.mutateAsync({ id, documentType: "vat", file: documentFiles.vat });
            } catch {
              uploadErrors.push("VAT certificate");
            }
          }

          if (uploadErrors.length > 0) {
            toast.error(`Vendor updated but ${uploadErrors.join(", ")} upload failed. Try re-uploading.`);
          } else {
            toast.success("Vendor updated");
          }
          router.push("/admin/vendors");
        },
        onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
      }
    );
  }

  const isLoading2 = updateVendor.isPending || uploadLogo.isPending || uploadDocument.isPending;

  return (
    <VendorForm
      title="Edit Vendor"
      description={`Update details for ${vendor.name}`}
      initial={initial}
      loading={isLoading2}
      onSubmit={handleSubmit}
    />
  );
}

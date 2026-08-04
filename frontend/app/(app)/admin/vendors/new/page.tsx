"use client";

import { useRouter } from "next/navigation";
import { useCreateVendor, useUploadVendorLogo, useUploadVendorDocument, VENDOR_ERRORS } from "@/lib/modules/vendors";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage } from "@/lib/errors";
import type { VendorCategory, VendorSize } from "@/types";
import VendorForm, { EMPTY_VENDOR_FORM, type VendorFormValues, type VendorDocumentFiles } from "../_components/VendorForm";

export default function NewVendorPage() {
  const router = useRouter();
  const toast = useToast();
  const createVendor = useCreateVendor();
  const uploadLogo = useUploadVendorLogo();
  const uploadDocument = useUploadVendorDocument();

  async function handleSubmit(values: VendorFormValues, logoFile: File | null, documentFiles: VendorDocumentFiles) {
    createVendor.mutate(
      {
        ...values,
        category: values.category as VendorCategory,
        business_size: values.business_size as VendorSize,
      },
      {
        onSuccess: async (vendor) => {
          const uploadErrors: string[] = [];

          // Upload logo
          if (logoFile) {
            try {
              await uploadLogo.mutateAsync({ id: vendor.id, file: logoFile });
            } catch {
              uploadErrors.push("logo");
            }
          }

          // Upload compliance documents
          if (documentFiles.cac) {
            try {
              await uploadDocument.mutateAsync({ id: vendor.id, documentType: "cac", file: documentFiles.cac });
            } catch {
              uploadErrors.push("CAC certificate");
            }
          }
          if (documentFiles.tin) {
            try {
              await uploadDocument.mutateAsync({ id: vendor.id, documentType: "tin", file: documentFiles.tin });
            } catch {
              uploadErrors.push("TIN certificate");
            }
          }
          if (documentFiles.vat) {
            try {
              await uploadDocument.mutateAsync({ id: vendor.id, documentType: "vat", file: documentFiles.vat });
            } catch {
              uploadErrors.push("VAT certificate");
            }
          }

          if (uploadErrors.length > 0) {
            toast.error(`Vendor created but ${uploadErrors.join(", ")} upload failed. You can re-upload from the edit page.`);
          } else {
            toast.success("Vendor added");
          }
          router.push("/admin/vendors");
        },
        onError: (err) => toast.error(getErrorMessage(err, VENDOR_ERRORS)),
      }
    );
  }

  const isLoading = createVendor.isPending || uploadLogo.isPending || uploadDocument.isPending;

  return (
    <VendorForm
      title="Add New Vendor"
      description="Register a new supplier or service provider"
      initial={EMPTY_VENDOR_FORM}
      loading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}

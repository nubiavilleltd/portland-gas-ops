// "use client";

// import { useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";

// import type { CreateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";
// import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
// import ProductForm from "@/lib/modules/products/components/ProductForm";
// import FormSection from "@/components/ui/FormSection";
// import { BackButton } from "@/components/ui/BackButton";
// import { useCreateProduct } from "@/lib/modules/products/hooks/useProductMutations";
// import { ProductImage } from "@/lib/modules/products/types/product.types";

// export default function NewProductPage() {
//   const router = useRouter();

//   const { mutateAsync: createProduct } = useCreateProduct();

// // REPLACE the existing handleSubmit function:
// async function handleSubmit(data: CreateProductFormOutput, images: File[], _keptImages: ProductImage[]) {
//   // Pass File objects directly to the service via a private convention
//   // The service will forward them to productsApi.create()
//   await createProduct({
//     ...data,
//     // Signal to service: here are the real File objects
//     _imageFiles: images,
//   } as any);
// }

//   return (
//     <AppLayout pageTitle="New Product">

//       <BackButton
//         href={PRODUCT_ROUTES.list()}
//         label="Back to Products"
//       />
//       <PageHeader
//         title="New Product"
//         description="Add a product to the catalogue. It will be available for selection when creating orders"
//         className="mb-6"
//       />

//       <FormSection
//         title="Product Information"
//         description="Enter product details and pricing information"
//       >
//         <ProductForm
//           onSubmit={handleSubmit}
//           onCancel={() => router.back()}
//           submitLabel="Create Product"
//           submitLoadingLabel="Creating…"
//         />
//       </FormSection>
//     </AppLayout>
//   );
// }






"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormSection from "@/components/ui/FormSection";
import { BackButton } from "@/components/ui/BackButton";

import ProductForm from "@/lib/modules/products/components/ProductForm";

import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";

import type { ProductImage } from "@/lib/modules/products/types/product.types";
import type { CreateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";

import { useCreateProduct } from "@/lib/modules/products/hooks/useProductMutations";
import { parseError } from "@/lib/errors";

export default function NewProductPage() {
  const router = useRouter();

  const { mutateAsync: createProduct, isPending } =
    useCreateProduct();

  async function handleSubmit(
    data: CreateProductFormOutput,
    images: File[],
    _keptImages: ProductImage[],
  ) {
    try {
      await createProduct({
        ...data,
        _imageFiles: images,
      } as any);

      toast.success("Product created successfully");

      router.push(PRODUCT_ROUTES.list());
    } catch (err) {
      toast.error(parseError(err));
    }
  }

  return (
    <AppLayout pageTitle="New Product">
      <BackButton
        href={PRODUCT_ROUTES.list()}
        label="Back to Products"
      />

      <PageHeader
        title="New Product"
        description="Add a product to the catalogue. It will be available for selection when creating orders"
        className="mb-6"
      />

      <FormSection
        title="Product Information"
        description="Enter product details and pricing information"
      >
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Create Product"
          submitLoadingLabel="Creating…"
          // isSubmitting={isPending}
        />
      </FormSection>
    </AppLayout>
  );
}
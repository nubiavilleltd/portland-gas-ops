// "use client";

// import { useRouter } from "next/navigation";
// import { useForm, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormInput from "@/components/forms/FormInput";
// import FormSelect from "@/components/forms/FormSelect";
// import FormTextarea from "@/components/forms/FormTextarea";
// import ErrorBanner from "@/components/ui/ErrorBanner";

// import {
//     CreateProductFormOutput,
//     createProductSchema,
//     type CreateProductFormInput,
// } from "@/lib/modules/products/schemas/product.schema";
// import type { ProductUnit } from "@/lib/modules/products/types/product.types";
// import { ProductsService } from "@/lib/modules/products/services/products.service";
// import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
// import { parseError } from "@/lib/errors";
// import { useToast } from "@/hooks/useToast";
// import { toast } from "sonner";

// // ── Unit options ───────────────────────────────────────────
// const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
//     { value: "kg", label: "Kilograms (kg)" },
//     { value: "litre", label: "Litres (L)" },
//     { value: "m3", label: "Cubic Metres (m³)" },
//     { value: "unit", label: "Unit / Item" },
//     { value: "tonne", label: "Metric Tonnes (t)" },
// ];

// export default function NewProductPage() {
//     const router = useRouter();

//     const {
//         register,
//         control,
//         handleSubmit,
//         setError,
//         formState: { errors, isSubmitting },
//     } = useForm<CreateProductFormInput, unknown, CreateProductFormOutput>({
//         resolver: zodResolver(createProductSchema),
//         mode: "onTouched",
//         defaultValues: {
//             name: "",
//             unit: "kg",
//             default_unit_price: "0",
//             description: "",
//         },
//     });

//     async function onSubmit(data: CreateProductFormOutput) {
//         try {
//             await ProductsService.createProduct(data);
//             toast.success("Product Created")
//             router.push(PRODUCT_ROUTES.list());
//         } catch (err) {
//             setError("root", { message: parseError(err) });
//         }
//     }

//     return (
//         <AppLayout pageTitle="New Product">
//             <PageHeader
//                 title="New Product"
//                 description="Add a product to the catalogue. It will be available for selection when creating orders."
//                 className="mb-6"
//             />

//             <form
//                 onSubmit={handleSubmit(onSubmit)}
//                 className="space-y-6 max-w-2xl"
//             >
//                 <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-5">
//                     <h2 className="text-base font-semibold">Product Details</h2>

//                     <FormInput
//                         label="Product Name"
//                         required
//                         placeholder="e.g. CNG, LNG, LPG"
//                         hint="This is the name users will see when selecting a product on an order."
//                         error={errors.name?.message}
//                         {...register("name")}
//                     />

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                         <Controller
//                             control={control}
//                             name="unit"
//                             render={({ field }) => (
//                                 <FormSelect
//                                     label="Unit of Measurement"
//                                     required
//                                     options={UNIT_OPTIONS}
//                                     value={field.value}
//                                     onValueChange={(v) => field.onChange(v as ProductUnit)}
//                                     error={errors.unit?.message}
//                                     hint="How quantities of this product are measured."
//                                 />
//                             )}
//                         />

//                         <FormInput
//                             label="Default Unit Price (₦)"
//                             type="text"                          
//                             inputMode="numeric"                  
//                             placeholder="e.g. 1,500,000"
//                             hint="Suggested price per unit. Can be overridden on each order."
//                             error={errors.default_unit_price?.message}
//                             {...register("default_unit_price")} 
//                         />
//                     </div>

//                     <FormTextarea
//                         label="Description"
//                         placeholder="Optional — short description or internal SKU reference"
//                         hint="Not shown to customers. For internal reference only."
//                         error={errors.description?.message}
//                         {...register("description")}
//                     />
//                 </div>

//                 <ErrorBanner message={errors.root?.message} />

//                 <div className="flex justify-end gap-3 pb-10">
//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => router.back()}
//                     >
//                         Cancel
//                     </Button>
//                     <Button
//                         type="submit"
//                         loading={isSubmitting}
//                         loadingText="Creating…"
//                     >
//                         Create Product
//                     </Button>
//                 </div>
//             </form>
//         </AppLayout>
//     );
// }











"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateProductFormOutput } from "@/lib/modules/products/schemas/product.schema";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { parseError } from "@/lib/errors";
import ProductForm from "@/lib/modules/products/components/ProductForm";
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(data: CreateProductFormOutput) {
    // parseError is NOT called here — ProductForm's internal catch
    // sets the root error on the form. This handler only needs to
    // call the service and navigate on success.
    await ProductsService.createProduct(data);
    toast.success("Product Created")
    router.push(PRODUCT_ROUTES.list());
  }

  return (
    <AppLayout pageTitle="New Product">
      <PageHeader
        title="New Product"
        description="Add a product to the catalogue. It will be available for selection when creating orders."
        className="mb-6"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Product Details</h2>

        <ProductForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Create Product"
          submitLoadingLabel="Creating…"
        />
      </div>
    </AppLayout>
  );
}
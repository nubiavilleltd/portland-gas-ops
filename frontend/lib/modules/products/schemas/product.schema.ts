// // // // // // import { z } from "zod";

// // // // // // const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne", "custom"] as const;

// // // // // // export const createProductSchema = z
// // // // // //   .object({
// // // // // //     name: z
// // // // // //       .string()
// // // // // //       .min(1, "Product name is required")
// // // // // //       .min(2, "Name must be at least 2 characters")
// // // // // //       .max(80, "Name cannot exceed 80 characters"),

// // // // // //     unit: z.enum(PRODUCT_UNITS, {
// // // // // //   error: "Select a unit of measurement",
// // // // // // }),

// // // // // //     unit_label: z.string().max(20, "Unit label cannot exceed 20 characters").optional(),

// // // // // //    default_unit_price: z
// // // // // //   .string()
// // // // // //   .min(1, "Enter unit price")
// // // // // //   .refine((val) => Number.isFinite(Number(val)), "Must be a number")
// // // // // //   .transform((val) => Number(val))
// // // // // //   .refine((val) => val > 0, "Price must be greater than 0")
// // // // // //   .refine((val) => val >= 0.01, "Unit price must be at least 0.01")
// // // // // //   .refine((val) => val <= 10_000_000, "Price seems unusually high"),

// // // // // //     description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
// // // // // //   })
// // // // // //   .superRefine((data, ctx) => {
// // // // // //     if (data.unit === "custom" && !data.unit_label?.trim()) {
// // // // // //       ctx.addIssue({
// // // // // //         code: z.ZodIssueCode.custom,
// // // // // //         path: ["unit_label"],
// // // // // //         message: "Please enter a custom unit label",
// // // // // //       });
// // // // // //     }
// // // // // //   });

// // // // // // export type CreateProductFormData = z.infer<typeof createProductSchema>;

// // // // // // export const editProductSchema = createProductSchema.extend({
// // // // // //   status: z.enum(["active", "inactive"]),
// // // // // // });

// // // // // // export type EditProductFormData = z.infer<typeof editProductSchema>;








// // // // // import { z } from "zod";

// // // // // export const PRODUCT_UNITS = [
// // // // //   "kg",
// // // // //   "litre",
// // // // //   "m3",
// // // // //   "unit",
// // // // //   "tonne",
// // // // //   "custom",
// // // // // ] as const;

// // // // // export const createProductSchema = z
// // // // //   .object({
// // // // //     name: z
// // // // //       .string()
// // // // //       .min(1, "Product name is required")
// // // // //       .min(2, "Name must be at least 2 characters")
// // // // //       .max(80, "Name cannot exceed 80 characters"),

// // // // //     unit: z.enum(PRODUCT_UNITS, {
// // // // //       error: "Select a unit of measurement",
// // // // //     }),

// // // // //     unit_label: z
// // // // //       .string()
// // // // //       .max(20, "Unit label cannot exceed 20 characters")
// // // // //       .optional(),

// // // // //     default_unit_price: z
// // // // //       .number({
// // // // //         error: "Enter unit price",
// // // // //       })
// // // // //       .finite("Must be a number")
// // // // //       .positive("Price must be greater than 0")
// // // // //       .min(0.01, "Unit price must be at least 0.01")
// // // // //       .max(10_000_000, "Price seems unusually high"),

// // // // //     description: z
// // // // //       .string()
// // // // //       .max(200, "Description cannot exceed 200 characters")
// // // // //       .optional(),
// // // // //   })
// // // // //   .superRefine((data, ctx) => {
// // // // //     if (data.unit === "custom" && !data.unit_label?.trim()) {
// // // // //       ctx.addIssue({
// // // // //         code: z.ZodIssueCode.custom,
// // // // //         path: ["unit_label"],
// // // // //         message: "Please enter a custom unit label",
// // // // //       });
// // // // //     }
// // // // //   });

// // // // // export type CreateProductFormData = z.infer<
// // // // //   typeof createProductSchema
// // // // // >;

// // // // // export const editProductSchema = createProductSchema.extend({
// // // // //   status: z.enum(["active", "inactive"]),
// // // // // });

// // // // // export type EditProductFormData = z.infer<
// // // // //   typeof editProductSchema
// // // // // >;






// // // // import { z } from "zod";

// // // // export const PRODUCT_UNITS = [
// // // //   "kg",
// // // //   "litre",
// // // //   "m3",
// // // //   "unit",
// // // //   "tonne",
// // // // ] as const;

// // // // export const UOM_OPTIONS = [
// // // //   { value: "kg", label: "Kilogram (kg)" },
// // // //   { value: "litre", label: "Litre" },
// // // //   { value: "m3", label: "Cubic Metre (m³)" },
// // // //   { value: "unit", label: "Unit / Count" },
// // // //   { value: "tonne", label: "Tonne" },
// // // // ] as const;

// // // // export const createProductSchema = z.object({
// // // //   name: z.string().min(1, "Product name is required"),
// // // //   description: z.string().optional(),

// // // //     unit_of_measure: z.enum(PRODUCT_UNITS, {
// // // //       error: "Select a unit of measurement",
// // // //     }),

// // // //   default_unit_price: z
// // // //     .string()
// // // //     .min(1, "Unit price is required")
// // // //     .transform((v) => parseFloat(v))
// // // //     .pipe(z.number().positive("Price must be positive")),
// // // //   status: z.enum(["active", "inactive"]).default("active"),
// // // // });

// // // // export type CreateProductFormValues = z.input<typeof createProductSchema>;
// // // // export type CreateProductParsed = z.output<typeof createProductSchema>;






// // // // // import { z } from "zod";

// // // // // const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne", "custom"] as const;

// // // // // export const createProductSchema = z
// // // // //   .object({
// // // // //     name: z
// // // // //       .string()
// // // // //       .min(1, "Product name is required")
// // // // //       .min(2, "Name must be at least 2 characters")
// // // // //       .max(80, "Name cannot exceed 80 characters"),

// // // // //     unit: z.enum(PRODUCT_UNITS, {
// // // // //   error: "Select a unit of measurement",
// // // // // }),

// // // // //     unit_label: z.string().max(20, "Unit label cannot exceed 20 characters").optional(),

// // // // //    default_unit_price: z
// // // // //   .string()
// // // // //   .min(1, "Enter unit price")
// // // // //   .refine((val) => Number.isFinite(Number(val)), "Must be a number")
// // // // //   .transform((val) => Number(val))
// // // // //   .refine((val) => val > 0, "Price must be greater than 0")
// // // // //   .refine((val) => val >= 0.01, "Unit price must be at least 0.01")
// // // // //   .refine((val) => val <= 10_000_000, "Price seems unusually high"),

// // // // //     description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
// // // // //   })
// // // // //   .superRefine((data, ctx) => {
// // // // //     if (data.unit === "custom" && !data.unit_label?.trim()) {
// // // // //       ctx.addIssue({
// // // // //         code: z.ZodIssueCode.custom,
// // // // //         path: ["unit_label"],
// // // // //         message: "Please enter a custom unit label",
// // // // //       });
// // // // //     }
// // // // //   });

// // // // // export type CreateProductFormData = z.infer<typeof createProductSchema>;

// // // // // export const editProductSchema = createProductSchema.extend({
// // // // //   status: z.enum(["active", "inactive"]),
// // // // // });

// // // // // export type EditProductFormData = z.infer<typeof editProductSchema>;








// // // // import { z } from "zod";

// // // // export const PRODUCT_UNITS = [
// // // //   "kg",
// // // //   "litre",
// // // //   "m3",
// // // //   "unit",
// // // //   "tonne",
// // // //   "custom",
// // // // ] as const;

// // // // export const createProductSchema = z
// // // //   .object({
// // // //     name: z
// // // //       .string()
// // // //       .min(1, "Product name is required")
// // // //       .min(2, "Name must be at least 2 characters")
// // // //       .max(80, "Name cannot exceed 80 characters"),

// // // //     unit: z.enum(PRODUCT_UNITS, {
// // // //       error: "Select a unit of measurement",
// // // //     }),

// // // //     unit_label: z
// // // //       .string()
// // // //       .max(20, "Unit label cannot exceed 20 characters")
// // // //       .optional(),

// // // //     default_unit_price: z
// // // //       .number({
// // // //         error: "Enter unit price",
// // // //       })
// // // //       .finite("Must be a number")
// // // //       .positive("Price must be greater than 0")
// // // //       .min(0.01, "Unit price must be at least 0.01")
// // // //       .max(10_000_000, "Price seems unusually high"),

// // // //     description: z
// // // //       .string()
// // // //       .max(200, "Description cannot exceed 200 characters")
// // // //       .optional(),
// // // //   })
// // // //   .superRefine((data, ctx) => {
// // // //     if (data.unit === "custom" && !data.unit_label?.trim()) {
// // // //       ctx.addIssue({
// // // //         code: z.ZodIssueCode.custom,
// // // //         path: ["unit_label"],
// // // //         message: "Please enter a custom unit label",
// // // //       });
// // // //     }
// // // //   });

// // // // export type CreateProductFormData = z.infer<
// // // //   typeof createProductSchema
// // // // >;

// // // // export const editProductSchema = createProductSchema.extend({
// // // //   status: z.enum(["active", "inactive"]),
// // // // });

// // // // export type EditProductFormData = z.infer<
// // // //   typeof editProductSchema
// // // // >;






// // // // import { z } from "zod";

// // // // export const PRODUCT_UNITS = [
// // // //   "kg",
// // // //   "litre",
// // // //   "m3",
// // // //   "unit",
// // // //   "tonne",
// // // // ] as const;

// // // // export const UOM_OPTIONS = [
// // // //   { value: "kg", label: "Kilogram (kg)" },
// // // //   { value: "litre", label: "Litre" },
// // // //   { value: "m3", label: "Cubic Metre (m³)" },
// // // //   { value: "unit", label: "Unit / Count" },
// // // //   { value: "tonne", label: "Tonne" },
// // // // ] as const;

// // // // export const createProductSchema = z.object({
// // // //   name: z.string().min(1),

// // // //   description: z.string().optional(),

// // // //   unit_of_measure: z.enum(PRODUCT_UNITS, {
// // // //     message: "Select a unit",
// // // //   }),

// // // //   default_unit_price: z
// // // //     .string()
// // // //     .min(1, "Unit price is required")
// // // //     .refine((v) => !isNaN(Number(v)), "Must be a number")
// // // //     .refine((v) => Number(v) > 0, "Must be positive"),

// // // //   status: z.enum(["active", "inactive"]).default("active"),
// // // // });

// // // // export type CreateProductFormValues = z.infer<typeof createProductSchema>;
// // // // export type CreateProductParsed = z.output<typeof createProductSchema>;








// // // import { z } from "zod";

// // // export const UOM_OPTIONS = [
// // //   { value: "kg", label: "Kilogram (kg)" },
// // //   { value: "litre", label: "Litre" },
// // //   { value: "m3", label: "Cubic Metre (m³)" },
// // //   { value: "unit", label: "Unit / Count" },
// // //   { value: "tonne", label: "Tonne" },
// // // ] as const;

// // // export const createProductSchema = z.object({
// // //   name: z.string().min(1, "Product name is required"),
// // //   description: z.string().optional(),
// // //   unit_of_measure: z.enum(["kg", "litre", "m3", "unit", "tonne"], {
// // //     message: "Select a unit of measure",
// // //   }),
// // //   default_unit_price: z
// // //     .string()
// // //     .min(1, "Unit price is required")
// // //     .transform((v) => parseFloat(v))
// // //     .pipe(z.number().positive("Price must be positive")),
// // //   status: z.enum(["active", "inactive"]).default("active"),
// // // });

// // // export type CreateProductFormValues = z.input<typeof createProductSchema>;
// // // export type CreateProductParsed = z.output<typeof createProductSchema>;






// // import { z } from "zod";

// // const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne", "custom"] as const;

// // export const createProductSchema = z
// //   .object({
// //     name: z
// //       .string()
// //       .min(1, "Product name is required")
// //       .min(2, "Name must be at least 2 characters")
// //       .max(80, "Name cannot exceed 80 characters"),

// //     unit: z.enum(PRODUCT_UNITS, {
// //       message: "Select a unit of measurement",
// //     }),

// //     unit_label: z
// //       .string()
// //       .max(20, "Unit label cannot exceed 20 characters")
// //       .optional(),

// //     // default_unit_price: z
// //     //   .number({ invalid_type_error: "Enter a valid price" })
// //     //   .min(0.01, "Price must be greater than 0")
// //     //   .max(10_000_000, "Price seems unusually high"),

// //       default_unit_price: z
// //     .string()
// //     .min(1, "Unit price is required")
// //     .transform((v) => parseFloat(v))
// //     .pipe(z.number().positive("Price must be positive")),
// //   status: z.enum(["active", "inactive"]).default("active"),

// //     description: z
// //       .string()
// //       .max(200, "Description cannot exceed 200 characters")
// //       .optional(),
// //   })
// //   .superRefine((data, ctx) => {
// //     if (data.unit === "custom" && !data.unit_label?.trim()) {
// //       ctx.addIssue({
// //         code: z.ZodIssueCode.custom,
// //         path: ["unit_label"],
// //         message: "Please enter a custom unit label",
// //       });
// //     }
// //   });

// // // export type CreateProductFormData = z.infer<typeof createProductSchema>;

// // export const editProductSchema = createProductSchema.extend({
// //   status: z.enum(["active", "inactive"]),
// // });

// // export type EditProductFormData = z.infer<typeof editProductSchema>;



// // export type CreateProductInput = z.input<typeof createProductSchema>;
// // export type CreateProductOutput = z.output<typeof createProductSchema>;








// import { z } from "zod";

// const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne"] as const;

// export const createProductSchema = z.object({
//   name: z.string().min(1, "Product name is required"),

//   unit: z.enum(PRODUCT_UNITS, {
//     message: "Select a unit of measurement",
//   }),

//   unit_label: z.string().max(20, "Max 20 characters").optional(),

//   // UI gives string → we transform to number for API
//   default_unit_price: z
//     .string()
//     .min(1, "Unit price is required")
//     .transform((v) => Number(v))
//     .pipe(z.number().positive("Price must be positive")),

//   status: z.enum(["active", "inactive"]).default("active"),

//   description: z.string().optional(),
// });

// // ✅ IMPORTANT: correct split
// export type CreateProductFormInput = z.input<typeof createProductSchema>;
// export type CreateProductParsed = z.output<typeof createProductSchema>;









import { z } from "zod";

export const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne", "custom"] as const;
export const PRODUCT_STATUS = ["active", "inactive"] as const;

/**
 * FORM INPUT (what RHF uses)
 * EVERYTHING is string here
 */
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),

  unit: z.enum(PRODUCT_UNITS, {
    message: "Select a unit of measurement",
  }),

  unit_label: z.string().max(20).optional(),

  default_unit_price: z
    .string()
    .min(1, "Unit price is required")
    .transform((v) => Number(v))
    .pipe(z.number().positive("Price must be positive")),

  status: z.enum(PRODUCT_STATUS).default("active"),

  description: z.string().optional(),
});

/**
 * TYPES
 */
export type CreateProductFormInput = z.input<typeof createProductSchema>;
export type CreateProductFormData = z.output<typeof createProductSchema>;
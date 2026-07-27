import { z } from "zod";

const CUSTOMER_TYPES = ["corporate", "individual"] as const;

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  type: z.enum(CUSTOMER_TYPES, {
    message: "Select a customer type",
  }),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number too long")
    .regex(/^[+\d\s\-()\\.]+$/, "Enter a valid phone number"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),

  address: z
    .string()
    .min(1, "Address is required")
    .min(5, "Enter a complete address")
    .max(200, "Address too long"),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
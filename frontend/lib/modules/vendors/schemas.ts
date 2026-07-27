import { z } from "zod";

export const vendorSchema = z.object({
  name:           z.string().min(2, "Name is required"),
  category:       z.string().min(1, "Category is required"),
  contact_person: z.string().optional(),
  phone:          z.string().optional(),
  email:          z.string().email("Invalid email").optional().or(z.literal("")),
  address:        z.string().optional(),
  bank_name:      z.string().optional(),
  account_name:   z.string().optional(),
  account_number: z.string().optional(),
  vendor_code:    z.string().optional(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;

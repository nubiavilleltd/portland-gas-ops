import { z } from "zod";

export const createDriverSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name too long"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),

  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number too long")
    .regex(/^[+\d\s\-()\\.]+$/, "Enter a valid phone number"),

  license_number: z
    .string()
    .min(3, "License number is required")
    .max(30, "License number too long"),

  experience_years: z
    .number({ message: "Enter years of experience" })
    .min(0, "Experience cannot be negative")
    .max(50, "Please enter a realistic number of years"),



  /**
   * File is validated outside zod (size, type checked in the upload handler).
   * Using z.any() so react-hook-form can store the File object without
   * zod attempting to parse it.
   */
  profile_picture: z.any().optional().nullable(),
});

export type CreateDriverFormData = z.infer<typeof createDriverSchema>;

export const editDriverSchema = createDriverSchema.extend({
  status: z.enum([
    "available",
    "assigned",
    "in_transit",
    "off_duty",
    "suspended",
  ]),
});

export type EditDriverFormData = z.infer<typeof editDriverSchema>;
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
import { post } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      const res = await post<{ user_id: string }>("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      router.push(`/verify-otp?user_id=${res.user_id}`);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 429) {
        setApiError("Too many attempts. Please wait a minute and try again.");
      } else {
        setApiError(error?.response?.data?.detail ?? "Registration failed. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-purple flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold tracking-tight">PG</span>
          </div>
          <h1 className="text-lg font-semibold text-brand-text-primary">Portland Gas</h1>
          <p className="text-sm text-brand-purple">Operations Platform</p>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Create account</h2>
          <p className="text-sm text-brand-text-secondary mb-6">
            Fill in your details to request access
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput label="Full name" placeholder="Chukwuemeka Obi" required error={errors.name?.message} {...register("name")} />
            <FormInput label="Email address" type="email" placeholder="you@portlandgas.com" required autoComplete="email" error={errors.email?.message} {...register("email")} />
            <FormInput label="Password" type="password" placeholder="At least 8 characters" required autoComplete="new-password" error={errors.password?.message} {...register("password")} />
            <FormInput label="Confirm password" type="password" placeholder="Repeat your password" required autoComplete="new-password" error={errors.confirm_password?.message} {...register("confirm_password")} />

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 mt-2">
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text-secondary mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-purple font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

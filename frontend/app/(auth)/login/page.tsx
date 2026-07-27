"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
import AuthBrand from "@/components/auth/AuthBrand";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember_me: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const justVerified = params.get("verified") === "1";
  const { login } = useAuth();
  const toast = useToast();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await login(data.email, data.password, data.remember_me ?? false);
      toast.success("Welcome back!");
      router.replace(params.get("next") ?? "/");
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 403) {
        setApiError(error.response.data?.detail ?? "Your account is not yet active. Check your email for the account setup link.");
      } else if (error?.response?.status === 429) {
        setApiError("Too many attempts. Please wait a minute and try again.");
      } else if (error?.response?.status === 401) {
        setApiError("Invalid email or password. Please try again.");
      } else {
        setApiError("Something went wrong. Please try again or contact IT support.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthBrand />

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Sign in</h2>
          <p className="text-sm text-brand-text-secondary mb-6">Enter your credentials to continue</p>

          {justVerified && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
              Your email has been verified. You can now sign in.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput label="Email address" type="email" placeholder="you@portlandgas.com" required autoComplete="email" error={errors.email?.message} {...register("email")} />
            <FormInput label="Password" type="password" placeholder="••••••••" required autoComplete="current-password" error={errors.password?.message} {...register("password")} />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="h-4 w-4 rounded border-brand-border" {...register("remember_me")} />
                <span className="text-sm text-brand-text-secondary">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-brand-purple hover:underline">Forgot password?</Link>
            </div>

            {apiError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 mt-2">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-brand-text-secondary mt-6">
          Portland Gas Limited &mdash; Internal Platform
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

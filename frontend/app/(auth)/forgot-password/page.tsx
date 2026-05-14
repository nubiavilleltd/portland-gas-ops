"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
import AuthBrand from "@/components/auth/AuthBrand";
import { post } from "@/lib/api";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    // Backend always returns the same message — never leaks whether email exists
    try { await post("/api/auth/forgot-password", { email: data.email }); } catch { /* swallow */ }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthBrand />

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Reset password</h2>
          <p className="text-sm text-brand-text-secondary mb-6">Enter your email and we&apos;ll send you a reset link.</p>

          {isSubmitSuccessful ? (
            <div className="text-center py-2">
              <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-brand-text-primary mb-1">Check your inbox</p>
              <p className="text-sm text-brand-text-secondary">
                If that email is registered you will receive a reset link shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormInput label="Email address" type="email" placeholder="you@portlandgas.com" required error={errors.email?.message} {...register("email")} />
              <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <Link href="/login" className="block text-center text-sm text-brand-purple mt-5 hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

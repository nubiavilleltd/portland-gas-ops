"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
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
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-brand-purple flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">PG</span>
          </div>
          <h1 className="text-lg font-semibold text-brand-text-primary">Portland Gas</h1>
          <p className="text-sm text-brand-purple">Operations Platform</p>
        </div>

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Reset password</h2>
          <p className="text-sm text-brand-text-secondary mb-6">Enter your email and we&apos;ll send you a reset link.</p>

          {isSubmitSuccessful ? (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              If that email is registered you will receive a reset link shortly. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormInput label="Email address" type="email" required error={errors.email?.message} {...register("email")} />
              <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <Link href="/login" className="block text-center text-sm text-brand-purple mt-4 hover:underline">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}

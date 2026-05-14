"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
import { post } from "@/lib/api";

const schema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("user_id") ?? "";
  const code = params.get("code") ?? "";
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setApiError(null);
    try {
      await post("/api/auth/reset-password", { user_id: userId, code, new_password: data.new_password });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setApiError(error?.response?.data?.detail ?? "Reset failed. The link may have expired.");
    }
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
          {isSubmitSuccessful ? (
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3 text-xl">✓</div>
              <h2 className="text-base font-semibold text-brand-text-primary">Password reset</h2>
              <p className="text-sm text-brand-text-secondary mt-2 mb-4">Your password has been updated. You can now sign in.</p>
              <Link href="/login" className="inline-block px-5 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors">
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-brand-text-primary mb-1">Choose a new password</h2>
              <p className="text-sm text-brand-text-secondary mb-6">Must be at least 8 characters.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormInput label="New password" type="password" required autoComplete="new-password" error={errors.new_password?.message} {...register("new_password")} />
                <FormInput label="Confirm new password" type="password" required autoComplete="new-password" error={errors.confirm_password?.message} {...register("confirm_password")} />
                {apiError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{apiError}</p>}
                <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
                  {isSubmitting ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

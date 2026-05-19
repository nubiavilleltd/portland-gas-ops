"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FormInput from "@/components/forms/FormInput";
import AuthBrand from "@/components/auth/AuthBrand";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import { post } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { passwordSchema } from "@/lib/validations";

const schema = z.object({
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordContent() {
  const params = useSearchParams();
  const userId = params.get("user_id") ?? "";
  const code = params.get("code") ?? "";
  const toast = useToast();
  const [showChecklist, setShowChecklist] = useState(false);

  const { register, control, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const passwordValue = useWatch({ control, name: "new_password", defaultValue: "" });

  async function onSubmit(data: FormData) {
    try {
      await post("/api/auth/reset-password", { user_id: userId, code, new_password: data.new_password });
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 429) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else {
        toast.error(error?.response?.data?.detail ?? "Reset failed. The link may have expired.");
      }
    }
  }

  if (isSubmitSuccessful) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <AuthBrand />
          <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-brand-text-primary mb-2">Password reset</h2>
            <p className="text-sm text-brand-text-secondary mb-6">Your password has been updated. You can now sign in with your new password.</p>
            <Link href="/login" className="inline-block px-6 py-2.5 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthBrand />

        <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Choose a new password</h2>
          <p className="text-sm text-brand-text-secondary mb-6">Must be at least 8 characters.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="flex flex-col gap-1">
              <FormInput
                label="New password"
                type="password"
                required
                autoComplete="new-password"
                error={errors.new_password?.message}
                {...register("new_password")}
                onFocus={() => setShowChecklist(true)}
                onBlur={() => setShowChecklist(false)}
              />
              <PasswordChecklist password={passwordValue} visible={showChecklist} />
            </div>
            <FormInput label="Confirm new password" type="password" required autoComplete="new-password" error={errors.confirm_password?.message} {...register("confirm_password")} />
            <button type="submit" disabled={isSubmitting} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
              {isSubmitting ? "Resetting…" : "Reset password"}
            </button>
          </form>

          <Link href="/login" className="block text-center text-sm text-brand-purple mt-5 hover:underline">Back to sign in</Link>
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

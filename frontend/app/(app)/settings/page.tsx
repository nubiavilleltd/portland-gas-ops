"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import FormInput from "@/components/forms/FormInput";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import { post } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { passwordSchema } from "@/lib/validations";

const schema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
}).refine((d) => d.current_password !== d.new_password, {
  message: "New password must be different from current password",
  path: ["new_password"],
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const toast = useToast();
  const { logout } = useAuth();

  const [showChecklist, setShowChecklist] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const passwordValue = watch("new_password", "");

  async function onSubmit(data: FormData) {
    try {
      await post("/api/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password changed. Please sign in again.");
      reset();
      // Backend revokes all refresh tokens — force re-login
      setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 429) {
        toast.error("Too many attempts. Please wait a minute and try again.");
      } else if (error?.response?.status === 400) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error(error?.response?.data?.detail ?? "Failed to change password. Try again.");
      }
    }
  }

  return (
    <AppLayout pageTitle="Settings">
      <div className="max-w-lg">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-1">Settings</h2>
        <p className="text-sm text-brand-text-secondary mb-8">Manage your account preferences.</p>

        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-brand-text-primary mb-1">Change password</h3>
          <p className="text-sm text-brand-text-secondary mb-5">
            After changing your password you will be signed out of all devices.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput
              label="Current password"
              type="password"
              required
              autoComplete="current-password"
              error={errors.current_password?.message}
              {...register("current_password")}
            />
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
            <FormInput
              label="Confirm new password"
              type="password"
              required
              autoComplete="new-password"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

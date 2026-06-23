"use client";

import { useState } from "react";
import { Lock, ChevronDown, ChevronRight } from "lucide-react";
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

// ── Change Password Form ───────────────────────────────────────────────────────

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

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { logout } = useAuth();
  const [showChecklist, setShowChecklist] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const passwordValue = watch("new_password", "");

  async function onSubmit(data: FormData) {
    try {
      await post("/api/auth/change-password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Password changed. Signing you out…");
      reset();
      setTimeout(() => logout(), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error?.response?.status === 429) {
        toast.error("Too many attempts. Please wait a minute.");
      } else if (error?.response?.status === 400) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error(error?.response?.data?.detail ?? "Failed to change password.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-5 border-t border-brand-border mt-5" noValidate>
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
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 px-6 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Update password"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────────

function SettingRow({
  icon: Icon,
  title,
  description,
  expanded,
  onToggle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-brand-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="h-9 w-9 rounded-xl bg-brand-purple/10 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-brand-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-text-primary">{title}</p>
          <p className="text-xs text-brand-text-secondary mt-0.5">{description}</p>
        </div>
        {children
          ? <ChevronDown size={16} className={`text-brand-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`} />
          : <ChevronRight size={16} className="text-brand-text-secondary" />
        }
      </button>
      {children && expanded && (
        <div className="px-6 pb-6 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  return (
    <AppLayout pageTitle="Settings">
      <div className="max-w-xl">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-1">Settings</h2>
        <p className="text-sm text-brand-text-secondary mb-6">Manage your account preferences.</p>

        <div className="space-y-3">
          <SettingRow
            icon={Lock}
            title="Change Password"
            description="Update your password. You will be signed out of all devices."
            expanded={openSection === "password"}
            onToggle={() => toggle("password")}
          >
            <ChangePasswordForm onClose={() => setOpenSection(null)} />
          </SettingRow>
        </div>
      </div>
    </AppLayout>
  );
}

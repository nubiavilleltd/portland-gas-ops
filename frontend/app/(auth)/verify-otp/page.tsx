"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { post } from "@/lib/api";

function VerifyOTPContent() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("user_id") ?? "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer after resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputs.current[Math.min(digits.length, 5)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the full 6-digit code"); return; }
    setError(null);
    setLoading(true);
    try {
      await post("/api/auth/verify-otp", { user_id: userId, code });
      router.push("/login?verified=1");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error?.response?.data?.detail ?? "Invalid or expired code. Try again.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !userId) return;
    setResending(true);
    setResendSuccess(false);
    setError(null);
    try {
      await post("/api/auth/resend-otp", { user_id: userId });
      setResendSuccess(true);
      setCountdown(60);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error?.response?.data?.detail ?? "Could not resend code. Try again.");
    } finally {
      setResending(false);
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
          <h2 className="text-base font-semibold text-brand-text-primary mb-1">Verify your email</h2>
          <p className="text-sm text-brand-text-secondary mb-6">
            We sent a 6-digit code to your email address. Enter it below to activate your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP input boxes */}
            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-12 text-center text-xl font-bold border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow text-brand-text-primary"
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            {resendSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                A new code has been sent to your email.
              </p>
            )}

            <button type="submit" disabled={loading} className="w-full h-10 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60">
              {loading ? "Verifying…" : "Verify email"}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-sm text-brand-text-secondary">
              Didn&apos;t receive a code?{" "}
              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-brand-purple font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Sending…" : countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense>
      <VerifyOTPContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, KeyRound, Mail, ShieldCheck, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  confirmPasswordReset,
  requestPasswordOtp,
  verifyPasswordOtp,
} from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "password" | "done";

interface EmailForm {
  email: string;
}

interface OtpForm {
  code: string;
}

interface PasswordForm {
  new_password: string;
  confirm_password: string;
}

const steps: { id: Step; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "otp", label: "Verify" },
  { id: "password", label: "New password" },
  { id: "done", label: "Done" },
];

export function PasswordResetFlow({
  mode = "modal",
  open = true,
  onClose,
  defaultEmail = "",
  lockEmail = false,
  title = "Reset password",
  subtitle = "Verify your email, then set a new password.",
}: {
  mode?: "modal" | "panel";
  open?: boolean;
  onClose?: () => void;
  defaultEmail?: string;
  lockEmail?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(defaultEmail);
  const [resetToken, setResetToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailForm>({
    defaultValues: { email: defaultEmail },
  });
  const otpForm = useForm<OtpForm>();
  const passwordForm = useForm<PasswordForm>();

  useEffect(() => {
    if (open) {
      setStep("email");
      setResetToken("");
      setDebugOtp(null);
      setError("");
      emailForm.reset({ email: defaultEmail });
      otpForm.reset();
      passwordForm.reset();
    }
  }, [open, defaultEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const stepIndex = steps.findIndex((s) => s.id === step);

  const onRequestOtp = async (data: EmailForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await requestPasswordOtp(data.email);
      setEmail(data.email);
      setDebugOtp(res.data.debug_otp ?? null);
      setStep("otp");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await verifyPasswordOtp(email, data.code);
      setResetToken(res.data.reset_token);
      setStep("password");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onConfirmPassword = async (data: PasswordForm) => {
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset({
        email,
        reset_token: resetToken,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      setStep("done");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={cn(mode === "modal" ? "p-6 sm:p-8" : "p-0")}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0b6e4f]">
            Secure reset
          </p>
          <h2 className="font-display mt-1 text-2xl text-[#14201a]">{title}</h2>
          <p className="mt-1 text-sm text-[#5c6b63]">{subtitle}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#5c6b63] hover:bg-[#ecf1ed]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i <= stepIndex
                  ? "bg-[#0b6e4f] text-white"
                  : "bg-[#ecf1ed] text-[#5c6b63]",
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                i <= stepIndex ? "text-[#14201a]" : "text-[#5c6b63]",
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  i < stepIndex ? "bg-[#0b6e4f]" : "bg-[#d8e0d9]",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={emailForm.handleSubmit(onRequestOtp)}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[#d8e0d9] bg-[#f8faf8] p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-[#0b6e4f]" />
                <p className="text-sm text-[#5c6b63]">
                  We&apos;ll send a 6-digit code to verify it&apos;s really you
                  before allowing a password change.
                </p>
              </div>
            </div>
            <Input
              label="Email address"
              type="email"
              disabled={lockEmail}
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register("email", { required: "Email is required" })}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Send verification code
            </Button>
          </motion.form>
        )}

        {step === "otp" && (
          <motion.form
            key="otp"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={otpForm.handleSubmit(onVerifyOtp)}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[#d8e0d9] bg-[#f8faf8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#0b6e4f]" />
                <div>
                  <p className="text-sm text-[#5c6b63]">
                    Enter the code sent to <strong>{email}</strong>.
                  </p>
                  {debugOtp && (
                    <p className="mt-2 rounded-lg bg-[#e6f4ee] px-3 py-2 text-sm font-semibold text-[#085340]">
                      Dev OTP: {debugOtp}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Input
              label="6-digit code"
              placeholder="000000"
              maxLength={6}
              error={otpForm.formState.errors.code?.message}
              {...otpForm.register("code", {
                required: "Code is required",
                minLength: { value: 6, message: "Enter 6 digits" },
              })}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep("email")}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" loading={loading}>
                Verify email
              </Button>
            </div>
          </motion.form>
        )}

        {step === "password" && (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={passwordForm.handleSubmit(onConfirmPassword)}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-emerald-700" />
                <p className="text-sm text-emerald-800">
                  Email verified. Choose a strong new password for your account.
                </p>
              </div>
            </div>
            <Input
              label="New password"
              type="password"
              error={passwordForm.formState.errors.new_password?.message}
              {...passwordForm.register("new_password", {
                required: "Required",
                minLength: { value: 8, message: "Min 8 characters" },
              })}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={passwordForm.formState.errors.confirm_password?.message}
              {...passwordForm.register("confirm_password", {
                required: "Required",
                validate: (v) =>
                  v === passwordForm.watch("new_password") ||
                  "Passwords do not match",
              })}
            />
            <Button type="submit" className="w-full" loading={loading}>
              Update password
            </Button>
          </motion.form>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f4ee] text-[#0b6e4f]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="font-display text-xl text-[#14201a]">Password updated</p>
              <p className="mt-1 text-sm text-[#5c6b63]">
                You can now sign in with your new password.
              </p>
            </div>
            {onClose && (
              <Button type="button" className="w-full" onClick={onClose}>
                Continue
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (mode === "panel") {
    return (
      <div className="rounded-3xl border border-[#d8e0d9] bg-white p-6 shadow-sm sm:p-8">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#14201a]/45 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {content}
      </motion.div>
    </div>
  );
}

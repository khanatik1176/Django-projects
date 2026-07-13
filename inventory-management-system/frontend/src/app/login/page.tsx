"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { PasswordResetFlow } from "@/components/auth/PasswordResetFlow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/PageHeader";
import { getErrorMessage } from "@/lib/api/client";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>();

  const emailValue = watch("email");

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden mesh-bg lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f17] via-transparent to-[#0a1f17]/40" />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <p className="font-display text-5xl">Bhandar</p>
          <p className="mt-3 max-w-sm text-white/70">
            Your warehouse truth, synced across every branch in Bangladesh.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#f4f6f3] px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b6e4f] text-xs font-bold text-white">
              ভ
            </span>
            <span className="font-display text-xl text-[#14201a]">Bhandar</span>
          </Link>

          <h1 className="font-display text-3xl text-[#14201a]">Welcome back</h1>
          <p className="mt-2 text-sm text-[#5c6b63]">
            Sign in to manage stock, orders, and warehouses.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-4 rounded-2xl border border-[#d8e0d9] bg-white p-6 shadow-sm"
          >
            {error && <Alert message={error} />}

            <Input
              label="Email"
              type="email"
              placeholder="you@company.bd"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#14201a]">Password</label>
                <button
                  type="button"
                  onClick={() => setResetOpen(true)}
                  className="text-xs font-semibold text-[#0b6e4f] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", { required: "Password is required" })}
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5c6b63]">
            New here?{" "}
            <Link href="/register" className="font-semibold text-[#0b6e4f] hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      <PasswordResetFlow
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        defaultEmail={emailValue || ""}
        title="Forgot password"
        subtitle="Verify your email with a code, then create a new password."
      />
    </div>
  );
}

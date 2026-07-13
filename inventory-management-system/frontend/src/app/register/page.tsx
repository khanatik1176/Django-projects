"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { motion } from "framer-motion";
import { register as registerApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/PageHeader";
import { getErrorMessage } from "@/lib/api/client";

interface RegisterForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await registerApi(data);
      setSuccess("Registration submitted! An admin will approve your account before you can sign in.");
      setTimeout(() => router.push("/login"), 2400);
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f3] px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0b6e4f] text-xs font-bold text-white">
            ভ
          </span>
          <span className="font-display text-xl text-[#14201a]">Bhandar</span>
        </Link>

        <h1 className="font-display text-3xl text-[#14201a]">Create account</h1>
        <p className="mt-2 text-sm text-[#5c6b63]">
          Set up Bhandar for your store, depot, or distribution business.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-4 rounded-2xl border border-[#d8e0d9] bg-white p-6 shadow-sm"
        >
          {error && <Alert message={error} />}
          {success && <Alert type="success" message={success} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              error={errors.first_name?.message}
              {...register("first_name", { required: "Required" })}
            />
            <Input
              label="Last name"
              error={errors.last_name?.message}
              {...register("last_name", { required: "Required" })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email", { required: "Email is required" })}
          />

          <Input
            label="Phone"
            placeholder="01XXXXXXXXX"
            {...register("phone")}
          />

          <PasswordInput
            label="Password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Min 8 characters" },
            })}
          />

          <PasswordInput
            label="Confirm password"
            error={errors.confirm_password?.message}
            {...register("confirm_password", {
              required: "Please confirm password",
              validate: (v) => v === watch("password") || "Passwords do not match",
            })}
          />

          <Button type="submit" className="w-full" loading={loading}>
            Sign up
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#5c6b63]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0b6e4f] hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

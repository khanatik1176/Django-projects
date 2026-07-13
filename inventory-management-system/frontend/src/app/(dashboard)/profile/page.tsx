"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Camera,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { getCurrentUser, updateProfile } from "@/lib/api/auth";
import { useAuth } from "@/providers/AuthProvider";
import { PasswordResetFlow } from "@/components/auth/PasswordResetFlow";
import { PageHeader, LoadingState, Alert } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api/client";
import { mediaUrl } from "@/lib/utils";
import type { User } from "@/lib/types";

interface ProfileForm {
  first_name: string;
  last_name: string;
  phone?: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showPasswordFlow, setShowPasswordFlow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>();

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        const u = res.data.user;
        setProfile(u);
        updateUser(u);
        reset({
          first_name: u.first_name,
          last_name: u.last_name,
          phone: u.phone ?? "",
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [reset, updateUser]);

  const onSaveProfile = async (data: ProfileForm) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const form = new FormData();
      form.append("first_name", data.first_name);
      form.append("last_name", data.last_name);
      if (data.phone) form.append("phone", data.phone);
      if (file) form.append("profile_picture", file);

      const res = await updateProfile(form);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setFile(null);
      setPreview(null);
      setSuccess("Profile saved.");
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  const avatar = preview || mediaUrl(profile?.profile_picture) || null;
  const initials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() ||
    "U";

  const cancelEditing = () => {
    reset({
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      phone: profile?.phone ?? "",
    });
    setFile(null);
    setPreview(null);
    setError("");
    setSuccess("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Your workspace identity"
        description="A living profile for the person running Bhandar day to day"
      />

      {/* Hero identity band */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#d8e0d9] bg-[#0a1f17] text-white"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(11,110,79,0.55), transparent 40%), radial-gradient(circle at 85% 10%, rgba(196,92,38,0.28), transparent 35%), linear-gradient(135deg, #0a1f17, #123528)",
          }}
        />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <div className="relative mx-auto lg:mx-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                className="h-28 w-28 rounded-[2rem] object-cover ring-4 ring-white/15"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#0b6e4f] text-3xl font-bold ring-4 ring-white/15">
                {initials}
              </div>
            )}
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#0b6e4f] shadow-lg">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    setFile(next);
                    setPreview(next ? URL.createObjectURL(next) : null);
                  }}
                />
              </label>
            )}
          </div>

          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Active operator
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/70 lg:justify-start">
              <Mail className="h-4 w-4" />
              {profile?.email}
            </p>
            {profile?.phone && (
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-white/70 lg:justify-start">
                <Phone className="h-4 w-4" />
                {profile.phone}
              </p>
            )}
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b6e4f] text-white shadow-inner">
                <Shield className="h-5 w-5" />
              </span>
              <div className="pr-1 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  Role
                </p>
                <p className="text-sm font-semibold text-white">
                  {user?.role_name ?? "Team Member"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-[#d8e0d9] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#e6f4ee] p-2.5 text-[#0b6e4f]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl text-[#14201a]">
                  Profile details
                </h3>
                <p className="text-sm text-[#5c6b63]">
                  Keep your contact identity accurate for audit trails.
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSuccess("");
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            {error && <Alert message={error} />}
            {success && <Alert type="success" message={success} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                disabled={!isEditing}
                className={!isEditing ? "bg-[#f4f6f3]" : undefined}
                error={errors.first_name?.message}
                {...register("first_name", { required: "Required" })}
              />
              <Input
                label="Last name"
                disabled={!isEditing}
                className={!isEditing ? "bg-[#f4f6f3]" : undefined}
                error={errors.last_name?.message}
                {...register("last_name", { required: "Required" })}
              />
            </div>

            <Input
              label="Email"
              value={profile?.email ?? ""}
              disabled
              className="bg-[#f4f6f3]"
            />

            <Input
              label="Phone"
              placeholder="01XXXXXXXXX"
              disabled={!isEditing}
              className={!isEditing ? "bg-[#f4f6f3]" : undefined}
              {...register("phone")}
            />

            {isEditing && file && (
              <p className="text-xs text-[#0b6e4f]">
                New photo selected — save to apply.
              </p>
            )}

            {isEditing && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" loading={saving}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <div className="overflow-hidden rounded-3xl border border-[#d8e0d9] bg-gradient-to-br from-[#e6f4ee] via-white to-[#fff7f1] p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-[#0b6e4f] p-2.5 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl text-[#14201a]">
                  Password
                </h3>
                <p className="text-sm text-[#5c6b63]">
                  Update your password securely with email verification.
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => setShowPasswordFlow(true)}
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
          </div>
        </motion.section>
      </div>

      <PasswordResetFlow
        mode="modal"
        open={showPasswordFlow}
        onClose={() => setShowPasswordFlow(false)}
        defaultEmail={profile?.email ?? ""}
        lockEmail
        title="Change password"
        subtitle="Verify your email with a code, then set a new password."
      />
    </div>
  );
}

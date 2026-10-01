"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  BadgeCheck,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile Edit State
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      api.users
        .getMe()
        .then((data) => {
          setProfile(data);
          setName(data.name || "");
          setMobile(data.mobile || "");
        })
        .catch((err) => {
          console.error("Failed to load user profile:", err);
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    }
  }, [isAuthenticated, isLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);

    try {
      const updated = await api.users.updateProfile({
        name: name.trim(),
        mobile: mobile.trim() || null,
      });
      setProfile(updated);
      setProfileMsg({ type: "success", text: "Profile details updated successfully." });
    } catch (err: unknown) {
      setProfileMsg({
        type: "error",
        text: (err as Error).message || "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    setPasswordSaving(true);

    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: "success", text: res.message || "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordMsg({
        type: "error",
        text: (err as Error).message || "Failed to update password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 font-mono">Loading profile data...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_verification: "bg-amber-50 text-amber-700 border-amber-200",
    suspended: "bg-rose-50 text-rose-700 border-rose-200",
    disabled: "bg-slate-100 text-slate-600 border-slate-300",
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account & Identity Settings
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-mono uppercase tracking-wider">
            Manage Credentials, Verification Badges & Profile Attributes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Summary Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                  {profile?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {profile?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 capitalize">
                    Role: {profile?.role}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Account Status</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border mt-1 capitalize ${
                      statusColors[profile?.accountStatus || "active"]
                    }`}
                  >
                    {profile?.accountStatus?.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Verification</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    {profile?.emailVerifiedAt ? (
                      <>
                        <BadgeCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700 font-medium text-[11px]">Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-700 font-medium text-[11px]">Pending Verification</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registered Since</span>
                  <span className="text-slate-700 font-mono text-[11px] block mt-0.5">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Tabs / Sections */}
          <div className="md:col-span-2 space-y-6">
            {/* Edit Profile Attributes */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                <User className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Contact Information
                </h2>
              </div>

              {profileMsg && (
                <div
                  className={`mb-4 p-3 rounded text-xs flex items-center space-x-2 border ${
                    profileMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {profileMsg.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address (Immutable)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-500 font-mono cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Official email address cannot be changed directly for civil audit integrity.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900 font-mono text-xs"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center space-x-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-100">
                <Key className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Update Password
                </h2>
              </div>

              {passwordMsg && (
                <div
                  className={`mb-4 p-3 rounded text-xs flex items-center space-x-2 border ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex items-center space-x-1.5 py-2 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold uppercase tracking-wider rounded shadow-xs transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>{passwordSaving ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";

type LoginTab = "student" | "admin";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "admin" ? "admin" : "student";

  const [tab, setTab] = useState<LoginTab>(initialTab);
  const [studentUuid, setStudentUuid] = useState("");
  const [adminUser, setAdminUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const expectedAdminUser =
    process.env.NEXT_PUBLIC_ADMIN_USER || "admin";
  const expectedAdminPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "password123";

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchAPI(`/students/${studentUuid.trim()}/allocation`);
      router.push(`/student/dashboard?id=${encodeURIComponent(studentUuid.trim())}`);
    } catch {
      setError("Invalid UUID. Check the ID from your registration confirmation.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      adminUser === expectedAdminUser &&
      adminPassword === expectedAdminPassword
    ) {
      document.cookie = "admin_auth=1; path=/; max-age=86400; SameSite=Lax";
      router.push("/admin");
      return;
    }

    setError("Invalid admin username or password.");
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Login</h1>
          <p className="mt-2 text-slate-500">
            Access your student dashboard or admin panel.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("student");
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === "student"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setError("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === "admin"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {tab === "student" ? (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student UUID
              </label>
              <input
                type="text"
                required
                value={studentUuid}
                onChange={(e) => setStudentUuid(e.target.value)}
                placeholder="Paste your registration UUID"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">
                You received this UUID after submitting your application.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          New student?{" "}
          <Link href="/apply" className="text-blue-600 hover:underline">
            Apply here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

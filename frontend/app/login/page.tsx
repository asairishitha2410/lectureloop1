"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Repeat2, LogIn, Mail, Lock, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [next, setNext] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("next");
    if (target && target.startsWith("/")) setNext(target);
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_20%_20%,#F6F2FF_0%,#FAF8F5_45%,#F3FAF5_100%)]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-blue flex items-center justify-center shadow-lg shadow-primary/25">
            <Repeat2 className="w-6 h-6 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-extrabold text-navy tracking-tight">LectureLoop</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Learn · Revise · Remember
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-slate-200/60 shadow-[0_20px_60px_rgba(15,23,42,0.12)] p-8">
          <h1 className="text-xl font-bold text-navy">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Sign in to continue your learning.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-3 rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3 rounded-[var(--radius-control)] border border-slate-200 bg-white text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-slate-400"
                />
              </div>
            </div>

            {error ? (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 text-sm text-rose-600" role="alert">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-gradient-to-r from-primary to-blue text-white font-semibold shadow-lg shadow-primary/20 hover:opacity-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            New to LectureLoop?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Backend API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Repeat2,
  Sparkles,
  NotebookPen,
  Layers,
  ListChecks,
  CalendarClock,
  BarChart3,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Link2,
  Brain,
  Clock,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const FEATURES = [
  {
    icon: NotebookPen,
    title: "Source-linked notes",
    description:
      "Topic-wise notes generated from the lecture, each tied back to the exact timestamp so you can revisit the source.",
    tone: "text-primary bg-lavender-soft",
  },
  {
    icon: Layers,
    title: "Smart flashcards",
    description:
      "Question-and-answer cards with spaced repetition that schedules each card for the moment you're about to forget it.",
    tone: "text-blue bg-blue-50",
  },
  {
    icon: ListChecks,
    title: "Practice quizzes",
    description:
      "Multiple-choice questions with clear explanations, difficulty labels and instant server-side grading.",
    tone: "text-emerald-600 bg-sage-soft",
  },
  {
    icon: CalendarClock,
    title: "Revision calendar",
    description:
      "See what's due, what's overdue and what's coming up, so revision becomes a habit instead of a scramble.",
    tone: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: BarChart3,
    title: "Learning analytics",
    description:
      "Track quiz score trends, topic accuracy and weak spots that LectureLoop recommends you review next.",
    tone: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Brain,
    title: "Understand, don't cram",
    description:
      "The whole loop — watch, understand, practice, remember — with a schedule that keeps knowledge fresh.",
    tone: "text-rose-500 bg-rose-50",
  },
];

const STEPS = [
  {
    icon: Link2,
    title: "Add a lecture",
    description: "Paste a YouTube URL or upload a transcript you have permission to use.",
  },
  {
    icon: Sparkles,
    title: "Generate material",
    description: "The AI pipeline turns it into structured notes, flashcards and quizzes.",
  },
  {
    icon: ListChecks,
    title: "Practice & test",
    description: "Study the cards, take quizzes and see explanations for every mistake.",
  },
  {
    icon: BarChart3,
    title: "Revise & improve",
    description: "Follow personalised recommendations and watch your weak topics strengthen.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const signedIn = !loading && user;

  return (
    <div className="min-h-screen bg-page text-slate-700">
      {/* ------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-page/80 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-[72px] flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue flex items-center justify-center shadow-lg shadow-primary/25">
              <Repeat2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-navy tracking-tight">LectureLoop</span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                Learn · Revise · Remember
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                className="h-10 px-4 sm:px-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-gradient-to-r from-primary to-blue text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-10 px-3 sm:px-4 inline-flex items-center gap-2 rounded-[var(--radius-control)] text-sm font-semibold text-slate-600 hover:text-primary hover:bg-lavender-soft transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link
                  href="/register"
                  className="h-10 px-4 sm:px-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-gradient-to-r from-primary to-blue text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition-all"
                >
                  Get started <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* ----------------------------------------------------------- hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,#F6F2FF_0%,#FAF8F5_45%,#F3FAF5_100%)]" aria-hidden />
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-14 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-flex items-center gap-2 rounded-full bg-lavender-soft border border-primary/15 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" /> AI Lecture-to-Learning Platform
              </span>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-navy leading-[1.08]">
                Turn every lecture into a{" "}
                <span className="gradient-text">learning system.</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Paste a lecture and LectureLoop generates source-linked notes, smart
                flashcards and practice quizzes — then schedules exactly what to revise
                next so knowledge actually sticks.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href={signedIn ? "/dashboard" : "/register"}
                  className="h-13 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue text-white font-semibold shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
                >
                  {signedIn ? "Go to your dashboard" : "Start learning free"}
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <Link
                  href="/login"
                  className="h-13 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white/70 border border-slate-200 text-navy font-semibold hover:border-primary/40 transition-all"
                >
                  <LogIn className="w-4.5 h-4.5" /> I have an account
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Source-linked material
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Spaced repetition
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card
                </span>
              </div>
            </div>

            {/* Hero preview card */}
            <div className="animate-fade-in-up delay-200">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-lavender/25 rounded-full blur-3xl -z-10 animate-float" aria-hidden />
                <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-blue/15 rounded-full blur-3xl -z-10" aria-hidden />

                <div className="rounded-[28px] bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E3A8A] p-6 sm:p-8 text-white shadow-2xl shadow-primary/25 animate-pulse-glow">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    <span className="ml-auto text-[11px] font-medium text-white/60">
                      lectureloop.app
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                    Today&apos;s revision
                  </p>
                  <h3 className="mt-1 text-xl font-bold">Good evening, learner</h3>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { label: "Lectures", value: "12" },
                      { label: "Cards due", value: "18" },
                      { label: "Avg. score", value: "86%" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl bg-white/10 border border-white/15 p-3.5">
                        <p className="text-lg font-extrabold leading-none">{s.value}</p>
                        <p className="mt-1.5 text-[11px] text-white/60">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Layers className="w-4 h-4 text-lavender" /> Flashcard due now
                    </div>
                    <p className="mt-1.5 text-xs text-white/70 leading-relaxed">
                      What is the difference between a process and a thread?
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Scheduled with SM-2
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Topic: Operating Systems
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- features */}
        <section id="features" className="max-w-[1200px] mx-auto px-4 sm:px-8 py-16 sm:py-24 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-primary">
              Everything in one loop
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-navy">
              More than a summary generator
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">
              LectureLoop doesn&apos;t just condense text — it supports the full journey from
              first watch to durable memory.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[var(--radius-card)] bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[var(--shadow-card)] p-6 hover:-translate-y-1 hover:shadow-primary/10 hover:border-primary/25 transition-all"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${feature.tone}`}>
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-base font-bold text-navy">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- how it works */}
        <section id="how-it-works" className="scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E3A8A] text-white p-8 sm:p-12">
              <div className="absolute -top-20 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" aria-hidden />
              <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-lavender/20 rounded-full blur-3xl" aria-hidden />

              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-white/85">
                  How it works
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
                  From lecture to memory in four steps
                </h2>
              </div>

              <div className="relative mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STEPS.map((step, i) => (
                  <div key={step.title} className="rounded-2xl bg-white/10 border border-white/15 p-5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-2xl font-extrabold text-white/25">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-white/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- cta */}
        <section className="max-w-[1200px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[var(--shadow-card)] px-8 py-14 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-blue flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight text-navy">
              Stop re-watching. Start remembering.
            </h2>
            <p className="mt-3 max-w-xl mx-auto text-slate-600 leading-relaxed">
              Create a free account and turn your first lecture into notes, flashcards and a
              revision schedule in minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={signedIn ? "/dashboard" : "/register"}
                className="h-13 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue text-white font-semibold shadow-lg shadow-primary/25 hover:brightness-110 transition-all"
              >
                {signedIn ? "Open dashboard" : "Create free account"}
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                href="/login"
                className="h-13 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-lavender-soft border border-primary/15 text-primary font-semibold hover:bg-primary/10 transition-all"
              >
                <LogIn className="w-4.5 h-4.5" /> Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-slate-200/60">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue flex items-center justify-center">
              <Repeat2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-navy">LectureLoop</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Learn · Revise · Remember — study material generated by the AI pipeline.
          </p>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/login" className="text-slate-500 hover:text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="text-slate-500 hover:text-primary transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

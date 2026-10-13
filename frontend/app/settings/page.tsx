"use client";

import { useEffect, useState } from "react";
import { User, Target, Languages, BellRing, CheckCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field, { inputClass, selectClass } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import type { Difficulty } from "@/types";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
];
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        checked ? "bg-primary" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { user, refresh } = useAuth();

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setLanguage(user.preferred_language);
    setDifficulty((user.default_difficulty as Difficulty) ?? "medium");
    setNotifications(user.notifications_enabled);
  }, [user]);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.push("Please enter your name.", "error");
      return;
    }
    setSaving(true);
    try {
      await api.updateMe({
        name: trimmedName,
        preferred_language: language,
        default_difficulty: difficulty,
        notifications_enabled: notifications,
      });
      await refresh();
      setSaved(true);
      toast.push("Settings saved.");
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.push(err instanceof ApiError ? err.message : "Could not save your settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Profile and learning preferences stored with your account on the server."
      />

      <div className="max-w-3xl space-y-6">
        {/* Profile */}
        <Card className="p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-bold text-navy text-lg mb-6">
            <User className="w-5 h-5 text-primary" /> Profile
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Name" htmlFor="settings-name" hint="Shown in the sidebar and dashboard greeting.">
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                autoComplete="name"
              />
            </Field>
            <Field label="Email" htmlFor="settings-email" hint="Your account email cannot be changed here.">
              <input
                id="settings-email"
                type="email"
                value={user?.email ?? ""}
                className={`${inputClass} bg-slate-50 text-slate-400`}
                disabled
                readOnly
              />
            </Field>
          </div>
        </Card>

        {/* Learning preferences */}
        <Card className="p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-bold text-navy text-lg mb-6">
            <Target className="w-5 h-5 text-primary" /> Learning
          </h2>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="Preferred difficulty"
                htmlFor="settings-difficulty"
                hint="Default used when generating new lectures and quizzes."
              >
                <select
                  id="settings-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className={selectClass}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Transcript language"
                htmlFor="settings-language"
                hint="Preferred language for new lectures."
              >
                <div className="relative">
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
                  <select
                    id="settings-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`${selectClass} pl-9`}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-navy">Study reminders</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Keep notifications enabled to be reminded about due reviews.
                  </p>
                </div>
              </div>
              <Switch checked={notifications} onChange={setNotifications} label="Study reminders" />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCheck className="w-4 h-4" /> Saved
              </span>
            ) : null}
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

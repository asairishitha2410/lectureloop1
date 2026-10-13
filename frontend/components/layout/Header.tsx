"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  Settings,
  UserRound,
  CheckCheck,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { titleFor } from "./nav";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/types";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const name = user?.name ?? "Student";
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .dueFlashcards()
      .then((cards) => {
        if (cancelled) return;
        setNotifications(
          cards.slice(0, 6).map((c) => ({
            id: `due-${c.flashcard_id}`,
            title: c.topic_title || c.lecture_title || "Flashcard due",
            description: `${c.question}${c.overdue ? " · overdue" : ""}`,
            time: c.overdue ? "Overdue" : "Due now",
            read: false,
            href: "/flashcards",
          }))
        );
      })
      .catch(() => {
        // Notifications are best-effort; ignore failures.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/lectures?q=${encodeURIComponent(q)}` : "/lectures");
    setQuery("");
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <header className="sticky top-0 z-30 h-[72px] border-b border-slate-200/60 bg-page/85 backdrop-blur-xl">
      <div className="h-full px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenu}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-lavender-soft cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0">
            <p className="text-[11px] font-medium text-slate-400 hidden sm:block">LectureLoop</p>
            <h2 className="text-base font-bold text-navy truncate">{titleFor(pathname)}</h2>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <form onSubmit={submitSearch} role="search" className="relative hidden md:block">
            <label htmlFor="global-search" className="sr-only">
              Search lectures
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
            <input
              id="global-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lectures…"
              className="h-10 w-56 lg:w-64 pl-9 pr-3 rounded-[var(--radius-control)] border border-slate-200 bg-white/80 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-slate-400"
            />
          </form>
          <Link
            href="/lectures"
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-lavender-soft cursor-pointer"
            aria-label="Search lectures"
          >
            <Search className="w-5 h-5" />
          </Link>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-lavender-soft hover:text-primary cursor-pointer"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
              aria-expanded={notifOpen}
            >
              <Bell className="w-5 h-5" />
              {unread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-primary to-lavender text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {unread}
                </span>
              ) : null}
            </button>
            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-[320px] z-40 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-navy/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-navy">Notifications</p>
                  <button
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => {
                        if (!n.read) {
                          setNotifications((prev) =>
                            prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                          );
                        }
                        setNotifOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-lavender-soft/60 transition-colors",
                        !n.read && "bg-lavender-soft/40"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 w-2 h-2 rounded-full shrink-0",
                          n.read ? "bg-slate-200" : "bg-primary"
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy">{n.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-snug">
                          {n.description}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-1">{n.time}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="p-2.5 border-t border-slate-100">
                  <Link
                    href="/flashcards"
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-2 rounded-lg hover:bg-lavender-soft cursor-pointer"
                  >
                    Go to revise <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 h-10 pl-1 pr-1.5 rounded-[var(--radius-control)] hover:bg-lavender-soft transition-colors cursor-pointer"
              aria-label="Account menu"
              aria-expanded={profileOpen}
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue flex items-center justify-center text-white text-xs font-bold">
                {initials(name)}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-60 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-navy/10 p-2">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-navy truncate">{name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <UserRound className="w-4 h-4 text-slate-400" /> Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
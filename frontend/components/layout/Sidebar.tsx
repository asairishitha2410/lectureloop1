"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Repeat2, X } from "lucide-react";
import { NAV_ITEMS, activeItem } from "./nav";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const name = user?.name ?? "Student";
  const email = user?.email ?? "";

  const current = activeItem(pathname);

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-50 lg:z-10 h-screen w-[268px] shrink-0 flex flex-col",
          "bg-[linear-gradient(165deg,#4C1D95_0%,#32136E_52%,#1E1B4B_100%)] text-white",
          "shadow-2xl shadow-navy/20 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-5 h-[72px] border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
              <Repeat2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-tight">LectureLoop</span>
              <span className="text-[10px] font-medium text-white/60 uppercase tracking-wide">
                Learn · Revise · Remember
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:bg-white/10 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Sections">
          {NAV_ITEMS.map((item) => {
            const active = current?.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-all",
                  active
                    ? "bg-white/15 text-white border border-white/15 shadow-md"
                    : "text-white/65 hover:bg-white/10 hover:text-white border border-transparent"
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5", active ? "text-white" : "text-white/50")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 mb-3">
            <p className="text-xs font-bold text-white">Keep your streak</p>
            <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
              Short, repeated reviews beat long cramming sessions. Review a few cards today.
            </p>
          </div>
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-white/10 transition-colors"
          >
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-lavender to-blue flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials(name)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white truncate">{name}</span>
              <span className="block text-[11px] text-white/55 truncate">{email}</span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
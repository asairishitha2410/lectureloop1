import {
  LayoutDashboard,
  Library,
  FilePlus2,
  NotebookPen,
  Layers,
  ListChecks,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lectures", label: "My Lectures", icon: Library },
  { href: "/lectures/new", label: "Add Lecture", icon: FilePlus2 },
  { href: "/notes", label: "AI Notes", icon: NotebookPen },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/quiz", label: "Practice Quiz", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Returns the sidebar section that should be highlighted for a path. */
export function activeItem(pathname: string): NavItem | undefined {
  if (pathname === "/dashboard") return NAV_ITEMS[0];
  const item = NAV_ITEMS.find((n) => {
    if (n.href === "/dashboard") return false;
    if (n.href === "/lectures") {
      return pathname === "/lectures" || pathname.startsWith("/lectures/") || pathname === "/notes" || pathname.startsWith("/notes");
    }
    return pathname === n.href || pathname.startsWith(`${n.href}/`);
  });
  return item;
}

export function titleFor(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/lectures/new")) return "Add Lecture";
  if (pathname.startsWith("/lectures/")) return "Lecture Workspace";
  const item = NAV_ITEMS.find((n) => n.href !== "/dashboard" && (pathname === n.href || pathname.startsWith(`${n.href}/`)));
  return item?.label ?? "LectureLoop";
}
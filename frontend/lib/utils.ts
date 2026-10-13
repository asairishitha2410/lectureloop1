// Small, dependency-free formatting and helper utilities.

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

let counter = 0;
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(
    Math.random() * 1e6
  ).toString(36)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDuration(seconds: number | undefined | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatTimestamp(seconds: number | undefined | null): string | null {
  if (seconds === null || seconds === undefined) return null;
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(value: string | Date | undefined | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeToNow(value: string | Date | null | undefined): string {
  if (!value) return "Not scheduled";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Not scheduled";
  const day = 24 * 60 * 60 * 1000;
  const days = Math.round((d.getTime() - Date.now()) / day);
  if (Math.abs(days) === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `in ${days} days`;
}

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Greeting adjusted to the local clock. */
export function greetingForHour(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function dayLabel(offsetFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetFromToday);
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function isoDate(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

// YouTube URL helpers --------------------------------------------------------

const YOUTUBE_PATTERNS: Array<string | RegExp> = [
  /(?:https?:)?\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:)?\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:)?\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
];

/** Extracts a YouTube id from a URL, or null when the input is not a valid video URL. */
export function parseYouTubeUrl(input: string): string | null {
  const trimmed = input.trim();
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function normalizeYouTubeUrl(input: string): string | null {
  const id = parseYouTubeUrl(input.trim());
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Watch the source lecture at a specific timestamp. */
export function youtubeLinkAt(id: string, seconds?: number): string {
  const t = seconds ? `&t=${Math.floor(seconds)}s` : "";
  return `https://www.youtube.com/watch?v=${id}${t}`;
}

export function getWordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
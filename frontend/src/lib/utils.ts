import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a timestamp from the backend, defaulting to UTC if the string lacks a
 * timezone marker.
 *
 * The backend stores datetimes as UTC (`datetime.now(timezone.utc)`) but
 * SQLite/Pydantic emit naive ISO strings like "2026-04-27T01:32:00.123456".
 * JavaScript's `new Date()` parses naive strings as **local** time, which
 * would shift every server timestamp by the user's UTC offset. We patch that
 * here at the parse boundary.
 */
export function parseTs(iso: string | null | undefined): Date {
  if (!iso) return new Date(NaN);
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : iso + "Z");
}

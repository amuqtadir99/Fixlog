/** Minimal RFC 5545 calendar of all-day events. */
export interface IcsEvent {
  uid: string;
  date: string; // YYYY-MM-DD
  summary: string;
  description?: string;
  url?: string;
}

export function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 octets (approximated by chars). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  for (let i = 0; i < line.length; i += 74) parts.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
  return parts.join("\r\n");
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function toIcs(events: IcsEvent[], now: Date = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FixLog//Maintenance//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:FixLog maintenance",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@fixlog`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${nextDay(e.date).replace(/-/g, "")}`,
      `SUMMARY:${icsEscape(e.summary)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

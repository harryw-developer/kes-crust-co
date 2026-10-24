import site from '../data/site.json';

export type Pitch = {
  id: string; date: string; start: string; end: string;
  name: string; area: string; address: string; note?: string;
};

const TZ = 'Europe/London';

// Offset (e.g. "+01:00") of UK local time on a given date/time, handles BST/GMT.
export function londonOffset(date: string, time: string) {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(guess).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = parts.match(/GMT([+-]\d+)?/);
  const h = m && m[1] ? parseInt(m[1], 10) : 0;
  return `${h >= 0 ? '+' : '-'}${String(Math.abs(h)).padStart(2, '0')}:00`;
}

export const iso = (date: string, time: string) => `${date}T${time}:00${londonOffset(date, time)}`;
export const epoch = (date: string, time: string) => new Date(iso(date, time)).getTime();

export function upcoming(dates: Pitch[], now = Date.now()) {
  return dates
    .filter((d) => epoch(d.date, d.end) > now)
    .sort((a, b) => epoch(a.date, a.start) - epoch(b.date, b.start));
}

const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(new Date(`${date}T12:00:00Z`));

export const dayShort = (date: string) => fmt(date, { weekday: 'short' });
export const dayLong = (date: string) => fmt(date, { weekday: 'long' });
export const dayNum = (date: string) => fmt(date, { day: 'numeric' });
export const monthShort = (date: string) => fmt(date, { month: 'short' });
export const dateLong = (date: string) => fmt(date, { weekday: 'long', day: 'numeric', month: 'long' });
export const dateShort = (date: string) => fmt(date, { weekday: 'short', day: 'numeric', month: 'short' });

export const times = (p: Pitch) => `${p.start}–${p.end}`;

export const mapsUrl = (p: Pitch) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`;

const utcStamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalUrl(p: Pitch) {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${site.name} at ${p.name}`,
    dates: `${utcStamp(epoch(p.date, p.start))}/${utcStamp(epoch(p.date, p.end))}`,
    details: `Wood-fired pizza from ${site.name}. ${site.url}/find-us`,
    location: p.address,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

const icsEscape = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

export function ics(p: Pitch) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KES Crust Co.//Trading dates//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${p.id}@kescrustco`,
    `DTSTAMP:${utcStamp(Date.now())}`,
    `DTSTART:${utcStamp(epoch(p.date, p.start))}`,
    `DTEND:${utcStamp(epoch(p.date, p.end))}`,
    `SUMMARY:${icsEscape(`${site.name} at ${p.name}`)}`,
    `LOCATION:${icsEscape(p.address)}`,
    `DESCRIPTION:${icsEscape(`Wood-fired pizza from ${site.name}. ${site.url}/find-us`)}`,
    `URL:${site.url}/find-us`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape('Pizza in 2 hours 🍕')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

export function eventSchema(p: Pitch) {
  return {
    '@type': 'FoodEvent',
    name: `${site.name} at ${p.name}`,
    startDate: iso(p.date, p.start),
    endDate: iso(p.date, p.end),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: p.name, address: p.address },
    organizer: { '@type': 'Organization', name: site.name, url: site.url },
    description: `Wood-fired pizza from the ${site.name} oven${p.note ? `. ${p.note}` : ''}.`,
    image: [`${site.url}/brand/kes-logo.png`],
    url: `${site.url}/find-us#${p.id}`,
  };
}

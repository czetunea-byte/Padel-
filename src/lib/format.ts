const dayFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const parse = (d: string) => new Date(`${d}T12:00:00`);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtDate = (d: string) => capitalize(dayFmt.format(parse(d)));
export const fmtLongDate = (d: string) => capitalize(longFmt.format(parse(d)));

export const today = () => dateOf(Date.now());

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export const MEDALS = ['🥇', '🥈', '🥉', '🥄'];
export const medal = (place: number) => MEDALS[Math.min(place, 4) - 1];

export const PLAYER_COLORS = ['#ff5d73', '#3fa7ff', '#ffb627', '#2ec4b6', '#9b5de5', '#f15bb5', '#00bb63', '#ff8c42'];
export const PLAYER_EMOJIS = ['🦁', '🐺', '🦊', '🐯', '🦅', '🐻', '🦈', '🐙', '🔥', '⚡', '🚀', '👑'];

/** Fecha local YYYY-MM-DD de un timestamp. */
export function dateOf(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

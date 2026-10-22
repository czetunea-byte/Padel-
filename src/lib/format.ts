const dayFmt = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const parse = (d: string) => new Date(`${d}T12:00:00`);

export const fmtDate = (d: string) => dayFmt.format(parse(d));
export const fmtLongDate = (d: string) => longFmt.format(parse(d));

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export const MEDALS = ['🥇', '🥈', '🥉', '🥄'];
export const medal = (place: number) => MEDALS[Math.min(place, 4) - 1];

export const PLAYER_COLORS = ['#ff5d73', '#3fa7ff', '#ffb627', '#2ec4b6', '#9b5de5', '#f15bb5', '#00bb63', '#ff8c42'];
export const PLAYER_EMOJIS = ['🦁', '🐺', '🦊', '🐯', '🦅', '🐻', '🦈', '🐙', '🔥', '⚡', '🚀', '👑'];

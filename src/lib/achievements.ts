import { bonusKind } from './money';
import { dayResult, sortSessions } from './scoring';
import { seasonChampions } from './seasons';
import type { Session } from './types';

export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  /** logro "de la vergüenza" */
  shame?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'zapatero', emoji: '👟', name: 'Zapatero', desc: 'Ganar un partido sin que el rival haga un solo game' },
  { id: 'remontada', emoji: '🔄', name: 'Remontada', desc: 'Ganar un partido que iban perdiendo' },
  { id: 'hattrick', emoji: '🎩', name: 'Hat-trick', desc: 'Ganar los 3 partidos de un día' },
  { id: 'llamas', emoji: '🔥', name: 'En llamas', desc: 'Ganar 3 días seguidos' },
  { id: 'canonero', emoji: '💥', name: 'Cañonero', desc: 'Hacer 20 puntos o más en un día' },
  { id: 'campeon', emoji: '🏆', name: 'Campeón de temporada', desc: 'Terminar 1º en un trimestre' },
  { id: 'veterano10', emoji: '🎖️', name: 'Veterano', desc: 'Jugar 10 jornadas' },
  { id: 'veterano25', emoji: '🏅', name: 'Leyenda', desc: 'Jugar 25 jornadas' },
  { id: 'veterano50', emoji: '🗿', name: 'Monumento', desc: 'Jugar 50 jornadas' },
  { id: 'cucharero', emoji: '🥄', name: 'Cucharero', desc: 'Quedar último 3 veces. Felicidades… creo', shame: true },
];

/** Por jugador: id del logro → fecha en que lo desbloqueó. */
export type Unlocked = Record<string, Record<string, string>>;

export function achievements(sessions: Session[], ids: string[], today: string): Unlocked {
  const out: Unlocked = Object.fromEntries(ids.map((id) => [id, {}]));
  const unlock = (pid: string, ach: string, date: string) => {
    if (out[pid] && !out[pid][ach]) out[pid][ach] = date;
  };
  const played: Record<string, number> = {};
  const streak: Record<string, number> = {};
  const spoons: Record<string, number> = {};

  for (const s of sortSessions(sessions)) {
    const res = dayResult(s);
    const lastPlace = Math.max(...res.map((r) => r.place));
    for (const r of res) {
      const pid = r.playerId;
      played[pid] = (played[pid] ?? 0) + 1;
      if (played[pid] === 10) unlock(pid, 'veterano10', s.date);
      if (played[pid] === 25) unlock(pid, 'veterano25', s.date);
      if (played[pid] === 50) unlock(pid, 'veterano50', s.date);
      if (r.matchesWon >= 3) unlock(pid, 'hattrick', s.date);
      if (r.total >= 20) unlock(pid, 'canonero', s.date);
      streak[pid] = r.place === 1 ? (streak[pid] ?? 0) + 1 : 0;
      if (streak[pid] >= 3) unlock(pid, 'llamas', s.date);
      if (lastPlace > 1 && r.place === lastPlace) {
        spoons[pid] = (spoons[pid] ?? 0) + 1;
        if (spoons[pid] >= 3) unlock(pid, 'cucharero', s.date);
      }
    }
    for (const m of s.matches) {
      const kind = bonusKind(m);
      if (!kind) continue;
      const winners = m.gamesA > m.gamesB ? m.teamA : m.teamB;
      for (const pid of winners) unlock(pid, kind === 'zapato' ? 'zapatero' : 'remontada', s.date);
    }
  }
  for (const c of seasonChampions(sessions, ids, today)) {
    if (c.finished) for (const pid of c.playerIds) unlock(pid, 'campeon', c.lastDate);
  }
  return out;
}

/** Logros que alguien desbloqueó entre `before` y `after`. */
export function newAchievements(before: Unlocked, after: Unlocked): { playerId: string; def: AchievementDef }[] {
  const out: { playerId: string; def: AchievementDef }[] = [];
  for (const [pid, got] of Object.entries(after)) {
    for (const def of ACHIEVEMENTS) {
      if (got[def.id] && !before[pid]?.[def.id]) out.push({ playerId: pid, def });
    }
  }
  return out;
}

import { dayResult, sortSessions } from './scoring';
import type { Session } from './types';

export const HANDICAP_WINDOW = 8;
export const HANDICAP_MIN_SESSIONS = 3;

export interface HandicapSuggestion {
  avgGames: number;
  suggested: number;
}

/**
 * Handicap sugerido: la mitad de lo que le falta a cada quien (en games por día,
 * sin contar handicap) para llegar al mejor promedio de las últimas jornadas.
 */
export function suggestHandicaps(sessions: Session[], ids: string[]): Record<string, HandicapSuggestion> | null {
  const recent = sortSessions(sessions).slice(-HANDICAP_WINDOW);
  if (recent.length < HANDICAP_MIN_SESSIONS) return null;
  const sum: Record<string, number> = {};
  const count: Record<string, number> = {};
  for (const s of recent) {
    for (const r of dayResult(s)) {
      sum[r.playerId] = (sum[r.playerId] ?? 0) + r.games;
      count[r.playerId] = (count[r.playerId] ?? 0) + 1;
    }
  }
  const avg = Object.fromEntries(ids.filter((id) => count[id]).map((id) => [id, sum[id] / count[id]]));
  const best = Math.max(...Object.values(avg));
  return Object.fromEntries(
    Object.entries(avg).map(([id, a]) => [id, { avgGames: a, suggested: Math.round((best - a) / 2) }]),
  );
}

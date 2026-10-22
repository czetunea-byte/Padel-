import { leaderboard, sortSessions } from './scoring';
import type { Session } from './types';

const QUARTERS = ['Ene–Mar', 'Abr–Jun', 'Jul–Sep', 'Oct–Dic'];

export interface Season {
  id: string;
  label: string;
  short: string;
}

/** Temporadas por trimestre: 2026-T4 = octubre a diciembre de 2026. */
export function seasonOf(date: string): Season {
  const [y, m] = date.split('-').map(Number);
  const q = Math.floor((m - 1) / 3);
  return { id: `${y}-T${q + 1}`, label: `${QUARTERS[q]} ${y}`, short: `T${q + 1} ${y}` };
}

export function groupBySeason(sessions: Session[]): { season: Season; sessions: Session[] }[] {
  const map = new Map<string, { season: Season; sessions: Session[] }>();
  for (const s of sortSessions(sessions)) {
    const season = seasonOf(s.date);
    if (!map.has(season.id)) map.set(season.id, { season, sessions: [] });
    map.get(season.id)!.sessions.push(s);
  }
  return [...map.values()];
}

export interface SeasonChampion {
  season: Season;
  playerIds: string[];
  daysWon: number;
  played: number;
  finished: boolean;
  /** fecha de la última jornada de la temporada */
  lastDate: string;
}

/** Campeones por temporada; la temporada de `today` sigue en curso. */
export function seasonChampions(sessions: Session[], ids: string[], today: string): SeasonChampion[] {
  const current = seasonOf(today).id;
  return groupBySeason(sessions).map(({ season, sessions: ss }) => {
    const table = leaderboard(ss, ids);
    const top = table.filter((t) => t.rank === 1);
    return {
      season,
      playerIds: top.map((t) => t.playerId),
      daysWon: top[0]?.daysWon ?? 0,
      played: ss.length,
      finished: season.id < current,
      lastDate: ss[ss.length - 1].date,
    };
  });
}

import type { Match, Session, Team } from './types';

/** Los 3 cruces de una jornada: cada jugador juega con cada compañero una vez. */
export function pairings(ids: string[]): { teamA: Team; teamB: Team }[] {
  const [a, b, c, d] = ids;
  return [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];
}

export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((x, y) => x.date.localeCompare(y.date) || x.createdAt - y.createdAt);
}

export interface DayLine {
  playerId: string;
  games: number;
  handicap: number;
  total: number;
  matchesWon: number;
  place: number;
}

/**
 * Asigna lugares estilo competición (1,1,3,4) a una lista ya ordenada,
 * usando `same` para saber si dos elementos empatan.
 */
function assignPlaces<T>(sorted: T[], same: (a: T, b: T) => boolean): number[] {
  const places: number[] = [];
  sorted.forEach((item, i) => {
    places.push(i > 0 && same(sorted[i - 1], item) ? places[i - 1] : i + 1);
  });
  return places;
}

/** Resultado de un día: games + handicap. Desempate por partidos ganados. */
export function dayResult(session: Session): DayLine[] {
  const lines = session.playerIds.map((id): Omit<DayLine, 'place'> => {
    let games = 0;
    let matchesWon = 0;
    for (const m of session.matches) {
      const inA = m.teamA.includes(id);
      const inB = m.teamB.includes(id);
      if (!inA && !inB) continue;
      const mine = inA ? m.gamesA : m.gamesB;
      const theirs = inA ? m.gamesB : m.gamesA;
      games += mine;
      if (mine > theirs) matchesWon++;
    }
    const handicap = session.handicaps[id] ?? 0;
    return { playerId: id, games, handicap, total: games + handicap, matchesWon };
  });
  lines.sort((x, y) => y.total - x.total || y.matchesWon - x.matchesWon);
  const places = assignPlaces(lines, (a, b) => a.total === b.total && a.matchesWon === b.matchesWon);
  return lines.map((l, i) => ({ ...l, place: places[i] }));
}

export interface Standing {
  playerId: string;
  played: number;
  daysWon: number;
  /** cuántas veces quedó en 1º, 2º, 3º y 4º */
  placeCounts: [number, number, number, number];
  avgPlace: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  /** cuchara de madera: veces último */
  spoons: number;
  rank: number;
}

export function leaderboard(sessions: Session[], playerIds: string[]): Standing[] {
  const ordered = sortSessions(sessions);
  const map = new Map<string, Standing>();
  const streak = new Map<string, number>();
  for (const id of playerIds) {
    map.set(id, {
      playerId: id, played: 0, daysWon: 0, placeCounts: [0, 0, 0, 0], avgPlace: 0,
      totalPoints: 0, currentStreak: 0, bestStreak: 0, spoons: 0, rank: 0,
    });
    streak.set(id, 0);
  }
  const placeSum = new Map<string, number>();
  for (const s of ordered) {
    const res = dayResult(s);
    const lastPlace = Math.max(...res.map((r) => r.place));
    for (const r of res) {
      const st = map.get(r.playerId);
      if (!st) continue;
      st.played++;
      st.totalPoints += r.total;
      st.placeCounts[Math.min(r.place, 4) - 1]++;
      placeSum.set(r.playerId, (placeSum.get(r.playerId) ?? 0) + r.place);
      if (r.place === lastPlace && res.length > 1 && lastPlace > 1) st.spoons++;
      if (r.place === 1) {
        st.daysWon++;
        const cur = (streak.get(r.playerId) ?? 0) + 1;
        streak.set(r.playerId, cur);
        st.bestStreak = Math.max(st.bestStreak, cur);
      } else {
        streak.set(r.playerId, 0);
      }
    }
  }
  const list = [...map.values()].map((st) => ({
    ...st,
    avgPlace: st.played ? (placeSum.get(st.playerId) ?? 0) / st.played : 0,
    currentStreak: streak.get(st.playerId) ?? 0,
  }));
  const cmp = (a: Standing, b: Standing) =>
    b.daysWon - a.daysWon ||
    b.placeCounts[1] - a.placeCounts[1] ||
    (a.played && b.played ? a.avgPlace - b.avgPlace : b.played - a.played) ||
    b.totalPoints - a.totalPoints;
  list.sort(cmp);
  const ranks = assignPlaces(list, (a, b) => cmp(a, b) === 0);
  return list.map((st, i) => ({ ...st, rank: ranks[i] }));
}

export interface PairStat {
  pair: Team;
  played: number;
  won: number;
  gamesFor: number;
  gamesAgainst: number;
  winRate: number;
}

const pairKey = (t: Team) => [...t].sort().join('|');

export function pairStats(sessions: Session[], playerIds: string[]): PairStat[] {
  const map = new Map<string, PairStat>();
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const pair: Team = [playerIds[i], playerIds[j]];
      map.set(pairKey(pair), { pair, played: 0, won: 0, gamesFor: 0, gamesAgainst: 0, winRate: 0 });
    }
  }
  const add = (team: Team, gf: number, ga: number) => {
    const st = map.get(pairKey(team));
    if (!st) return;
    st.played++;
    st.gamesFor += gf;
    st.gamesAgainst += ga;
    if (gf > ga) st.won++;
  };
  for (const s of sessions) {
    for (const m of s.matches) {
      add(m.teamA, m.gamesA, m.gamesB);
      add(m.teamB, m.gamesB, m.gamesA);
    }
  }
  return [...map.values()]
    .map((st) => ({ ...st, winRate: st.played ? st.won / st.played : 0 }))
    .sort(
      (a, b) =>
        b.winRate - a.winRate ||
        b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst) ||
        b.played - a.played,
    );
}

/** Lugar en la tabla general después de cada jornada (para la gráfica). */
export function positionHistory(sessions: Session[], playerIds: string[]) {
  const ordered = sortSessions(sessions);
  return ordered.map((s, i) => {
    const table = leaderboard(ordered.slice(0, i + 1), playerIds);
    const places: Record<string, number> = {};
    for (const st of table) places[st.playerId] = st.rank;
    return { date: s.date, places };
  });
}

export interface Records {
  bestDay?: { playerId: string; total: number; date: string };
  biggestWin?: { match: Match; margin: number; date: string };
}

export function records(sessions: Session[]): Records {
  const out: Records = {};
  for (const s of sessions) {
    for (const r of dayResult(s)) {
      if (!out.bestDay || r.total > out.bestDay.total) {
        out.bestDay = { playerId: r.playerId, total: r.total, date: s.date };
      }
    }
    for (const m of s.matches) {
      const margin = Math.abs(m.gamesA - m.gamesB);
      if (margin > 0 && (!out.biggestWin || margin > out.biggestWin.margin)) {
        out.biggestWin = { match: m, margin, date: s.date };
      }
    }
  }
  return out;
}

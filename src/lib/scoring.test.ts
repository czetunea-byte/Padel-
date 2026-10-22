import { describe, expect, it } from 'vitest';
import { dayResult, leaderboard, pairStats, pairings, positionHistory, records, rivalStats } from './scoring';
import type { Session } from './types';

const P = ['ana', 'beto', 'caro', 'dani'];

function session(date: string, scores: [number, number][], handicaps: Record<string, number> = {}): Session {
  return {
    id: date,
    date,
    playerIds: P,
    handicaps,
    createdAt: 0,
    matches: pairings(P).map((p, i) => ({ ...p, gamesA: scores[i][0], gamesB: scores[i][1] })),
  };
}

describe('pairings', () => {
  it('cada jugador juega con cada compañero exactamente una vez', () => {
    const ps = pairings(P);
    expect(ps).toHaveLength(3);
    const keys = ps.flatMap((p) => [p.teamA, p.teamB].map((t) => [...t].sort().join()));
    expect(new Set(keys).size).toBe(6);
  });
});

describe('dayResult', () => {
  it('suma games de los 3 partidos más el handicap', () => {
    // ana+beto 6-4, ana+caro 6-2, ana+dani 3-6
    const res = dayResult(session('2026-01-01', [[6, 4], [6, 2], [3, 6]], { dani: 5 }));
    const by = Object.fromEntries(res.map((r) => [r.playerId, r]));
    expect(by.ana.total).toBe(15);
    expect(by.beto.games).toBe(6 + 2 + 6); // 14
    expect(by.caro.games).toBe(4 + 6 + 6); // 16
    expect(by.dani.total).toBe(4 + 2 + 3 + 5); // 14
    expect(res[0].playerId).toBe('caro');
    expect(res[0].place).toBe(1);
  });

  it('desempata por partidos ganados y comparte lugar si persiste', () => {
    const res = dayResult(session('2026-01-01', [[6, 6], [6, 6], [6, 6]]));
    expect(res.every((r) => r.place === 1)).toBe(true);
  });
});

describe('leaderboard', () => {
  const sessions = [
    session('2026-01-01', [[6, 0], [6, 0], [6, 0]]), // ana gana
    session('2026-01-05', [[6, 0], [6, 0], [6, 0]]), // ana gana
    session('2026-01-08', [[0, 6], [0, 6], [0, 6]], { beto: 10 }), // beto gana con handicap
  ];
  it('ordena por días ganados y calcula rachas', () => {
    const t = leaderboard(sessions, P);
    expect(t[0].playerId).toBe('ana');
    expect(t[0].daysWon).toBe(2);
    expect(t[0].bestStreak).toBe(2);
    expect(t[0].currentStreak).toBe(0);
    const beto = t.find((s) => s.playerId === 'beto')!;
    expect(beto.daysWon).toBe(1);
    expect(beto.currentStreak).toBe(1);
    expect(t.find((s) => s.playerId === 'ana')!.spoons).toBe(1);
  });

  it('historial de posiciones tiene una entrada por jornada', () => {
    const h = positionHistory(sessions, P);
    expect(h).toHaveLength(3);
    expect(h[0].places.ana).toBe(1);
  });
});

describe('pairStats y records', () => {
  it('cuenta victorias por pareja', () => {
    const st = pairStats([session('2026-01-01', [[6, 0], [6, 0], [6, 0]])], P);
    expect(st).toHaveLength(6);
    const anaBeto = st.find((s) => s.pair.includes('ana') && s.pair.includes('beto'))!;
    expect(anaBeto.won).toBe(1);
    expect(st[0].winRate).toBe(1);
  });

  it('encuentra la mayor paliza', () => {
    const r = records([session('2026-01-01', [[6, 1], [6, 4], [2, 6]])]);
    expect(r.biggestWin?.margin).toBe(5);
  });
});

describe('rivalStats', () => {
  it('cuenta victorias y derrotas contra cada rival', () => {
    // ana gana los 3 partidos: cada rival la enfrentó 2 veces
    const r = rivalStats([session('2026-01-01', [[6, 0], [6, 0], [6, 0]])], 'ana', P);
    expect(r).toHaveLength(3);
    expect(r.every((x) => x.played === 2 && x.won === 2 && x.lost === 0)).toBe(true);
  });
});

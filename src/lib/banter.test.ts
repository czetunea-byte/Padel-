import { describe, expect, it } from 'vitest';
import { lastDayBanter, leaderBanter, nickname, saveBanter } from './banter';
import { dayResult, leaderboard, pairings } from './scoring';
import type { Session } from './types';

const P = ['ana', 'beto', 'caro', 'dani'];
const names = { ana: 'Ana', beto: 'Beto', caro: 'Caro', dani: 'Dani' };

function session(id: string, scores: [number, number][], handicaps: Record<string, number> = {}): Session {
  return {
    id,
    date: `2026-01-${id.padStart(2, '0')}`,
    playerIds: P,
    handicaps,
    createdAt: 0,
    matches: pairings(P).map((p, i) => ({ ...p, gamesA: scores[i][0], gamesB: scores[i][1] })),
  };
}

const noPlaceholders = (s: string | null) => expect(s ?? '').not.toMatch(/\{\w+\}/);

describe('saveBanter', () => {
  it('detecta paliza', () => {
    // ana 18, beto 6+0+6=12... diferencia >= 8 con ana muy arriba
    const b = saveBanter(dayResult(session('1', [[6, 0], [6, 0], [6, 0]])), names, 's1');
    expect(b.kind).toBe('paliza');
    expect(b.winnerLine).toContain('Ana');
    noPlaceholders(b.winnerLine);
    noPlaceholders(b.loserLine);
  });

  it('detecta empate arriba', () => {
    const b = saveBanter(dayResult(session('2', [[6, 6], [6, 6], [6, 6]])), names, 's2');
    expect(b.kind).toBe('empate');
    expect(b.loserLine).toBeNull();
  });

  it('detecta cuando el handicap decide', () => {
    // sin handicap gana caro (16), dani gana con +5
    const b = saveBanter(dayResult(session('3', [[6, 4], [6, 2], [3, 6]], { dani: 5 })), names, 's3');
    expect(b.kind).not.toBe('handicap'); // caro 16 vs dani 14: no le alcanza
    const b2 = saveBanter(dayResult(session('3', [[6, 4], [6, 2], [3, 6]], { dani: 4, beto: 0 })), names, 's3');
    expect(b2.kind).not.toBe('handicap');
    const b3 = saveBanter(dayResult(session('3', [[6, 4], [6, 2], [3, 6]], { dani: 8 })), names, 's3');
    expect(b3.kind).toBe('handicap');
    expect(b3.winnerLine).toContain('Dani');
  });

  it('es determinista', () => {
    const res = dayResult(session('4', [[6, 4], [4, 6], [6, 3]]));
    expect(saveBanter(res, names, 'x')).toEqual(saveBanter(res, names, 'x'));
  });
});

describe('tabla', () => {
  // ana 18, beto 12, caro 10, dani 8 en cada jornada
  const sessions = ['1', '2', '3'].map((id) => session(id, [[6, 0], [6, 2], [6, 4]]));
  const table = leaderboard(sessions, P);

  it('frase del líder en racha y jab al que va en blanco', () => {
    const l = leaderBanter(table, names, '3');
    expect(l.kind).toBe('racha');
    expect(l.text).toContain('Ana');
    noPlaceholders(l.text);
  });

  it('apodos según la situación', () => {
    const by = Object.fromEntries(table.map((s) => [s.playerId, nickname(s, table, '3').kind]));
    expect(by.ana).toBe('patron');
    expect(by.beto).toBe('blanco');
    // dani gana un día pero sigue siendo el que más veces quedó último
    const withDani = leaderboard([...sessions, session('4', [[0, 6], [0, 6], [6, 0]])], P);
    const dani = withDani.find((s) => s.playerId === 'dani')!;
    expect(nickname(dani, withDani, '4').kind).toBe('cuchara');
  });

  it('frase de la última jornada', () => {
    const d = lastDayBanter(sessions[2], names);
    expect(d.kind).toBe('paliza');
    noPlaceholders(d.text);
    expect(lastDayBanter(session('5', [[6, 5], [6, 5], [6, 5]]), names).kind).toBe('cerrado');
  });
});

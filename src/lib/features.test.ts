import { describe, expect, it } from 'vitest';
import { achievements, newAchievements } from './achievements';
import { suggestHandicaps } from './handicap';
import { balances, dayMoney, lifetimeMoney, settleUp } from './money';
import { pairings } from './scoring';
import { seasonChampions, seasonOf } from './seasons';
import { dayShareText } from './share';
import type { Player, Session } from './types';

const P = ['ana', 'beto', 'caro', 'dani'];

function session(
  id: string,
  date: string,
  scores: [number, number][],
  opts: { handicaps?: Record<string, number>; remontada?: number; createdAt?: number } = {},
): Session {
  return {
    id,
    date,
    playerIds: P,
    handicaps: opts.handicaps ?? {},
    createdAt: opts.createdAt ?? Number(id),
    matches: pairings(P).map((p, i) => ({
      ...p,
      gamesA: scores[i][0],
      gamesB: scores[i][1],
      remontada: opts.remontada === i,
    })),
  };
}

const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);

// ana gana el día; ningún perdedor se queda en 0 (no hay zapatos)
const normal: [number, number][] = [[6, 1], [6, 2], [6, 4]];

describe('dinero', () => {
  it('1º cobra 300, 3º paga 100, 4º paga 200', () => {
    const m = dayMoney(session('1', '2026-10-01', [[6, 4], [6, 3], [6, 2]]));
    // ana 18 · beto 6+3+2=11 · caro 4+6+2=12 · dani 4+3+6=13
    expect(m.prize).toEqual({ ana: 300, dani: 0, caro: -100, beto: -200 });
    expect(m.bonuses).toEqual([]);
    expect(sum(m.total)).toBe(0);
  });

  it('reparte empates y siempre suma 0', () => {
    const all = dayMoney(session('1', '2026-10-01', [[6, 6], [6, 6], [6, 6]]));
    expect(Object.values(all.prize)).toEqual([0, 0, 0, 0]);
    // beto, caro y dani empatan detrás de ana: entre los 3 ponen 300
    const three = dayMoney(session('2', '2026-10-01', [[6, 3], [6, 3], [6, 3]]));
    expect(three.prize.ana).toBe(300);
    expect(sum(three.prize)).toBe(0);
    expect(three.prize.beto).toBe(-100);
  });

  it('zapato y remontada: cada perdedor paga 100 a un ganador', () => {
    const z = dayMoney(session('1', '2026-10-01', [[6, 0], [6, 2], [6, 4]]));
    expect(z.bonuses).toEqual([{ matchIndex: 0, kind: 'zapato' }]);
    expect(z.bonus).toEqual({ ana: 100, beto: 100, caro: -100, dani: -100 });
    const r = dayMoney(session('2', '2026-10-01', normal, { remontada: 2 }));
    expect(r.bonuses).toEqual([{ matchIndex: 2, kind: 'remontada' }]);
    expect(sum(r.total)).toBe(0);
  });

  it('saldo desde la última saldada y quién le paga a quién', () => {
    const ss = [session('1', '2026-10-01', normal), session('3', '2026-10-02', normal)];
    const before = balances(ss, [], P);
    expect(before.ana).toBe(600);
    const after = balances(ss, [{ id: 'x', createdAt: 2, balances: {} }], P);
    expect(after.ana).toBe(300);
    expect(lifetimeMoney(ss, P).ana).toBe(600);
    const t = settleUp(before);
    expect(t.reduce((a, b) => a + b.amount, 0)).toBe(600);
    expect(t.every((x) => x.to === 'ana')).toBe(true);
  });
});

describe('temporadas', () => {
  it('trimestres', () => {
    expect(seasonOf('2026-10-22').id).toBe('2026-T4');
    expect(seasonOf('2026-03-31').id).toBe('2026-T1');
  });
  it('campeón de temporadas terminadas', () => {
    const c = seasonChampions([session('1', '2026-08-01', normal), session('2', '2026-10-01', normal)], P, '2026-10-22');
    expect(c[0]).toMatchObject({ finished: true, playerIds: ['ana'] });
    expect(c[1].finished).toBe(false);
  });
});

describe('logros', () => {
  it('desbloquea y detecta los nuevos', () => {
    const ss = ['1', '2', '3'].map((id) => session(id, `2026-07-0${id}`, [[6, 0], [6, 2], [6, 4]]));
    const before = achievements(ss.slice(0, 2), P, '2026-10-22');
    const after = achievements(ss, P, '2026-10-22');
    expect(after.ana).toMatchObject({ zapatero: '2026-07-01', hattrick: '2026-07-01', llamas: '2026-07-03', campeon: '2026-07-03' });
    expect(after.beto.zapatero).toBe('2026-07-01');
    expect(after.dani.cucharero).toBe('2026-07-03');
    expect(newAchievements(before, after).map((n) => `${n.playerId}:${n.def.id}`)).toEqual(['ana:llamas', 'dani:cucharero']);
  });
});

describe('handicap sugerido', () => {
  it('mitad de la diferencia contra el mejor promedio', () => {
    expect(suggestHandicaps([session('1', '2026-10-01', normal)], P)).toBeNull();
    const s = suggestHandicaps(['1', '2', '3'].map((id) => session(id, `2026-10-0${id}`, normal)), P)!;
    expect(s.ana.suggested).toBe(0);
    expect(s.beto.suggested).toBe(Math.round((18 - s.beto.avgGames) / 2));
  });
});

describe('compartir', () => {
  it('arma el texto del día', () => {
    const players: Player[] = P.map((id, i) => ({ id, name: id.toUpperCase(), emoji: '🎾', color: '#000', handicap: 0, order: i }));
    const t = dayShareText(session('1', '2026-10-01', [[6, 0], [6, 2], [6, 4]]), players, 'Cuates', 'https://x');
    expect(t).toContain('*Cuates*');
    expect(t).toContain('ANA & BETO 6–0 CARO & DANI 👟');
    expect(t).toContain('🥄');
    expect(t).toContain('https://x');
  });
});

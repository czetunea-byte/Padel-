import { dayResult } from './scoring';
import type { Match, Session, Settlement } from './types';

/** Lo que gana (+) o paga (−) cada lugar del día: 1º se lleva lo que pagan 3º y 4º. */
export const PRIZES = [300, 0, -100, -200];
/** Lo que paga cada perdedor (y cobra cada ganador) en un zapato o remontada. */
export const BONUS = 100;

export type BonusKind = 'zapato' | 'remontada';

/** Zapato: la pareja perdedora no hizo ni un game. */
export const isZapato = (m: Match) => Math.min(m.gamesA, m.gamesB) === 0 && Math.max(m.gamesA, m.gamesB) > 0;

export function bonusKind(m: Match): BonusKind | null {
  if (m.gamesA === m.gamesB) return null;
  if (isZapato(m)) return 'zapato';
  if (m.remontada) return 'remontada';
  return null;
}

/** Reparte `total` entre `n` en pesos enteros sin que se pierda ni sobre nada. */
function split(total: number, n: number): number[] {
  const base = Math.trunc(total / n);
  let rest = total - base * n;
  return Array.from({ length: n }, () => {
    const step = Math.sign(rest);
    rest -= step;
    return base + step;
  });
}

export interface DayMoney {
  total: Record<string, number>;
  prize: Record<string, number>;
  bonus: Record<string, number>;
  bonuses: { matchIndex: number; kind: BonusKind }[];
}

export function dayMoney(session: Session): DayMoney {
  const res = dayResult(session);
  const prize: Record<string, number> = {};
  const bonus: Record<string, number> = {};
  for (const id of session.playerIds) {
    prize[id] = 0;
    bonus[id] = 0;
  }

  // Empates: los lugares que ocupan se suman y se reparten.
  const byPlace = new Map<number, string[]>();
  for (const r of res) byPlace.set(r.place, [...(byPlace.get(r.place) ?? []), r.playerId]);
  for (const [place, ids] of byPlace) {
    const pot = ids.reduce((sum, _, i) => sum + (PRIZES[place - 1 + i] ?? 0), 0);
    split(pot, ids.length).forEach((v, i) => (prize[ids[i]] = v));
  }

  const bonuses: DayMoney['bonuses'] = [];
  session.matches.forEach((m, matchIndex) => {
    const kind = bonusKind(m);
    if (!kind) return;
    bonuses.push({ matchIndex, kind });
    const [winners, losers] = m.gamesA > m.gamesB ? [m.teamA, m.teamB] : [m.teamB, m.teamA];
    for (const id of winners) bonus[id] = (bonus[id] ?? 0) + BONUS;
    for (const id of losers) bonus[id] = (bonus[id] ?? 0) - BONUS;
  });

  const total: Record<string, number> = {};
  for (const id of Object.keys(prize)) total[id] = prize[id] + (bonus[id] ?? 0);
  return { total, prize, bonus, bonuses };
}

function addInto(acc: Record<string, number>, add: Record<string, number>) {
  for (const [id, v] of Object.entries(add)) acc[id] = (acc[id] ?? 0) + v;
  return acc;
}

/** Saldo de cada quien desde la última vez que saldaron. */
export function balances(sessions: Session[], settlements: Settlement[], ids: string[]): Record<string, number> {
  const since = Math.max(0, ...settlements.map((s) => s.createdAt));
  const acc: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const s of sessions) if (s.createdAt > since) addInto(acc, dayMoney(s).total);
  return acc;
}

/** Lo que cada quien ha ganado o perdido en toda la historia. */
export function lifetimeMoney(sessions: Session[], ids: string[]): Record<string, number> {
  const acc: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const s of sessions) addInto(acc, dayMoney(s).total);
  return acc;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/** Quién le paga a quién, con pocas transferencias (el que más debe al que más le deben). */
export function settleUp(bal: Record<string, number>): Transfer[] {
  const debtors = Object.entries(bal).filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  const creditors = Object.entries(bal).filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  debtors.sort((a, b) => b.v - a.v);
  creditors.sort((a, b) => b.v - a.v);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].v, creditors[j].v);
    out.push({ from: debtors[i].id, to: creditors[j].id, amount });
    debtors[i].v -= amount;
    creditors[j].v -= amount;
    if (debtors[i].v === 0) i++;
    if (creditors[j].v === 0) j++;
  }
  return out;
}

export const money = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}$${Math.abs(n).toLocaleString('es-MX')}`;

import { saveBanter } from './banter';
import { fmtDate, medal } from './format';
import { dayMoney, money } from './money';
import { dayResult } from './scoring';
import type { Player, Session } from './types';

/** Mensaje de la jornada listo para pegar en el grupo de WhatsApp. */
export function dayShareText(session: Session, players: Player[], leagueName: string, link: string): string {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '¿?';
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
  const res = dayResult(session);
  const banter = saveBanter(res, names, session.id);
  const cash = dayMoney(session);
  const lastPlace = Math.max(...res.map((r) => r.place));

  const lines = [`🎾 *${leagueName}* · ${fmtDate(session.date)}`, `*${banter.title}*`, ''];
  for (const r of res) {
    const icon = lastPlace > 1 && r.place === lastPlace ? '🥄' : medal(r.place);
    const hcp = r.handicap ? ` (${r.games}${r.handicap > 0 ? '+' : ''}${r.handicap})` : '';
    lines.push(`${icon} ${name(r.playerId)} *${r.total}*${hcp}`);
  }
  lines.push('', 'Partidos:');
  session.matches.forEach((m, i) => {
    const tag = cash.bonuses.find((b) => b.matchIndex === i)?.kind;
    const extra = tag === 'zapato' ? ' 👟' : tag === 'remontada' ? ' 🔄' : '';
    lines.push(`${m.teamA.map(name).join(' & ')} ${m.gamesA}–${m.gamesB} ${m.teamB.map(name).join(' & ')}${extra}`);
  });
  const owed = res.map((r) => r.playerId).filter((id) => cash.total[id] !== 0);
  if (owed.length) {
    lines.push('', `💰 ${owed.map((id) => `${name(id)} ${money(cash.total[id])}`).join(' · ')}`);
  }
  if (banter.loserLine) lines.push('', banter.loserLine);
  lines.push('', `👉 ${link}`);
  return lines.join('\n');
}

export async function shareText(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

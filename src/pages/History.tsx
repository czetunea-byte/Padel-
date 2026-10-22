import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { fmtDate, medal, signed } from '../lib/format';
import { dayMoney, money } from '../lib/money';
import { dayResult, sortSessions } from '../lib/scoring';
import { dayShareText, shareText } from '../lib/share';
import { byId, leagueLink, type PageProps } from './types';

export function History({ store, leagueId, leagueName, players, sessions, onEdit }: PageProps & { onEdit: (id: string) => void }) {
  const pmap = byId(players);
  const [open, setOpen] = useState<string | null>(null);
  const list = sortSessions(sessions).reverse();

  if (!list.length) return <p className="muted center">Aún no hay jornadas registradas.</p>;

  const remove = async (id: string) => {
    if (confirm('¿Borrar esta jornada? No se puede deshacer.')) await store.deleteSession(leagueId, id);
  };

  return (
    <>
      {list.map((s, idx) => {
        const res = dayResult(s);
        const cash = dayMoney(s);
        const winners = res.filter((r) => r.place === 1);
        const isOpen = open === s.id;
        return (
          <section key={s.id} className="card history-item">
            <button className="history-head" onClick={() => setOpen(isOpen ? null : s.id)}>
              <span className="jornada">J{list.length - idx}</span>
              <span className="grow left">
                <span>{fmtDate(s.date)}</span>
                <span className="muted small">
                  🏆 {winners.map((w) => pmap[w.playerId]?.name).join(' & ')} · {winners[0]?.total} pts
                </span>
              </span>
              <span className="avatars-mini">
                {winners.map((w) => (
                  <Avatar key={w.playerId} player={pmap[w.playerId]} size={28} />
                ))}
              </span>
              <span className="chev">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="history-body">
                {s.matches.map((m, i) => (
                  <div key={i} className="score-line">
                    <span className={m.gamesA > m.gamesB ? 'won' : ''}>
                      {m.teamA.map((id) => pmap[id]?.name).join(' & ')}
                    </span>
                    <b>
                      {m.gamesA} – {m.gamesB}
                      {cash.bonuses.some((b) => b.matchIndex === i) && (
                        <span className="tag-mini">
                          {cash.bonuses.find((b) => b.matchIndex === i)!.kind === 'zapato' ? ' 👟' : ' 🔄'}
                        </span>
                      )}
                    </b>
                    <span className={m.gamesB > m.gamesA ? 'won' : ''}>
                      {m.teamB.map((id) => pmap[id]?.name).join(' & ')}
                    </span>
                  </div>
                ))}
                <ul className="day-list">
                  {res.map((r) => (
                    <li key={r.playerId}>
                      <span className="medal">{medal(r.place)}</span>
                      <span className="grow">{pmap[r.playerId]?.name}</span>
                      <span className="muted small">
                        {r.games}
                        {r.handicap ? ` ${signed(r.handicap)}` : ''}
                      </span>
                      <b className="total">{r.total}</b>
                      <span className={`cash small ${cash.total[r.playerId] > 0 ? 'pos' : cash.total[r.playerId] < 0 ? 'neg' : ''}`}>
                        {money(cash.total[r.playerId])}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="row">
                  <button
                    className="btn whatsapp"
                    onClick={() => shareText(dayShareText(s, players, leagueName, leagueLink(leagueId)))}
                  >
                    📲 Compartir
                  </button>
                  <button className="btn ghost" onClick={() => onEdit(s.id)}>
                    ✏️ Editar
                  </button>
                  <button className="btn danger" onClick={() => remove(s.id)}>
                    🗑️ Borrar
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

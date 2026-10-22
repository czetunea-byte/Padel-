import { useMemo } from 'react';
import { Avatar } from '../components/Avatar';
import type { Tab } from '../components/NavBar';
import { Podium } from '../components/Podium';
import { fmtLongDate, medal, signed } from '../lib/format';
import { dayResult, leaderboard, sortSessions } from '../lib/scoring';
import { byId, type PageProps } from './types';

export function Leaderboard({ players, sessions, go }: PageProps & { go: (t: Tab) => void }) {
  const ids = players.map((p) => p.id);
  const pmap = byId(players);
  const table = useMemo(() => leaderboard(sessions, ids), [sessions, ids.join()]);
  const last = sortSessions(sessions).at(-1);
  const lastRes = last ? dayResult(last) : [];

  if (!sessions.length) {
    return (
      <div className="empty">
        <div className="ball big">🎾</div>
        <h2>¡La liga empieza hoy!</h2>
        <p className="muted">Todavía no hay jornadas. Carga la primera y que empiece el pique.</p>
        <button className="btn primary" onClick={() => go('jornada')}>
          ➕ Cargar jornada
        </button>
      </div>
    );
  }

  const leader = table[0];
  const hot = table.filter((s) => s.currentStreak >= 2);

  return (
    <>
      <section className="card hero-card">
        <p className="eyebrow">Días ganados</p>
        <Podium
          entries={table.map((s) => ({
            player: pmap[s.playerId],
            place: s.rank,
            value: `${s.daysWon} ${s.daysWon === 1 ? 'día' : 'días'}`,
          }))}
        />
        <p className="tagline">
          {pmap[leader.playerId]?.emoji} <b>{pmap[leader.playerId]?.name}</b> manda en la pista
          {hot.length > 0 && (
            <>
              {' · '}
              {hot.map((h) => `🔥 ${pmap[h.playerId]?.name} lleva ${h.currentStreak} seguidas`).join(' · ')}
            </>
          )}
        </p>
      </section>

      <section className="card">
        <h2 className="card-title">Tabla general</h2>
        <table className="standings">
          <thead>
            <tr>
              <th>#</th>
              <th className="left">Jugador</th>
              <th title="Días ganados">🏆</th>
              <th title="Lugar promedio">Prom.</th>
              <th title="Medallas">🥇🥈🥉</th>
              <th title="Cuchara de madera (último)">🥄</th>
            </tr>
          </thead>
          <tbody>
            {table.map((s) => (
              <tr key={s.playerId} className={s.rank === 1 ? 'lead' : ''}>
                <td className="rank">{s.rank}</td>
                <td className="left">
                  <span className="who">
                    <Avatar player={pmap[s.playerId]} size={30} />
                    <span>
                      {pmap[s.playerId]?.name}
                      {s.currentStreak >= 2 && <span className="streak"> 🔥{s.currentStreak}</span>}
                    </span>
                  </span>
                </td>
                <td className="big">{s.daysWon}</td>
                <td>{s.played ? s.avgPlace.toFixed(1) : '–'}</td>
                <td className="small">
                  {s.placeCounts[0]}·{s.placeCounts[1]}·{s.placeCounts[2]}
                </td>
                <td>{s.spoons || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          {sessions.length} {sessions.length === 1 ? 'jornada jugada' : 'jornadas jugadas'} · desempate: más 2º lugares, luego
          mejor promedio.
        </p>
      </section>

      {last && (
        <section className="card">
          <h2 className="card-title">Última jornada</h2>
          <p className="muted small cap">{fmtLongDate(last.date)}</p>
          <ul className="day-list">
            {lastRes.map((r) => (
              <li key={r.playerId}>
                <span className="medal">{medal(r.place)}</span>
                <Avatar player={pmap[r.playerId]} size={28} />
                <span className="grow">{pmap[r.playerId]?.name}</span>
                <span className="muted small">
                  {r.games}
                  {r.handicap ? ` ${signed(r.handicap)}` : ''}
                </span>
                <b className="total">{r.total}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

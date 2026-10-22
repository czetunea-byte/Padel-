import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import type { Tab } from '../components/NavBar';
import { Podium } from '../components/Podium';
import { lastDayBanter, leaderBanter, nickname } from '../lib/banter';
import { fmtLongDate, medal, signed, today } from '../lib/format';
import { seasonOf } from '../lib/seasons';
import { dayResult, leaderboard, sortSessions } from '../lib/scoring';
import { byId, nameMap, type PageProps } from './types';

type View = 'temporada' | 'historico';

export function Leaderboard({ players, sessions: all, go }: PageProps & { go: (t: Tab, extra?: string) => void }) {
  const ids = players.map((p) => p.id);
  const pmap = byId(players);
  const season = seasonOf(today());
  const inSeason = useMemo(() => all.filter((s) => seasonOf(s.date).id === season.id), [all, season.id]);
  const [view, setView] = useState<View>(inSeason.length ? 'temporada' : 'historico');
  const sessions = view === 'temporada' ? inSeason : all;
  const table = useMemo(() => leaderboard(sessions, ids), [sessions, ids.join()]);
  const last = sortSessions(all).at(-1);
  const lastRes = last ? dayResult(last) : [];

  if (!all.length) {
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

  const names = nameMap(players);
  const seed = `${view}:${sessions.length}`;
  return (
    <>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={view === 'temporada'} onClick={() => setView('temporada')}>
          🗓️ {season.label}
        </button>
        <button role="tab" aria-selected={view === 'historico'} onClick={() => setView('historico')}>
          📚 Histórico
        </button>
      </div>
      {!sessions.length ? (
        <section className="card center">
          <p className="tagline">Arrancó la temporada {season.label} 🏁</p>
          <p className="muted small">Nadie ha ganado nada todavía. La tabla está en ceros y el pique al máximo.</p>
        </section>
      ) : (
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
        <p className="tagline">{leaderBanter(table, names, seed).text}</p>
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
              <tr key={s.playerId} className={`clickable ${s.rank === 1 ? 'lead' : ''}`} onClick={() => go('jugador', s.playerId)}>
                <td className="rank">{s.rank}</td>
                <td className="left">
                  <span className="who">
                    <Avatar player={pmap[s.playerId]} size={30} />
                    <span className="who-text">
                      <span>
                        {pmap[s.playerId]?.name}
                        {s.currentStreak >= 2 && <span className="streak"> 🔥{s.currentStreak}</span>}
                      </span>
                      <span className="nick">{nickname(s, table, seed).text}</span>
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
          {sessions.length} {sessions.length === 1 ? 'jornada jugada' : 'jornadas jugadas'}
          {view === 'temporada' ? ` en ${season.label}` : ' en total'} · desempate: más 2º lugares, luego mejor promedio.
          Toca a un jugador para ver su perfil.
        </p>
      </section>
      </>
      )}

      {last && (
        <section className="card">
          <h2 className="card-title">Última jornada</h2>
          <p className="muted small">{fmtLongDate(last.date)}</p>
          <p className="quip">{lastDayBanter(last, names).text}</p>
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

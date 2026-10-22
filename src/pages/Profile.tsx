import { useMemo } from 'react';
import {
  CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Avatar } from '../components/Avatar';
import type { Tab } from '../components/NavBar';
import { ACHIEVEMENTS, achievements } from '../lib/achievements';
import { nickname } from '../lib/banter';
import { fmtDate, signed, today } from '../lib/format';
import { lifetimeMoney, money } from '../lib/money';
import { dayResult, leaderboard, pairStats, positionHistory, rivalStats } from '../lib/scoring';
import { byId, type PageProps } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export function Profile({ players, sessions, playerId, go }: PageProps & {
  playerId?: string;
  go: (t: Tab, extra?: string) => void;
}) {
  const ids = players.map((p) => p.id);
  const pmap = byId(players);
  const me = playerId ? pmap[playerId] : undefined;
  const key = ids.join();
  const table = useMemo(() => leaderboard(sessions, ids), [sessions, key]);
  const unlocked = useMemo(() => achievements(sessions, ids, today()), [sessions, key]);
  const history = useMemo(() => positionHistory(sessions, ids), [sessions, key]);
  const life = useMemo(() => lifetimeMoney(sessions, ids), [sessions, key]);

  if (!me) return <p className="muted center">No encontré a ese jugador 🤔</p>;
  const st = table.find((s) => s.playerId === me.id)!;
  const played = sessions.filter((s) => s.playerIds.includes(me.id));
  const avgGames = played.length
    ? played.reduce((sum, s) => sum + (dayResult(s).find((r) => r.playerId === me.id)?.games ?? 0), 0) / played.length
    : 0;

  const partners = pairStats(sessions, ids)
    .filter((p) => p.pair.includes(me.id) && p.played)
    .map((p) => ({ ...p, partner: p.pair.find((id) => id !== me.id)! }));
  const bestPartner = partners[0];
  const rivals = rivalStats(sessions, me.id, ids).sort((a, b) => b.lost / (b.played || 1) - a.lost / (a.played || 1));
  const nemesis = rivals.find((r) => r.played && r.lost > r.won);
  const mine = unlocked[me.id] ?? {};

  const css = getComputedStyle(document.documentElement);
  const text = css.getPropertyValue('--muted').trim() || '#888';
  const grid = css.getPropertyValue('--line').trim() || '#ccc';

  return (
    <>
      <section className="card profile-head">
        <Avatar player={me} size={72} />
        <div>
          <h2>{me.name}</h2>
          <p className="muted">{played.length ? nickname(st, table, String(sessions.length)).text : 'Recién llegado 🐣'}</p>
          {me.handicap !== 0 && <span className="hcp on">hcp {signed(me.handicap)}</span>}
        </div>
      </section>

      <section className="grid-3">
        <Stat label="Días ganados" value={st.daysWon} />
        <Stat label="Lugar prom." value={st.played ? st.avgPlace.toFixed(1) : '–'} />
        <Stat label="Games / día" value={played.length ? avgGames.toFixed(1) : '–'} />
        <Stat label="Jornadas" value={st.played} />
        <Stat label="Mejor racha" value={`${st.bestStreak} 🔥`} />
        <Stat label="Dinero" value={money(life[me.id] ?? 0)} tone={life[me.id] > 0 ? 'pos' : life[me.id] < 0 ? 'neg' : ''} />
      </section>

      <section className="grid-2">
        <div className="card stat">
          <p className="eyebrow">💞 Mejor compañero</p>
          {bestPartner ? (
            <>
              <b>{pmap[bestPartner.partner]?.name}</b>
              <span className="muted small">
                {bestPartner.won}/{bestPartner.played} ganados juntos · {Math.round(bestPartner.winRate * 100)}%
              </span>
            </>
          ) : (
            <span className="muted small">Todavía nada</span>
          )}
        </div>
        <div className="card stat">
          <p className="eyebrow">😈 Némesis</p>
          {nemesis ? (
            <>
              <b>{pmap[nemesis.rivalId]?.name}</b>
              <span className="muted small">
                le ha perdido {nemesis.lost} de {nemesis.played}
              </span>
            </>
          ) : (
            <span className="muted small">Nadie lo tiene de hijo… todavía</span>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">⚔️ Contra cada rival</h2>
        <ul className="day-list">
          {rivals.map((r) => (
            <li key={r.rivalId} className="clickable" onClick={() => go('jugador', r.rivalId)}>
              <Avatar player={pmap[r.rivalId]} size={28} />
              <span className="grow">{pmap[r.rivalId]?.name}</span>
              <span className="muted small">
                {r.won}G · {r.lost}P
              </span>
              <b className="total">{r.played ? `${Math.round((r.won / r.played) * 100)}%` : '–'}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="card-title">🏅 Insignias</h2>
        <div className="badges">
          {ACHIEVEMENTS.map((a) => {
            const when = mine[a.id];
            return (
              <div key={a.id} className={`badge-item ${when ? 'got' : 'locked'} ${a.shame ? 'shame' : ''}`} title={a.desc}>
                <span className="badge-emoji">{when ? a.emoji : '🔒'}</span>
                <b>{a.name}</b>
                <span className="muted small">{when ? fmtDate(when) : a.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {history.length > 1 && (
        <section className="card">
          <h2 className="card-title">📈 Su lugar en la tabla</h2>
          <div className="chart small-chart">
            <Line
              data={{
                labels: history.map((_, i) => `J${i + 1}`),
                datasets: [
                  {
                    label: me.name,
                    data: history.map((h) => h.places[me.id]),
                    borderColor: me.color,
                    backgroundColor: me.color,
                    borderWidth: 3,
                    pointRadius: 3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    reverse: true,
                    min: 1,
                    max: Math.max(4, ids.length),
                    ticks: { stepSize: 1, color: text, callback: (v) => `${v}º` },
                    grid: { color: grid },
                  },
                  x: { ticks: { color: text, autoSkip: true, maxRotation: 0 }, grid: { display: false } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </section>
      )}

      <button className="btn ghost block" onClick={() => go('tabla')}>
        ← Volver a la tabla
      </button>
    </>
  );
}

function Stat({ label, value, tone = '' }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card mini-stat">
      <b className={`cash ${tone}`}>{value}</b>
      <span className="muted small">{label}</span>
    </div>
  );
}

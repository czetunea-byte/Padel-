import { useMemo } from 'react';
import {
  CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Avatar } from '../components/Avatar';
import { fmtDate, today } from '../lib/format';
import { seasonChampions } from '../lib/seasons';
import { leaderboard, pairStats, positionHistory, records } from '../lib/scoring';
import { byId, type PageProps } from './types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function Stats({ players, sessions }: PageProps) {
  const ids = players.map((p) => p.id);
  const pmap = byId(players);
  const key = ids.join();
  const history = useMemo(() => positionHistory(sessions, ids), [sessions, key]);
  const pairs = useMemo(() => pairStats(sessions, ids), [sessions, key]);
  const rec = useMemo(() => records(sessions), [sessions]);
  const table = useMemo(() => leaderboard(sessions, ids), [sessions, key]);
  const champs = useMemo(() => seasonChampions(sessions, ids, today()).reverse(), [sessions, key]);

  if (!sessions.length) return <p className="muted center">Las estadísticas aparecen después de la primera jornada.</p>;

  const css = getComputedStyle(document.documentElement);
  const text = css.getPropertyValue('--muted').trim() || '#888';
  const grid = css.getPropertyValue('--line').trim() || '#ccc';

  const data = {
    labels: history.map((h, i) => `J${i + 1} · ${fmtDate(h.date)}`),
    datasets: players.map((p) => ({
      label: `${p.emoji} ${p.name}`,
      data: history.map((h) => h.places[p.id]),
      borderColor: p.color,
      backgroundColor: p.color,
      borderWidth: 3,
      pointRadius: 4,
      tension: 0,
    })),
  };

  const best = pairs.find((p) => p.played);
  const worst = [...pairs].reverse().find((p) => p.played);
  const bestStreak = [...table].sort((a, b) => b.bestStreak - a.bestStreak)[0];
  const spoonKing = [...table].sort((a, b) => b.spoons - a.spoons)[0];
  const pairName = (pair: string[]) => pair.map((id) => pmap[id]?.name).join(' & ');

  return (
    <>
      <section className="card">
        <h2 className="card-title">Evolución en la tabla</h2>
        <div className="chart">
          <Line
            data={data}
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
                x: { ticks: { color: text, maxRotation: 0, autoSkip: true }, grid: { display: false } },
              },
              plugins: { legend: { position: 'bottom', labels: { color: text, usePointStyle: true } } },
            }}
          />
        </div>
      </section>

      <section className="grid-2">
        {best && (
          <div className="card stat">
            <p className="eyebrow">💞 Mejor pareja</p>
            <b>{pairName(best.pair)}</b>
            <span className="muted small">
              {best.won}/{best.played} ganados · {Math.round(best.winRate * 100)}%
            </span>
          </div>
        )}
        {worst && worst !== best && (
          <div className="card stat">
            <p className="eyebrow">💔 Pareja maldita</p>
            <b>{pairName(worst.pair)}</b>
            <span className="muted small">
              {worst.won}/{worst.played} ganados · {Math.round(worst.winRate * 100)}%
            </span>
          </div>
        )}
        {bestStreak?.bestStreak > 0 && (
          <div className="card stat">
            <p className="eyebrow">🔥 Mejor racha</p>
            <b>{pmap[bestStreak.playerId]?.name}</b>
            <span className="muted small">
              {bestStreak.bestStreak} {bestStreak.bestStreak === 1 ? 'día ganado' : 'días ganados seguidos'}
            </span>
          </div>
        )}
        {rec.bestDay && (
          <div className="card stat">
            <p className="eyebrow">💥 Récord en un día</p>
            <b>{pmap[rec.bestDay.playerId]?.name}</b>
            <span className="muted small">
              {rec.bestDay.total} pts · {fmtDate(rec.bestDay.date)}
            </span>
          </div>
        )}
        {rec.biggestWin && (
          <div className="card stat">
            <p className="eyebrow">🧹 Mayor paliza</p>
            <b>
              {rec.biggestWin.match.gamesA}–{rec.biggestWin.match.gamesB}
            </b>
            <span className="muted small">
              {pairName(rec.biggestWin.match.gamesA > rec.biggestWin.match.gamesB ? rec.biggestWin.match.teamA : rec.biggestWin.match.teamB)} ·{' '}
              {fmtDate(rec.biggestWin.date)}
            </span>
          </div>
        )}
        {spoonKing?.spoons > 0 && (
          <div className="card stat">
            <p className="eyebrow">🥄 Rey de la cuchara</p>
            <b>{pmap[spoonKing.playerId]?.name}</b>
            <span className="muted small">{spoonKing.spoons} veces último</span>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">🏛️ Salón de la fama</h2>
        <ul className="day-list">
          {champs.map((c) => (
            <li key={c.season.id}>
              <span className="medal">{c.finished ? '🏆' : '⏳'}</span>
              <span className="grow">
                <b>{c.season.label}</b>
                <span className="muted small"> · {c.played} jornadas</span>
              </span>
              <span className="muted small">{c.finished ? 'Campeón' : 'Va ganando'}</span>
              <b>{c.playerIds.map((id) => pmap[id]?.name).join(' y ')}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="card-title">Parejas</h2>
        <ul className="day-list">
          {pairs.map((p) => (
            <li key={p.pair.join()}>
              <span className="pair-avatars">
                {p.pair.map((id) => (
                  <Avatar key={id} player={pmap[id]} size={26} />
                ))}
              </span>
              <span className="grow">{pairName(p.pair)}</span>
              <span className="muted small">
                {p.won}/{p.played} · {p.gamesFor - p.gamesAgainst >= 0 ? '+' : ''}
                {p.gamesFor - p.gamesAgainst}
              </span>
              <b className="total">{p.played ? `${Math.round(p.winRate * 100)}%` : '–'}</b>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

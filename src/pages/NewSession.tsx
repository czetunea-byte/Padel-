import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Confetti } from '../components/Confetti';
import { Podium } from '../components/Podium';
import { Stepper } from '../components/Stepper';
import { signed, today } from '../lib/format';
import { dayResult, pairings } from '../lib/scoring';
import type { Match, Session } from '../lib/types';
import { byId, type PageProps } from './types';

const WIN_LINES = [
  '¡Qué partidazo! 🎉',
  '¡Bandeja, víbora y a casa! 🐍',
  '¡Por 3 metros! 🚀',
  '¡Al cristal y adentro! 🪟',
];

export function NewSession({ store, leagueId, players, sessions, editId, onDone }: PageProps & {
  editId?: string;
  onDone: () => void;
}) {
  const editing = sessions.find((s) => s.id === editId);
  const pmap = byId(players);
  const ids = editing?.playerIds ?? players.map((p) => p.id);

  const [date, setDate] = useState(editing?.date ?? today());
  const [matches, setMatches] = useState<Match[]>(
    () => editing?.matches ?? pairings(ids).map((p) => ({ ...p, gamesA: 0, gamesB: 0 })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Session | null>(null);

  const handicaps = useMemo(
    () => editing?.handicaps ?? Object.fromEntries(players.map((p) => [p.id, p.handicap])),
    [editing, players],
  );
  const draft: Session = { id: editId ?? 'draft', date, playerIds: ids, handicaps, matches, createdAt: 0 };
  const preview = dayResult(draft);
  const played = matches.some((m) => m.gamesA + m.gamesB > 0);

  if (players.length !== 4 && !editing) {
    return <p className="muted center">Hacen falta 4 jugadores para armar una jornada.</p>;
  }

  const update = (i: number, side: 'gamesA' | 'gamesB', v: number) =>
    setMatches(matches.map((m, j) => (j === i ? { ...m, [side]: v } : m)));

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await store.updateSession(leagueId, { ...editing, date, matches });
        onDone();
      } else {
        const s = { date, playerIds: ids, handicaps, matches, createdAt: Date.now() };
        const id = await store.addSession(leagueId, s);
        setSaved({ ...s, id });
      }
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    const res = dayResult(saved);
    const winners = res.filter((r) => r.place === 1).map((r) => pmap[r.playerId]?.name);
    return (
      <div className="celebrate">
        <Confetti />
        <h2>{WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)]}</h2>
        <p className="tagline">
          {winners.length > 1 ? `Empate arriba: ${winners.join(' y ')}` : `${winners[0]} se lleva el día`}
        </p>
        <div className="card">
          <Podium entries={res.map((r) => ({ player: pmap[r.playerId], place: r.place, value: `${r.total} pts` }))} />
          {res[3] && res[3].place > 1 && (
            <p className="muted center small">
              🥄 Cuchara de madera para {pmap[res[3].playerId]?.name} ({res[3].total} pts)
            </p>
          )}
        </div>
        <button className="btn primary block" onClick={onDone}>
          Ver la tabla 🏆
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">{editing ? 'Editar jornada' : 'Nueva jornada'}</h2>
        <label className="field">
          <span>Fecha</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </section>

      {matches.map((m, i) => (
        <section key={i} className="card match">
          <p className="eyebrow">Partido {i + 1}</p>
          <div className="match-grid">
            <TeamSide ids={m.teamA} pmap={pmap} won={m.gamesA > m.gamesB} />
            <span className="vs">vs</span>
            <TeamSide ids={m.teamB} pmap={pmap} won={m.gamesB > m.gamesA} />
            <Stepper value={m.gamesA} onChange={(v) => update(i, 'gamesA', v)} label={`games pareja A partido ${i + 1}`} />
            <span />
            <Stepper value={m.gamesB} onChange={(v) => update(i, 'gamesB', v)} label={`games pareja B partido ${i + 1}`} />
          </div>
        </section>
      ))}

      <section className="card">
        <h2 className="card-title">Así va el día</h2>
        <ul className="day-list">
          {preview.map((r) => (
            <li key={r.playerId}>
              <span className="rank">{played ? r.place : '·'}</span>
              <Avatar player={pmap[r.playerId]} size={28} />
              <span className="grow">{pmap[r.playerId]?.name}</span>
              <span className="muted small">
                {r.games} games{r.handicap ? ` ${signed(r.handicap)} hcp` : ''}
              </span>
              <b className="total">{r.total}</b>
            </li>
          ))}
        </ul>
        <button className="btn primary block" disabled={!played || saving} onClick={save}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar jornada ✅'}
        </button>
        {editing && (
          <button className="btn ghost block" onClick={onDone}>
            Cancelar
          </button>
        )}
      </section>
    </>
  );
}

function TeamSide({ ids, pmap, won }: { ids: string[]; pmap: ReturnType<typeof byId>; won: boolean }) {
  return (
    <div className={`team ${won ? 'won' : ''}`}>
      <div className="team-avatars">
        {ids.map((id) => (
          <Avatar key={id} player={pmap[id]} size={36} />
        ))}
      </div>
      <div className="team-names">{ids.map((id) => pmap[id]?.name).join(' & ')}</div>
    </div>
  );
}

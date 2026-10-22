import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Confetti } from '../components/Confetti';
import { Podium } from '../components/Podium';
import { Stepper } from '../components/Stepper';
import { achievements, newAchievements } from '../lib/achievements';
import { saveBanter } from '../lib/banter';
import { signed, today } from '../lib/format';
import { BONUS, bonusKind, dayMoney, isZapato, money } from '../lib/money';
import { dayResult, pairings } from '../lib/scoring';
import { dayShareText, shareText } from '../lib/share';
import type { Match, Session } from '../lib/types';
import { byId, leagueLink, nameMap, type PageProps } from './types';

export function NewSession({ store, leagueId, leagueName, players, sessions, editId, onDone }: PageProps & {
  editId?: string;
  onDone: () => void;
}) {
  const editing = sessions.find((s) => s.id === editId);
  const pmap = byId(players);
  const ids = editing?.playerIds ?? players.map((p) => p.id);

  const [date, setDate] = useState(editing?.date ?? today());
  const [matches, setMatches] = useState<Match[]>(
    () =>
      editing?.matches.map((m) => ({ ...m, remontada: m.remontada ?? false })) ??
      pairings(ids).map((p) => ({ ...p, gamesA: 0, gamesB: 0, remontada: false })),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Session | null>(null);

  const handicaps = useMemo(
    () => editing?.handicaps ?? Object.fromEntries(players.map((p) => [p.id, p.handicap])),
    [editing, players],
  );
  const draft: Session = { id: editId ?? 'draft', date, playerIds: ids, handicaps, matches, createdAt: 0 };
  const preview = dayResult(draft);
  const previewCash = dayMoney(draft).total;
  const played = matches.some((m) => m.gamesA + m.gamesB > 0);

  if (players.length !== 4 && !editing) {
    return <p className="muted center">Hacen falta 4 jugadores para armar una jornada.</p>;
  }

  const update = (i: number, patch: Partial<Match>) => setMatches(matches.map((m, j) => (j === i ? { ...m, ...patch } : m)));

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
    const banter = saveBanter(res, nameMap(players), saved.id);
    const cash = dayMoney(saved);
    const ids4 = players.map((p) => p.id);
    const others = sessions.filter((s) => s.id !== saved.id);
    const unlocked = newAchievements(achievements(others, ids4, today()), achievements([...others, saved], ids4, today()));
    return (
      <div className="celebrate">
        <Confetti />
        <h2>{banter.title}</h2>
        <p className="tagline">{banter.winnerLine}</p>
        <div className="card">
          <Podium entries={res.map((r) => ({ player: pmap[r.playerId], place: r.place, value: `${r.total} pts` }))} />
          {banter.loserLine && <p className="quip center">{banter.loserLine}</p>}
        </div>
        <div className="card">
          <h3 className="card-title">💰 El dinero de hoy</h3>
          <ul className="day-list">
            {res.map((r) => (
              <li key={r.playerId}>
                <Avatar player={pmap[r.playerId]} size={26} />
                <span className="grow left">{pmap[r.playerId]?.name}</span>
                <b className={`cash ${cash.total[r.playerId] > 0 ? 'pos' : cash.total[r.playerId] < 0 ? 'neg' : ''}`}>
                  {money(cash.total[r.playerId])}
                </b>
              </li>
            ))}
          </ul>
          {cash.bonuses.map((b) => (
            <p key={b.matchIndex} className="muted small">
              {b.kind === 'zapato' ? '👟 Zapato' : '🔄 Remontada'} en el partido {b.matchIndex + 1}: ${BONUS} por cabeza
            </p>
          ))}
        </div>
        {unlocked.length > 0 && (
          <div className="card">
            <h3 className="card-title">🔓 Insignias desbloqueadas</h3>
            <ul className="day-list">
              {unlocked.map((u) => (
                <li key={`${u.playerId}:${u.def.id}`} className={u.def.shame ? 'shame' : ''}>
                  <span className="medal">{u.def.emoji}</span>
                  <span className="grow left">
                    <b>{pmap[u.playerId]?.name}</b> · {u.def.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          className="btn whatsapp block"
          onClick={() => shareText(dayShareText(saved, players, leagueName, leagueLink(leagueId)))}
        >
          📲 Compartir en WhatsApp
        </button>
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
            <Stepper value={m.gamesA} onChange={(v) => update(i, { gamesA: v })} label={`games pareja A partido ${i + 1}`} />
            <span />
            <Stepper value={m.gamesB} onChange={(v) => update(i, { gamesB: v })} label={`games pareja B partido ${i + 1}`} />
          </div>
          <MatchExtras match={m} onRemontada={(remontada) => update(i, { remontada })} />
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
              {played && (
                <span className={`cash small ${previewCash[r.playerId] > 0 ? 'pos' : previewCash[r.playerId] < 0 ? 'neg' : ''}`}>
                  {money(previewCash[r.playerId])}
                </span>
              )}
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

function MatchExtras({ match, onRemontada }: { match: Match; onRemontada: (v: boolean) => void }) {
  const decided = match.gamesA !== match.gamesB;
  if (decided && isZapato(match)) {
    return <p className="match-tag zapato">👟 ¡Zapato! Cada perdedor paga ${BONUS}</p>;
  }
  return (
    <label className={`switch-row ${decided ? '' : 'disabled'}`}>
      <input
        type="checkbox"
        checked={Boolean(match.remontada) && decided}
        disabled={!decided}
        onChange={(e) => onRemontada(e.target.checked)}
      />
      <span className="switch" aria-hidden />
      <span>
        🔄 Remontada{bonusKind(match) === 'remontada' ? ` · cada perdedor paga $${BONUS}` : ''}
      </span>
    </label>
  );
}

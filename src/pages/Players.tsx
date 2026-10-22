import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Stepper } from '../components/Stepper';
import { PLAYER_COLORS, PLAYER_EMOJIS, signed } from '../lib/format';
import { HANDICAP_MIN_SESSIONS, HANDICAP_WINDOW, suggestHandicaps } from '../lib/handicap';
import type { League, Player } from '../lib/types';
import type { PageProps } from './types';

export function Players({ store, leagueId, league, players, sessions, onLeave }: PageProps & {
  league: League;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${location.origin}${location.pathname}#/liga/${leagueId}/tabla`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: league.name, text: `Únete a ${league.name} 🎾`, url: link });
        return;
      } catch {
        /* cancelado: probamos copiar */
      }
    }
    await navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <section className="card">
        <h2 className="card-title">Jugadores y handicap</h2>
        <p className="muted small">
          El handicap se suma una vez al total del día. Los cambios aplican a las próximas jornadas; las ya jugadas no se
          tocan.
        </p>
        {players.map((p) => (
          <PlayerEditor key={p.id} player={p} onSave={(np) => store.savePlayer(leagueId, np)} />
        ))}
      </section>

      <HandicapSuggestions
        players={players}
        sessions={sessions}
        onApply={(changes) => Promise.all(changes.map((p) => store.savePlayer(leagueId, p)))}
      />

      <section className="card">
        <h2 className="card-title">Invita al grupo</h2>
        {store.mode === 'local' ? (
          <p className="muted small">
            Estás en modo demo: los datos viven solo en este navegador. Configura Firebase (ver README) para que todos
            carguen desde su celular.
          </p>
        ) : (
          <p className="muted small">Comparte este enlace en el grupo: todos ven y cargan resultados en tiempo real.</p>
        )}
        <div className="row">
          <button className="btn primary" onClick={share}>
            {copied ? '¡Copiado! ✅' : '📤 Compartir enlace'}
          </button>
          <button className="btn ghost" onClick={onLeave}>
            Otra liga
          </button>
        </div>
      </section>
    </>
  );
}

function PlayerEditor({ player, onSave }: { player: Player; onSave: (p: Player) => void }) {
  const [draft, setDraft] = useState(player);
  const [open, setOpen] = useState(false);
  useEffect(() => setDraft(player), [player]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(player);

  return (
    <div className="player-edit">
      <button className="player-row" onClick={() => setOpen(!open)}>
        <Avatar player={draft} size={40} />
        <span className="grow left">{draft.name}</span>
        <span className={`hcp ${draft.handicap ? 'on' : ''}`}>hcp {signed(draft.handicap)}</span>
        <span className="chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="player-form">
          <label className="field">
            <span>Nombre</span>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <div className="field">
            <span>Handicap (puntos extra por día)</span>
            <Stepper
              value={draft.handicap}
              min={-20}
              max={20}
              label="handicap"
              onChange={(v) => setDraft({ ...draft, handicap: v })}
            />
          </div>
          <div className="field">
            <span>Emoji</span>
            <div className="picker">
              {PLAYER_EMOJIS.map((e) => (
                <button key={e} className={e === draft.emoji ? 'sel' : ''} onClick={() => setDraft({ ...draft, emoji: e })}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Color</span>
            <div className="picker">
              {PLAYER_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={c}
                  className={`swatch ${c === draft.color ? 'sel' : ''}`}
                  style={{ background: c }}
                  onClick={() => setDraft({ ...draft, color: c })}
                />
              ))}
            </div>
          </div>
          <button
            className="btn primary block"
            disabled={!dirty || !draft.name.trim()}
            onClick={() => {
              onSave({ ...draft, name: draft.name.trim() });
              setOpen(false);
            }}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

function HandicapSuggestions({ players, sessions, onApply }: {
  players: Player[];
  sessions: PageProps['sessions'];
  onApply: (changes: Player[]) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const sug = suggestHandicaps(sessions, players.map((p) => p.id));
  const changes = sug ? players.filter((p) => sug[p.id] && sug[p.id].suggested !== p.handicap) : [];

  return (
    <section className="card">
      <h2 className="card-title">🧮 Handicap sugerido</h2>
      {!sug ? (
        <p className="muted small">
          Después de {HANDICAP_MIN_SESSIONS} jornadas te sugiero handicaps para emparejar el pique.
        </p>
      ) : (
        <>
          <p className="muted small">
            La mitad de los games que a cada quien le faltan por día para alcanzar al mejor promedio (últimas{' '}
            {Math.min(HANDICAP_WINDOW, sessions.length)} jornadas, sin contar handicap).
          </p>
          <ul className="day-list">
            {players.map((p) => (
              <li key={p.id}>
                <span className="grow">
                  {p.emoji} {p.name}
                </span>
                <span className="muted small">{sug[p.id]?.avgGames.toFixed(1)} games/día</span>
                <b>
                  {signed(p.handicap)} → {signed(sug[p.id]?.suggested ?? 0)}
                </b>
              </li>
            ))}
          </ul>
          <button
            className="btn primary block"
            disabled={!changes.length || busy}
            onClick={async () => {
              if (!confirm('¿Aplicar los handicaps sugeridos? Cuentan desde la próxima jornada.')) return;
              setBusy(true);
              try {
                await onApply(changes.map((p) => ({ ...p, handicap: sug[p.id].suggested })));
              } finally {
                setBusy(false);
              }
            }}
          >
            {changes.length ? 'Aplicar sugerencia' : 'Ya están al día ✅'}
          </button>
        </>
      )}
    </section>
  );
}

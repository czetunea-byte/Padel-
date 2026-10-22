import { useState } from 'react';
import type { Store } from '../lib/store';
import { PLAYER_COLORS, PLAYER_EMOJIS } from '../lib/format';

export function Setup({ store, onCreated }: { store: Store; onCreated: (id: string) => void }) {
  const [name, setName] = useState('Padel con los Cuates');
  const [names, setNames] = useState(['Carlos', 'Mauri', 'Choforo', 'Marri']);
  const [busy, setBusy] = useState(false);
  const ready = name.trim() && names.every((n) => n.trim());

  const create = async () => {
    setBusy(true);
    try {
      const id = await store.createLeague(
        name.trim(),
        names.map((n, i) => ({
          name: n.trim(),
          emoji: PLAYER_EMOJIS[i],
          color: PLAYER_COLORS[i],
          handicap: 0,
          order: i,
        })),
      );
      onCreated(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page setup">
      <div className="hero">
        <div className="ball big">🎾</div>
        <h1>Padel Liga</h1>
        <p className="muted">3 partidos, todos contra todos. El que más games sume (con handicap) se lleva el día.</p>
      </div>
      <div className="card">
        <label className="field">
          <span>Nombre de la liga</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <p className="field-title">Los 4 cracks</p>
        {names.map((n, i) => (
          <label key={i} className="field inline">
            <span className="avatar" style={{ background: PLAYER_COLORS[i], width: 36, height: 36 }}>
              {PLAYER_EMOJIS[i]}
            </span>
            <input
              placeholder={`Jugador ${i + 1}`}
              value={n}
              onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </label>
        ))}
        <p className="muted small">Emojis, colores y handicaps se cambian después en ⚙️ Jugadores.</p>
        <button className="btn primary block" disabled={!ready || busy} onClick={create}>
          {busy ? 'Creando…' : '¡A jugar! 🚀'}
        </button>
      </div>
      {store.mode === 'local' && (
        <p className="muted small center">
          Modo demo: los datos se guardan solo en este navegador. Configura Firebase para compartir con el grupo.
        </p>
      )}
    </div>
  );
}

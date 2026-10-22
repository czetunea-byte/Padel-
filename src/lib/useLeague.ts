import { useEffect, useState } from 'react';
import { getStore, type Store } from './store';
import type { League, Player, Session } from './types';

export interface LeagueState {
  store: Store | null;
  league: League | null | undefined;
  players: Player[];
  sessions: Session[];
  error: string | null;
}

/** Suscripción en tiempo real a una liga (jugadores en el orden en que se crearon). */
export function useLeague(leagueId: string | null): LeagueState {
  const [store, setStore] = useState<Store | null>(null);
  const [league, setLeague] = useState<League | null | undefined>(undefined);
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStore().then(setStore, (e) => setError(String(e?.message ?? e)));
  }, []);

  useEffect(() => {
    if (!store || !leagueId) return;
    setLeague(undefined);
    const unsubs = [
      store.watchLeague(leagueId, setLeague),
      store.watchPlayers(leagueId, (ps) => setPlayers([...ps].sort((a, b) => a.order - b.order))),
      store.watchSessions(leagueId, setSessions),
    ];
    return () => unsubs.forEach((u) => u());
  }, [store, leagueId]);

  return { store, league, players, sessions, error };
}

import type { League, NewPlayer, NewSession, NewSettlement, Player, Session, Settlement } from './types';

export type Unsub = () => void;

/** Capa de datos: Firebase si está configurado, si no el navegador (modo demo). */
export interface Store {
  readonly mode: 'firebase' | 'local';
  createLeague(name: string, players: NewPlayer[]): Promise<string>;
  watchLeague(id: string, cb: (l: League | null) => void): Unsub;
  watchPlayers(id: string, cb: (p: Player[]) => void): Unsub;
  watchSessions(id: string, cb: (s: Session[]) => void): Unsub;
  watchSettlements(id: string, cb: (s: Settlement[]) => void): Unsub;
  savePlayer(leagueId: string, p: Player): Promise<void>;
  addSession(leagueId: string, s: NewSession): Promise<string>;
  updateSession(leagueId: string, s: Session): Promise<void>;
  deleteSession(leagueId: string, id: string): Promise<void>;
  addSettlement(leagueId: string, s: NewSettlement): Promise<string>;
}

export const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID,
);

let storePromise: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  storePromise ??= firebaseConfigured
    ? import('./firebaseStore').then((m) => m.createFirebaseStore())
    : import('./localStore').then((m) => m.createLocalStore());
  return storePromise;
}

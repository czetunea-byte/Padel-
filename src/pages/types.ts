import type { Store } from '../lib/store';
import type { Player, Session, Settlement } from '../lib/types';

export interface PageProps {
  store: Store;
  leagueId: string;
  players: Player[];
  sessions: Session[];
  settlements: Settlement[];
  leagueName: string;
}

export const nameMap = (players: Player[]) => Object.fromEntries(players.map((p) => [p.id, p.name]));

/** Enlace a la liga para compartir (siempre a la tabla). */
export const leagueLink = (leagueId: string) => `${location.origin}${location.pathname}#/liga/${leagueId}/tabla`;

export const byId = (players: Player[]) => Object.fromEntries(players.map((p) => [p.id, p]));

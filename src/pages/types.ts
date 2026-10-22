import type { Store } from '../lib/store';
import type { Player, Session } from '../lib/types';

export interface PageProps {
  store: Store;
  leagueId: string;
  players: Player[];
  sessions: Session[];
}

export const byId = (players: Player[]) => Object.fromEntries(players.map((p) => [p.id, p]));

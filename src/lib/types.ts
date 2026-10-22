export interface League {
  id: string;
  name: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
  handicap: number;
  /** posición en la lista (orden de creación) */
  order: number;
}

export type Team = [string, string];

export interface Match {
  teamA: Team;
  teamB: Team;
  gamesA: number;
  gamesB: number;
  /** la pareja ganadora venía perdiendo (se marca a mano) */
  remontada?: boolean;
}

export interface Session {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  playerIds: string[];
  /** Handicap de cada jugador congelado el día de la jornada */
  handicaps: Record<string, number>;
  matches: Match[];
  createdAt: number;
}

/** Registro de cuando el grupo saldó cuentas: foto de lo que se pagó. */
export interface Settlement {
  id: string;
  createdAt: number;
  balances: Record<string, number>;
}

export type NewSession = Omit<Session, 'id'>;
export type NewSettlement = Omit<Settlement, 'id'>;
export type NewPlayer = Omit<Player, 'id'>;

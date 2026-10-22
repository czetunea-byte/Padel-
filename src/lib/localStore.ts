import type { League, Player, Session } from './types';
import type { Store } from './store';

interface LeagueData {
  league: League;
  players: Player[];
  sessions: Session[];
}

const KEY = 'padel-liga:demo';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function load(): Record<string, LeagueData> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function createLocalStore(): Store {
  let db = load();
  const listeners = new Set<() => void>();
  const commit = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* sin almacenamiento: seguimos en memoria */
    }
    listeners.forEach((l) => l());
  };
  const watch = <T,>(pick: () => T, cb: (v: T) => void) => {
    const fn = () => cb(pick());
    listeners.add(fn);
    queueMicrotask(fn);
    return () => {
      listeners.delete(fn);
    };
  };
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      db = load();
      listeners.forEach((l) => l());
    }
  });

  return {
    mode: 'local',
    async createLeague(name, players) {
      const id = uid();
      db[id] = {
        league: { id, name, createdAt: Date.now() },
        players: players.map((p) => ({ ...p, id: uid() })),
        sessions: [],
      };
      commit();
      return id;
    },
    watchLeague: (id, cb) => watch(() => db[id]?.league ?? null, cb),
    watchPlayers: (id, cb) => watch(() => [...(db[id]?.players ?? [])], cb),
    watchSessions: (id, cb) => watch(() => [...(db[id]?.sessions ?? [])], cb),
    async savePlayer(leagueId, p) {
      const d = db[leagueId];
      d.players = d.players.map((x) => (x.id === p.id ? p : x));
      commit();
    },
    async addSession(leagueId, s) {
      const id = uid();
      db[leagueId].sessions.push({ ...s, id });
      commit();
      return id;
    },
    async updateSession(leagueId, s) {
      const d = db[leagueId];
      d.sessions = d.sessions.map((x) => (x.id === s.id ? s : x));
      commit();
    },
    async deleteSession(leagueId, id) {
      const d = db[leagueId];
      d.sessions = d.sessions.filter((x) => x.id !== id);
      commit();
    },
  };
}

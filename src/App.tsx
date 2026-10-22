import { useCallback, useEffect, useState } from 'react';
import { NavBar, type Tab } from './components/NavBar';
import { useLeague } from './lib/useLeague';
import { Setup } from './pages/Setup';
import { Leaderboard } from './pages/Leaderboard';
import { NewSession } from './pages/NewSession';
import { History } from './pages/History';
import { Stats } from './pages/Stats';
import { Players } from './pages/Players';
import { Money } from './pages/Money';
import { Profile } from './pages/Profile';

const LAST_KEY = 'padel-liga:last';
const TABS: Tab[] = ['tabla', 'jornada', 'historial', 'cuentas', 'stats', 'jugadores', 'jugador'];

interface Route {
  leagueId: string | null;
  tab: Tab;
  editId?: string;
}

/** Rutas: #/liga/<id>/<tab>[/<sessionId|playerId>] */
function parseHash(): Route {
  const [, kind, id, tab, extra] = location.hash.replace(/^#/, '').split('/');
  if (kind === 'liga' && id) {
    return { leagueId: id, tab: TABS.includes(tab as Tab) ? (tab as Tab) : 'tabla', editId: extra };
  }
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    /* sin almacenamiento */
  }
  return { leagueId: last, tab: 'tabla' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const { store, league, players, sessions, settlements, error } = useLeague(route.leagueId);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!route.leagueId) return;
    try {
      localStorage.setItem(LAST_KEY, route.leagueId);
    } catch {
      /* sin almacenamiento */
    }
  }, [route.leagueId]);

  const go = useCallback(
    (tab: Tab, extra?: string) => {
      if (!route.leagueId) return;
      location.hash = `/liga/${route.leagueId}/${tab}${extra ? `/${extra}` : ''}`;
      window.scrollTo({ top: 0 });
    },
    [route.leagueId],
  );

  const forget = () => {
    try {
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* sin almacenamiento */
    }
    location.hash = '';
    setRoute({ leagueId: null, tab: 'tabla' });
  };

  if (error) return <Splash text={`No se pudo conectar 😕 ${error}`} />;
  if (!store) return <Splash text="Calentando la pista…" />;

  if (!route.leagueId) {
    return <Setup store={store} onCreated={(id) => (location.hash = `/liga/${id}/tabla`)} />;
  }
  if (league === undefined) return <Splash text="Cargando la liga…" />;
  if (league === null) {
    return (
      <div className="page center">
        <h2>Liga no encontrada 🤔</h2>
        <p className="muted">Revisa el enlace o crea una nueva.</p>
        <button className="btn primary" onClick={forget}>
          Crear liga nueva
        </button>
      </div>
    );
  }

  const common = { store, leagueId: league.id, leagueName: league.name, players, sessions, settlements };
  return (
    <div className="app">
      <header className="topbar">
        <span className="logo">🎾</span>
        <h1>{league.name}</h1>
        {store.mode === 'local' && <span className="badge">demo</span>}
        <button
          className={`icon-btn ${route.tab === 'jugadores' ? 'active' : ''}`}
          aria-label="Jugadores y ajustes"
          onClick={() => go('jugadores')}
        >
          ⚙️
        </button>
      </header>
      <main className="page">
        {route.tab === 'tabla' && <Leaderboard {...common} go={go} />}
        {route.tab === 'cuentas' && <Money {...common} />}
        {route.tab === 'jugador' && <Profile {...common} playerId={route.editId} go={go} />}
        {route.tab === 'jornada' && (
          <NewSession key={route.editId ?? 'new'} {...common} editId={route.editId} onDone={() => go('tabla')} />
        )}
        {route.tab === 'historial' && <History {...common} onEdit={(id) => go('jornada', id)} />}
        {route.tab === 'stats' && <Stats {...common} />}
        {route.tab === 'jugadores' && <Players {...common} league={league} onLeave={forget} />}
      </main>
      <NavBar tab={route.tab} go={(t) => go(t)} />
    </div>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <div className="splash">
      <div className="ball">🎾</div>
      <p>{text}</p>
    </div>
  );
}

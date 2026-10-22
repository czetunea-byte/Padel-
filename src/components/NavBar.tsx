export type Tab = 'tabla' | 'jornada' | 'historial' | 'stats' | 'jugadores';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'tabla', icon: '🏆', label: 'Tabla' },
  { id: 'historial', icon: '📜', label: 'Historial' },
  { id: 'jornada', icon: '➕', label: 'Jornada' },
  { id: 'stats', icon: '📈', label: 'Stats' },
  { id: 'jugadores', icon: '⚙️', label: 'Jugadores' },
];

export function NavBar({ tab, go }: { tab: Tab; go: (t: Tab) => void }) {
  return (
    <nav className="navbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn ${t.id === tab ? 'active' : ''} ${t.id === 'jornada' ? 'nav-main' : ''}`}
          onClick={() => go(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

import type { Player } from '../lib/types';
import { Avatar } from './Avatar';

export interface PodiumEntry {
  player?: Player;
  place: number;
  value: string;
}

/** Podio 2-1-3: el primero al centro y más alto. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  const top = entries.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return (
    <div className="podium">
      {order.map((e) => (
        <div key={e.player?.id} className={`podium-col place-${Math.min(e.place, 3)}`}>
          {e.place === 1 && <div className="crown">👑</div>}
          <Avatar player={e.player} size={e.place === 1 ? 64 : 48} />
          <div className="podium-name">{e.player?.name}</div>
          <div className="podium-value">{e.value}</div>
          <div className="podium-block">{e.place}</div>
        </div>
      ))}
    </div>
  );
}

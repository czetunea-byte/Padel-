import type { Player } from '../lib/types';

export function Avatar({ player, size = 40 }: { player?: Player; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.55, background: player?.color ?? '#888' }}
      title={player?.name}
    >
      {player?.emoji ?? '?'}
    </span>
  );
}

export function PlayerChip({ player }: { player?: Player }) {
  return (
    <span className="chip">
      <Avatar player={player} size={24} />
      <span>{player?.name ?? '—'}</span>
    </span>
  );
}

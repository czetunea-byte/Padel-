import { useMemo } from 'react';

const BITS = ['🎾', '🎉', '✨', '🏆', '🔥', '⭐'];

export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.6,
        bit: BITS[i % BITS.length],
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
        >
          {p.bit}
        </span>
      ))}
    </div>
  );
}

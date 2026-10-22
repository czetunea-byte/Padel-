interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: Props) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="stepper">
      <button type="button" aria-label={`Restar ${label ?? ''}`} onClick={() => set(value - 1)} disabled={value <= min}>
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        onFocus={(e) => e.target.select()}
        onChange={(e) => set(Number(e.target.value) || 0)}
      />
      <button type="button" aria-label={`Sumar ${label ?? ''}`} onClick={() => set(value + 1)} disabled={value >= max}>
        +
      </button>
    </div>
  );
}

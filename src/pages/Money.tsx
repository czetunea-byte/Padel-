import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { debtBanter } from '../lib/banter';
import { dateOf, fmtDate } from '../lib/format';
import { BONUS, PRIZES, balances, lifetimeMoney, money, settleUp } from '../lib/money';
import { byId, nameMap, type PageProps } from './types';

export function Money({ store, leagueId, players, sessions, settlements }: PageProps) {
  const ids = players.map((p) => p.id);
  const pmap = byId(players);
  const bal = useMemo(() => balances(sessions, settlements, ids), [sessions, settlements, ids.join()]);
  const life = useMemo(() => lifetimeMoney(sessions, ids), [sessions, ids.join()]);
  const transfers = settleUp(bal);
  const lastSettle = Math.max(0, ...settlements.map((s) => s.createdAt));
  const pending = sessions.filter((s) => s.createdAt > lastSettle).length;
  const [saving, setSaving] = useState(false);
  const order = [...ids].sort((a, b) => bal[b] - bal[a]);

  const settle = async () => {
    if (!confirm('¿Ya se pagaron todas las deudas? Los saldos regresan a $0.')) return;
    setSaving(true);
    try {
      await store.addSettlement(leagueId, { createdAt: Date.now(), balances: bal });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className="card">
        <h2 className="card-title">💰 Cuentas pendientes</h2>
        <p className="muted small">
          {pending
            ? `${pending} ${pending === 1 ? 'jornada' : 'jornadas'} desde la última vez que saldaron.`
            : 'Todo saldado. A jugar para que haya qué cobrar 😈'}
        </p>
        <ul className="day-list">
          {order.map((id) => (
            <li key={id}>
              <Avatar player={pmap[id]} size={30} />
              <span className="grow">{pmap[id]?.name}</span>
              <b className={`total cash ${bal[id] > 0 ? 'pos' : bal[id] < 0 ? 'neg' : ''}`}>{money(bal[id])}</b>
            </li>
          ))}
        </ul>
        <p className="quip">{debtBanter(bal, nameMap(players), String(pending), (n) => `$${n.toLocaleString('es-MX')}`)}</p>

        {transfers.length > 0 && (
          <>
            <p className="eyebrow">Quién le paga a quién</p>
            <ul className="day-list">
              {transfers.map((t, i) => (
                <li key={i}>
                  <Avatar player={pmap[t.from]} size={26} />
                  <span className="grow">
                    {pmap[t.from]?.name} → {pmap[t.to]?.name}
                  </span>
                  <b>${t.amount.toLocaleString('es-MX')}</b>
                  <Avatar player={pmap[t.to]} size={26} />
                </li>
              ))}
            </ul>
            <button className="btn primary block" disabled={saving} onClick={settle}>
              Ya pagamos ✅
            </button>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">📚 Balance histórico</h2>
        <ul className="day-list">
          {[...ids].sort((a, b) => life[b] - life[a]).map((id) => (
            <li key={id}>
              <Avatar player={pmap[id]} size={26} />
              <span className="grow">{pmap[id]?.name}</span>
              <b className={`cash ${life[id] > 0 ? 'pos' : life[id] < 0 ? 'neg' : ''}`}>{money(life[id])}</b>
            </li>
          ))}
        </ul>
      </section>

      {settlements.length > 0 && (
        <section className="card">
          <h2 className="card-title">🧾 Veces que saldaron</h2>
          <ul className="day-list">
            {[...settlements]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((s) => {
                const moved = Object.values(s.balances).filter((v) => v > 0).reduce((a, b) => a + b, 0);
                return (
                  <li key={s.id}>
                    <span className="grow">{fmtDate(dateOf(s.createdAt))}</span>
                    <span className="muted small">${moved.toLocaleString('es-MX')} cambiaron de manos</span>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">📜 Las reglas</h2>
        <ul className="rules">
          <li>
            🥇 El 1º del día cobra <b>${PRIZES[0]}</b>: el 3º paga <b>${-PRIZES[2]}</b> y el 4º paga <b>${-PRIZES[3]}</b>. El 2º
            ni paga ni cobra.
          </li>
          <li>🤝 Si hay empate, el dinero de esos lugares se suma y se reparte entre los empatados.</li>
          <li>
            👟 <b>Zapato</b> (la pareja perdedora no hace ni un game) o 🔄 <b>remontada</b>: cada perdedor le paga{' '}
            <b>${BONUS}</b> a un ganador.
          </li>
        </ul>
      </section>
    </>
  );
}

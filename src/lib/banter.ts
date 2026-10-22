import { dayResult, type DayLine, type Standing } from './scoring';
import type { Session } from './types';

/** Frases para echar carrilla. Se elige siempre la misma para la misma entrada (seed). */

type Names = Record<string, string | undefined>;
type Vars = Record<string, string | number>;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

const pick = (list: string[], seed: string) => list[hash(seed) % list.length];
const fill = (tpl: string, vars: Vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
const joinNames = (ids: string[], names: Names) => ids.map((id) => names[id] ?? '¿?').join(' y ');

const SAVE = {
  title: {
    normal: ['¡Se los llevó de corbata! 👔', '¡Qué chingonería de jornada! 🔥', '¡Ya se armó! 🎉', '¡Puro nivel, cero miedo! 💪'],
    paliza: ['¡Madriza histórica! 🥊', '¡Eso no fue partido, fue bullying! 🧹', '¡Los dejó como trapeador! 🧽'],
    panzazo: ['¡De panzazo, pero cuenta! 😅', '¡Por un pelito de rana calva! 🐸'],
    empate: ['¡Empate! Aquí nadie se raja 🤝', '¡Ni pa’ uno ni pa’ otro! ⚖️'],
    handicap: ['¡El handicap hizo la chamba! 🧾', '¡Ganó con ayudita, pero ganó! 🩼'],
  },
  winner: {
    normal: [
      '{name} se lleva el día con {pts} pts y ya anda bien crecidito 😎',
      '{name} ganó con {pts} pts. Ya pueden irle pagando las chelas 🍺',
      '{name} les dio una clase gratis: {pts} pts 🎓',
    ],
    paliza: [
      '{name} les puso una madriza: {pts} pts y les sacó {gap} 🥊',
      '{name} sacó {gap} de ventaja. Llévenle flores a los demás 💐',
    ],
    panzazo: [
      '{name} lo sacó con {pts} pts, de puritita suerte. Ni presuma 😏',
      '{name} ganó por un pelo con {pts} pts. Ese suertudo ni se baña 🍀',
    ],
    empate: [
      '{name} empatan con {pts} pts. Luego no se anden peleando 🤼',
      '{name} se reparten el trono con {pts} pts. Qué bonita amistad 🥹',
    ],
    handicap: [
      'Sin el handicap no eras nadie, {name} 🧾 ({pts} pts)',
      '{name} ganó con ayudita del handicap. Ahí la llevas, mi rey 🩼',
    ],
  },
  loser: [
    '{name}, la cuchara ya tiene tu nombre grabado 🥄',
    '{name}, ¿viniste a jugar o a echar porra? 📣',
    '{name} quedó último con {pts}. Ánimo, campeón… del sótano 🪜',
    '{name}, ¿te pagaron por dejarte? 💸',
    '{name}, la raqueta no es de adorno, eh 🎾',
  ],
  losers: ['{name} se reparten la cuchara 🥄. Por lo menos no lloran solos', '{name}, empatados en el sótano. Qué oso 🙈'],
};

export type SaveKind = keyof typeof SAVE.title;

export interface SaveBanter {
  kind: SaveKind;
  title: string;
  winnerLine: string;
  loserLine: string | null;
}

/** ¿El ganador lo es gracias al handicap? (sin handicap habría ganado alguien más) */
function handicapDecided(res: DayLine[]): boolean {
  const winners = res.filter((r) => r.place === 1);
  if (winners.length !== 1 || winners[0].handicap <= 0) return false;
  return res.some((r) => r !== winners[0] && r.games > winners[0].games);
}

export function saveBanter(res: DayLine[], names: Names, seed: string): SaveBanter {
  const winners = res.filter((r) => r.place === 1);
  const rest = res.filter((r) => r.place !== 1);
  const top = winners[0];
  const gap = rest.length ? top.total - rest[0].total : 0;

  const kind: SaveKind =
    winners.length > 1 ? 'empate'
    : handicapDecided(res) ? 'handicap'
    : gap >= 8 ? 'paliza'
    : gap <= 1 ? 'panzazo'
    : 'normal';

  const lastPlace = Math.max(...res.map((r) => r.place));
  const losers = lastPlace > 1 ? res.filter((r) => r.place === lastPlace) : [];
  const vars = { name: joinNames(winners.map((w) => w.playerId), names), pts: top.total, gap };

  return {
    kind,
    title: pick(SAVE.title[kind], `${seed}:t`),
    winnerLine: fill(pick(SAVE.winner[kind], `${seed}:w`), vars),
    loserLine: losers.length
      ? fill(pick(losers.length > 1 ? SAVE.losers : SAVE.loser, `${seed}:l`), {
          name: joinNames(losers.map((l) => l.playerId), names),
          pts: losers[0].total,
        })
      : null,
  };
}

const LEADER = {
  empate: ['{name} empatados arriba: aquí nadie es rey, puro aspirante 🤺', 'Arriba andan {name}, sacándose los ojos 👀'],
  racha: ['{name} lleva {n} seguidas… ¿alguien lo para o qué? 🔥', '{name} ya ni suda: {n} días ganados al hilo 🥵'],
  sobrado: ['{name} es el mero mero de la pista 👑', '{name} va sobrado. Los demás juegan por el segundo lugar 🥈'],
  cerrado: ['{name} va arriba, pero con el Jesús en la boca 😬', '{name} manda… por ahora. {second} le respira en la nuca 👀'],
  enBlanco: ['{last} sigue en blanco 🫠', '{last}, ¿y tus días ganados? Bien, gracias 🦗'],
};

export type LeaderKind = 'empate' | 'racha' | 'sobrado' | 'cerrado';

export function leaderBanter(table: Standing[], names: Names, seed: string): { kind: LeaderKind; text: string } {
  const leaders = table.filter((s) => s.rank === 1);
  const second = table.find((s) => s.rank !== 1);
  const lead = leaders[0];
  const gap = second ? lead.daysWon - second.daysWon : 0;
  const kind: LeaderKind =
    leaders.length > 1 ? 'empate' : lead.currentStreak >= 3 ? 'racha' : gap >= 3 ? 'sobrado' : 'cerrado';

  let text = fill(pick(LEADER[kind], `${seed}:L`), {
    name: joinNames(leaders.map((l) => l.playerId), names),
    n: lead.currentStreak,
    second: second ? names[second.playerId] ?? '' : '',
  });
  const last = table.at(-1);
  if (last && last.daysWon === 0 && last.played >= 3 && last.rank !== 1) {
    text += ` · ${fill(pick(LEADER.enBlanco, `${seed}:B`), { last: names[last.playerId] ?? '' })}`;
  }
  return { kind, text };
}

const NICKS = {
  patron: ['El Patrón 👑', 'El mero mero 👑'],
  racha: ['Imparable 🔥', 'Anda prendido 🔥'],
  cuchara: ['Coleccionista de cucharas 🥄', 'Rey del sótano 🥄'],
  blanco: ['Sigue participando 🎟️', 'Viene de turista 🧳'],
  subcampeon: ['Eterno subcampeón 🥈', 'Casi casi 🥈'],
  resto: ['Ahí la lleva 🐢', 'Relleno de lujo 🎾', 'Ni fu ni fa 😐'],
};

export type NickKind = keyof typeof NICKS;

/** Apodo de cada jugador según cómo le va en la tabla. */
export function nickname(st: Standing, table: Standing[], seed: string): { kind: NickKind; text: string } {
  const maxSpoons = Math.max(...table.map((s) => s.spoons));
  const maxSeconds = Math.max(...table.map((s) => s.placeCounts[1]));
  const kind: NickKind =
    st.rank === 1 && st.daysWon > 0 ? 'patron'
    : st.currentStreak >= 2 ? 'racha'
    : st.played > 0 && st.daysWon === 0 ? 'blanco'
    : st.spoons > 0 && st.spoons === maxSpoons ? 'cuchara'
    : st.placeCounts[1] > 0 && st.placeCounts[1] === maxSeconds ? 'subcampeon'
    : 'resto';
  return { kind, text: pick(NICKS[kind], `${seed}:${st.playerId}`) };
}

const LAST_DAY = {
  paliza: [
    '{a}–{b} a {pair}. Eso fue bullying, alguien llame a Derechos Humanos 🧹',
    '{pair} se comieron un {a}–{b}. Ya ni la amuelan 🫠',
  ],
  empate: ['Día de empate arriba. Muy bonito todo, pero alguien tenía que ganar 🙄'],
  cerrado: ['Se definió por {gap}. Día de infarto 💓', 'Cerradísimo: {gap} de diferencia. Nadie durmió esa noche 😵'],
  normal: ['{winner} ganó y {last} se llevó la cuchara. Así es esto 🤷', '{winner} se lució; {last} mejor ni hable 🤐'],
};

export type LastDayKind = keyof typeof LAST_DAY;

export function lastDayBanter(session: Session, names: Names): { kind: LastDayKind; text: string } {
  const res = dayResult(session);
  const winners = res.filter((r) => r.place === 1);
  const rest = res.filter((r) => r.place !== 1);
  const gap = rest.length ? winners[0].total - rest[0].total : 0;
  const worst = [...session.matches].sort((x, y) => Math.abs(y.gamesA - y.gamesB) - Math.abs(x.gamesA - x.gamesB))[0];
  const margin = worst ? Math.abs(worst.gamesA - worst.gamesB) : 0;

  let kind: LastDayKind;
  let vars: Vars = {};
  if (worst && margin >= 5) {
    kind = 'paliza';
    const aWon = worst.gamesA > worst.gamesB;
    vars = {
      a: Math.max(worst.gamesA, worst.gamesB),
      b: Math.min(worst.gamesA, worst.gamesB),
      pair: joinNames(aWon ? worst.teamB : worst.teamA, names),
    };
  } else if (winners.length > 1) {
    kind = 'empate';
  } else if (gap <= 2) {
    kind = 'cerrado';
    vars = { gap: gap === 1 ? '1 punto' : gap === 0 ? 'partidos ganados' : `${gap} puntos` };
  } else {
    kind = 'normal';
    vars = { winner: names[winners[0].playerId] ?? '', last: names[res[res.length - 1].playerId] ?? '' };
  }
  return { kind, text: fill(pick(LAST_DAY[kind], `${session.id}:D`), vars) };
}

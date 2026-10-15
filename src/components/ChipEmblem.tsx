import type { CSSProperties } from 'react';
import { revsiliconLogoUrl } from '../assets';

const VIEW = 760;
const C = VIEW / 2;
/** Half the package body. */
const HALF = 128;
const PINS = 12;
const PIN_INSET = 26;
const PIN_LENGTH = 16;
/** Straight run out of each pin before the 45 degree fan-out. */
const REACH = 34;

type Lead = {
  readonly pin: string;
  readonly path: string;
  readonly pulse: boolean;
  readonly delay: number;
  readonly duration: number;
};

/** Rotates a top-side point a quarter turn per side, clockwise around the center. */
function place(side: number, x: number, y: number): readonly [number, number] {
  const turns = [[x, y], [-y, x], [-x, -y], [y, -x]] as const;
  const [px, py] = turns[side] ?? turns[0];
  return [C + px, C + py];
}

const fmt = ([x, y]: readonly [number, number]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/**
 * Leads fan out from all four sides: straight off the pin, one 45 degree jog
 * proportional to the pin's offset, then straight to the edge. Offsets grow
 * monotonically, so no two leads ever cross.
 */
const LEADS: readonly Lead[] = Array.from({ length: PINS * 4 }, (_, index) => {
  const side = Math.floor(index / PINS);
  const pin = index % PINS;
  const pitch = (HALF * 2 - PIN_INSET * 2) / (PINS - 1);
  const along = -HALF + PIN_INSET + pin * pitch;
  const spread = along * 0.85;
  const bodyEdge = -HALF;
  const pinTip = -(HALF + PIN_LENGTH);
  const bend = pinTip - REACH;
  const points = [
    place(side, along, pinTip),
    place(side, along, bend),
    place(side, along + spread, bend - Math.abs(spread)),
    place(side, along + spread, -(C + 40)),
  ];
  return {
    pin: `M${fmt(place(side, along, bodyEdge))}L${fmt(place(side, along, pinTip))}`,
    path: `M${points.map(fmt).join('L')}`,
    pulse: (pin + side * 2) % 3 === 0,
    delay: ((pin * 7 + side * 5) % 13) * 0.37,
    duration: 3.4 + ((pin * 3 + side) % 5) * 0.45,
  };
});

export function ChipEmblem() {
  const body = C - HALF;
  const size = HALF * 2;

  return (
    <svg className="chip-emblem" viewBox={`0 0 ${VIEW} ${VIEW}`} aria-hidden="true">
      <defs>
        <radialGradient id="emblem-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#7a0a16" stopOpacity="0.7" />
          <stop offset="1" stopColor="#7a0a16" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emblem-scan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e3e5" stopOpacity="0" />
          <stop offset="0.8" stopColor="#f6e3e5" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id="emblem-die">
          <rect x={body} y={body} width={size} height={size} rx="14" />
        </clipPath>
      </defs>

      <circle cx={C} cy={C} r="250" fill="url(#emblem-core)" className="emblem-halo" />

      <g className="emblem-leads">
        {LEADS.map((lead) => <path key={lead.path} d={lead.path} />)}
      </g>
      <g className="emblem-pulses">
        {LEADS.filter((lead) => lead.pulse).map((lead) => (
          <path
            key={lead.path}
            d={lead.path}
            pathLength="100"
            style={{ '--delay': `${lead.delay}s`, '--duration': `${lead.duration}s` } as CSSProperties}
          />
        ))}
      </g>
      <g className="emblem-pins">
        {LEADS.map((lead) => (
          <path
            key={lead.pin}
            d={lead.pin}
            className={lead.pulse ? 'is-fed' : undefined}
            style={{ '--delay': `${lead.delay}s`, '--duration': `${lead.duration}s` } as CSSProperties}
          />
        ))}
      </g>

      <path
        className="emblem-socket"
        d={`M${body - 58} ${body - 30}V${body - 58}H${body - 30}M${body + size + 30} ${body - 58}H${body + size + 58}V${body - 30}M${body + size + 58} ${body + size + 30}V${body + size + 58}H${body + size + 30}M${body - 30} ${body + size + 58}H${body - 58}V${body + size + 30}`}
      />

      <rect className="emblem-body" x={body} y={body} width={size} height={size} rx="14" />
      <rect className="emblem-window" x={body + 24} y={body + 24} width={size - 48} height={size - 48} rx="8" />
      <circle className="emblem-pin-one" cx={body + 13} cy={body + 13} r="3.5" />
      <image
        href={revsiliconLogoUrl}
        x={C - 74}
        y={C - 92}
        width="148"
        height="184"
        preserveAspectRatio="xMidYMid meet"
      />
      <g clipPath="url(#emblem-die)">
        <rect className="emblem-scan" x={body} y={body - 90} width={size} height="90" fill="url(#emblem-scan)" />
      </g>
    </svg>
  );
}

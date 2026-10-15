import type { CSSProperties } from 'react';
import { revsiliconLogoUrl } from '../assets';

const VIEW = 600;
const C = VIEW / 2;
const RADIUS = 270;
/** Dies must sit fully inside this radius, the usable area inside the edge exclusion. */
const USABLE = 252;
const PITCH = 34;
const DIE = 30;

type Die = { readonly x: number; readonly y: number; readonly delay: number };

/**
 * The die grid: every full die that fits inside the usable radius, skipping the
 * 2 x 2 block at the center where our own chip sits. The sweep delay ripples
 * outward from the center, like a probe card stepping across the wafer.
 */
const DIES: readonly Die[] = (() => {
  const dies: Die[] = [];
  const span = Math.ceil(USABLE / PITCH);
  for (let row = -span; row < span; row += 1) {
    for (let column = -span; column < span; column += 1) {
      const x = C + column * PITCH + (PITCH - DIE) / 2;
      const y = C + row * PITCH + (PITCH - DIE) / 2;
      const corners = [[x, y], [x + DIE, y], [x, y + DIE], [x + DIE, y + DIE]];
      if (!corners.every(([cx = 0, cy = 0]) => Math.hypot(cx - C, cy - C) <= USABLE)) continue;
      if ((column === -1 || column === 0) && (row === -1 || row === 0)) continue;
      const distance = Math.hypot(x + DIE / 2 - C, y + DIE / 2 - C);
      dies.push({ x, y, delay: (distance / USABLE) * 3.2 });
    }
  }
  return dies;
})();

/** A 300 mm-style wafer, tilted and turning slowly. Decorative: the copy beside it carries the meaning. */
export function Wafer() {
  const center = C - PITCH + (PITCH - DIE) / 2;
  const centerSize = PITCH + DIE;

  return (
    <div className="wafer" aria-hidden="true">
      <svg className="wafer-disc" viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <defs>
          <radialGradient id="wafer-surface" cx="38%" cy="32%" r="78%">
            <stop offset="0" stopColor="#24395a" />
            <stop offset="0.55" stopColor="#12223a" />
            <stop offset="1" stopColor="#081322" />
          </radialGradient>
          <linearGradient id="wafer-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.25" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="wafer-clip">
            <circle cx={C} cy={C} r={RADIUS} />
          </clipPath>
        </defs>

        <circle className="wafer-body" cx={C} cy={C} r={RADIUS} />
        <circle className="wafer-exclusion" cx={C} cy={C} r={USABLE + 6} />

        <g clipPath="url(#wafer-clip)">
          {DIES.map((die) => (
            <rect
              key={`${die.x}-${die.y}`}
              className="wafer-die"
              x={die.x}
              y={die.y}
              width={DIE}
              height={DIE}
              rx="1.5"
              style={{ '--delay': `${die.delay.toFixed(2)}s` } as CSSProperties}
            />
          ))}
          <rect className="wafer-sheen" x="0" y="0" width={VIEW} height={VIEW} fill="url(#wafer-sheen)" />
        </g>

        <rect className="wafer-core" x={center} y={center} width={centerSize} height={centerSize} rx="2" />
        <image
          href={revsiliconLogoUrl}
          x={center + 9}
          y={center + 6}
          width={centerSize - 18}
          height={centerSize - 12}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Orientation notch at six o'clock. */}
        <path className="wafer-notch" d={`M${C - 9} ${C + RADIUS + 2}L${C} ${C + RADIUS - 11}L${C + 9} ${C + RADIUS + 2}Z`} />
      </svg>
    </div>
  );
}

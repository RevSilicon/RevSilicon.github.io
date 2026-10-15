import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { revsiliconLogoUrl } from '../assets';
import { type ArchitectureLayer, site } from '../data/site';
import { prefersReducedMotion } from '../motion';

const vars = (values: Record<string, number>) => values as CSSProperties;

/** Each plate is drawn flat in a 300 x 300 box; CSS tilts it into the isometric stack. */
function LayerArt({ id }: { id: ArchitectureLayer['id'] }) {
  if (id === 'package') {
    return (
      <svg viewBox="0 0 300 300">
        <defs>
          <linearGradient id="arch-lid-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#efebe4" />
            <stop offset="0.55" stopColor="#d2cdc4" />
            <stop offset="1" stopColor="#b7b1a6" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill="url(#arch-lid-metal)" />
        <rect className="arch-lid-step" x="16" y="16" width="268" height="268" rx="10" />
        {/* Counter-rotated against the plate's -45deg turn so the mark reads upright in the stack. */}
        <image
          href={revsiliconLogoUrl}
          x="78"
          y="58"
          width="144"
          height="184"
          preserveAspectRatio="xMidYMid meet"
          transform="rotate(45 150 150)"
        />
      </svg>
    );
  }

  if (id === 'compute') {
    return (
      <svg viewBox="0 0 300 300">
        <rect className="arch-base" width="300" height="300" />
        <rect className="arch-frame" x="14" y="14" width="272" height="272" />
        {Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8);
          const column = index % 8;
          return (
            <rect
              key={index}
              className="arch-cell"
              x={34 + column * 30}
              y={34 + row * 30}
              width="22"
              height="22"
              style={vars({ '--d': row + column })}
            />
          );
        })}
      </svg>
    );
  }

  if (id === 'control') {
    return (
      <svg viewBox="0 0 300 300">
        <rect className="arch-base" width="300" height="300" />
        <rect className="arch-frame" x="14" y="14" width="272" height="272" />
        <path className="arch-wire" d="M150 118V78M60 78H240M60 78V58M120 78V58M180 78V58M240 78V58M150 182V238M106 150H70M194 150H230" />
        <path className="arch-flow" d="M150 118V78M60 78H240M60 78V58M120 78V58M180 78V58M240 78V58M150 182V238M106 150H70M194 150H230" />
        {[60, 120, 180, 240].map((x) => <rect key={x} className="arch-port" x={x - 14} y="34" width="28" height="24" rx="2" />)}
        <rect className="arch-port" x="34" y="132" width="36" height="36" rx="2" />
        <rect className="arch-port" x="230" y="132" width="36" height="36" rx="2" />
        <rect className="arch-core" x="106" y="118" width="88" height="64" rx="4" />
        <rect className="arch-port" x="46" y="238" width="208" height="20" rx="2" />
        <circle className="arch-node" cx="150" cy="78" r="4" />
        <circle className="arch-node" cx="150" cy="238" r="4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 300">
      <rect className="arch-base" width="300" height="300" />
      <rect className="arch-frame" x="14" y="14" width="272" height="272" />
      <path className="arch-wire" d="M34 40V262" />
      {Array.from({ length: 6 }, (_, index) => {
        const y = 38 + index * 38;
        return (
          <g key={index}>
            <path className="arch-wire" d={`M34 ${y + 13}H48`} />
            <rect className="arch-bank" x="48" y={y} width="218" height="26" rx="2" style={vars({ '--d': index })} />
            <path
              className="arch-bits"
              d={Array.from({ length: 17 }, (_, bit) => `M${60 + bit * 12} ${y + 6}V${y + 20}`).join('')}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function ArchitectureStack() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(prefersReducedMotion);
  const [active, setActive] = useState<number | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        timer.current = window.setTimeout(() => setOpen(true), 260);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer.current);
    };
  }, []);


  const layers = site.architecture;

  return (
    <div
      ref={ref}
      className={`arch-stack ${open ? 'is-open' : ''} ${active === null ? '' : 'has-active'}`.trim()}
    >
      <div className="arch-visual" aria-hidden="true">
        <div className="arch-shadow" />
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`arch-layer arch-layer-${layer.id} ${active === index ? 'is-active' : ''}`.trim()}
            style={vars({ '--i': index })}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            <div className="arch-plate">
              <div className="arch-face"><LayerArt id={layer.id} /></div>
              <span className="arch-side arch-side-front" />
              <span className="arch-side arch-side-left" />
            </div>
          </div>
        ))}
      </div>

      <ol className="arch-labels">
        {layers.map((layer, index) => (
          <li
            key={layer.id}
            className={active === index ? 'is-active' : undefined}
            style={vars({ '--i': index })}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
          >
            <strong>{layer.name}</strong>
            <span className="arch-detail">{layer.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

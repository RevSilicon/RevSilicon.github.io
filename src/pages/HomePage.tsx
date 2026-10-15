import type { CSSProperties } from 'react';
import { ChipEmblem } from '../components/ChipEmblem';
import { CircuitField } from '../components/CircuitField';
import { ClosingCta } from '../components/ClosingCta';
import { DecodeText } from '../components/DecodeText';
import { EventChart } from '../components/EventChart';
import { Figure } from '../components/Figure';
import { Reveal } from '../components/Reveal';
import { Sheet } from '../components/Sheet';
import { SpecRows } from '../components/SpecRows';
import { chipName, site } from '../data/site';
import { Link } from '../router';

/** The home-page concept view of the chip: the same three blocks as the Projects stack, drawn as live circuitry. */
function NeonBlueprint() {
  return (
    <div className="neon-blueprint">
      <svg viewBox="0 0 620 460" role="img" aria-labelledby="neon-blueprint-title">
        <title id="neon-blueprint-title">Concept view of {chipName}: control, compute, and memory blocks</title>
        <defs>
          <linearGradient id="neon-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6e3e5" stopOpacity="0" />
            <stop offset="1" stopColor="#f6e3e5" stopOpacity="0.2" />
          </linearGradient>
          <clipPath id="neon-die">
            <rect x="116" y="104" width="388" height="252" rx="4" />
          </clipPath>
        </defs>
        <path className="nb-trace" d="M24 126H116M504 126H596M24 334H116M504 334H596M310 24V104M310 356V436" />
        <path className="nb-flow" d="M24 126H116M596 334H504M310 24V104M310 436V356" pathLength="100" />
        <rect className="nb-die" x="116" y="104" width="388" height="252" rx="4" />

        <g className="nb-block">
          <rect x="142" y="132" width="142" height="82" rx="3" />
          <text x="160" y="160">CONTROL</text>
          <path d="M160 182H258" />
        </g>
        <g className="nb-block nb-block-accent">
          <rect x="304" y="132" width="174" height="82" rx="3" />
          <text x="322" y="160">COMPUTE</text>
          {Array.from({ length: 12 }, (_, index) => (
            <rect
              key={index}
              className="nb-cell"
              x={322 + (index % 6) * 25}
              y={174 + Math.floor(index / 6) * 16}
              width="18"
              height="10"
              style={{ '--d': (index % 6) + Math.floor(index / 6) } as CSSProperties}
            />
          ))}
        </g>
        <g className="nb-block">
          <rect x="142" y="238" width="336" height="90" rx="3" />
          <text x="160" y="266">MEMORY</text>
          <path d="M160 291H460" />
          <path d="M210 280V305M260 280V305M310 280V305M360 280V305M410 280V305" />
        </g>
        <path className="nb-bus" d="M284 173H304M213 214V238M391 214V238" />
        <path className="nb-bus-flow" d="M284 173H304M213 214V238M391 238V214" pathLength="100" />
        {[[24, 126], [596, 126], [24, 334], [596, 334], [310, 24], [310, 436]].map(([x, y]) => (
          <circle key={`${x}-${y}`} className="nb-node" cx={x} cy={y} r="4.5" />
        ))}
        <g clipPath="url(#neon-die)">
          <rect className="nb-scan" x="116" y="20" width="388" height="84" fill="url(#neon-scan)" />
        </g>
      </svg>
    </div>
  );
}

export function HomePage() {
  const { home, values } = site;

  return (
    <main id="main-content" className="home-page fx-page">
      <CircuitField />

      <section className="fx-hero" aria-labelledby="home-heading">
        <div className="container fx-hero-grid">
          <div className="fx-hero-copy">
            <h1 id="home-heading">
              <span className="fx-line">Aggies designing</span>
              <span className="fx-line fx-line-accent">real silicon.</span>
            </h1>
            <p className="fx-lede">{home.lede}</p>
            <div className="fx-actions">
              <Link className="fx-button" to="/join">Join the team <span aria-hidden="true">↗</span></Link>
              <Link className="fx-button is-ghost" to="/projects">Meet {chipName} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className="fx-hero-visual">
            <ChipEmblem />
          </div>
        </div>
      </section>

      <Sheet title="Learn. Design. Tapeout.">
        <SpecRows rows={values.map((value) => ({ key: value.title, title: value.title, detail: value.detail }))} />
      </Sheet>

      <Sheet id="building" title={<DecodeText text={chipName} />} className="sheet-build">
        <div className="build-grid">
          <Reveal className="build-copy">
            <p className="sheet-lede">{home.build.description}</p>
            <Link className="fx-button is-ghost" to="/projects">Explore the project <span aria-hidden="true">↗</span></Link>
          </Reveal>
          <Reveal delay={120}>
            <Figure>
              <NeonBlueprint />
            </Figure>
          </Reveal>
        </div>
      </Sheet>

      <Sheet
        title="Club calendar"
        wide={(
          <Figure>
            <EventChart />
          </Figure>
        )}
      >
        <p className="sheet-note">Sample events. Dates to be decided.</p>
      </Sheet>

      <ClosingCta title="Silicon starts here." />
    </main>
  );
}

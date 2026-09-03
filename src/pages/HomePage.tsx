import { EventChart } from '../components/EventChart';
import { FlickerGrid } from '../components/FlickerGrid';
import { HeroReveille } from '../components/HeroReveille';
import { Reveal } from '../components/Reveal';
import { site } from '../data/site';
import { Link } from '../router';

/** A conceptual system view, not a claim about the final implementation. */
function ProjectBlueprint() {
  return (
    <figure className="project-blueprint">
      <svg viewBox="0 0 620 460" role="img" aria-labelledby="project-blueprint-title">
        <title id="project-blueprint-title">Concept view of an AI inference accelerator</title>
        <rect className="blueprint-board" x="24" y="24" width="572" height="412" rx="6" />
        <path className="blueprint-trace" d="M74 126H116M504 126H548M74 334H116M504 334H548M310 72V104M310 356V388" />
        <rect className="blueprint-die" x="116" y="104" width="388" height="252" rx="4" />

        <g className="blueprint-block">
          <rect x="142" y="132" width="142" height="82" rx="3" />
          <text x="160" y="160">CONTROL</text>
          <path d="M160 182H258" />
        </g>
        <g className="blueprint-block blueprint-block-accent">
          <rect x="304" y="132" width="174" height="82" rx="3" />
          <text x="322" y="160">COMPUTE</text>
          <path d="M322 182H350M360 182H388M398 182H426M436 182H460" />
        </g>
        <g className="blueprint-block">
          <rect x="142" y="238" width="336" height="90" rx="3" />
          <text x="160" y="266">MEMORY</text>
          <path d="M160 291H460" />
          <path d="M210 280V305M260 280V305M310 280V305M360 280V305M410 280V305" />
        </g>
        <path className="blueprint-bus" d="M284 173H304M213 214V238M391 214V238" />
        <circle className="blueprint-node" cx="74" cy="126" r="5" />
        <circle className="blueprint-node" cx="548" cy="126" r="5" />
        <circle className="blueprint-node" cx="74" cy="334" r="5" />
        <circle className="blueprint-node" cx="548" cy="334" r="5" />
      </svg>
      <figcaption>CONCEPT VIEW</figcaption>
    </figure>
  );
}

export function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <section className="hero" aria-labelledby="home-heading">
        <HeroReveille />
        <div className="container hero-content">
          <p className="hero-kicker">TEXAS A&amp;M CHIP DESIGN</p>
          <h1 id="home-heading">
            <span className="hero-line"><span>Aggies designing</span></span>{' '}
            <span className="hero-line hero-line-accent"><span>real silicon</span></span>
          </h1>
          <div className="hero-actions">
            <Link className="solid-button" to="/join">Join the team <span aria-hidden="true">↗</span></Link>
            <a className="text-link muted" href="#building">Explore our work <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>

      <section className="intent-section" aria-labelledby="intent-heading">
        <div className="container intent-layout">
          <Reveal className="intent-copy">
            <p className="micro-label">OUR MISSION</p>
            <h2 id="intent-heading">Learn<br />Design<br />Tapeout</h2>
          </Reveal>
          <Reveal className="intent-values" delay={110}>
            {site.values.map((value, index) => (
              <div key={value.title} className="intent-value">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{value.title}</h3>
                <p>{value.detail}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section id="building" className="building-section" aria-labelledby="building-heading">
        <div className="container building-layout">
          <Reveal className="building-copy">
            <p className="micro-label">THE FIRST BUILD</p>
            <h2 id="building-heading">AI Inference<br />Accelerator</h2>
            <p>A single design carried through architecture, RTL, verification, and physical design.</p>
            <Link className="text-link light" to="/projects">View the project <span aria-hidden="true">↗</span></Link>
          </Reveal>
          <Reveal className="building-visual" delay={110}>
            <ProjectBlueprint />
          </Reveal>
        </div>
      </section>

      <EventChart />

      <section className="join-cta" aria-labelledby="join-cta-heading">
        <FlickerGrid />
        <div className="cta-glow" aria-hidden="true" />
        <Reveal className="join-cta-content">
          <h2 id="join-cta-heading">Silicon starts here.</h2>
          <Link className="outline-button" to="/join">Join Rev Silicon <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>
    </main>
  );
}

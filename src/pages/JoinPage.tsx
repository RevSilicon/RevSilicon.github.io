import { useState } from 'react';
import { logoPlateCleanUrl, revsiliconLogoUrl } from '../assets';
import { CircuitField } from '../components/CircuitField';
import { Reveal } from '../components/Reveal';
import { Sheet } from '../components/Sheet';
import { SpecRows } from '../components/SpecRows';
import { contact, site } from '../data/site';

/**
 * Hover either half to see it take over the panel with a sliding flex-basis
 * transition. Bootcamp carries the navy accent, CORE the maroon.
 */
function PathSplit() {
  const [hovered, setHovered] = useState<'bootcamp' | 'project' | null>(null);

  return (
    <div className="path-split">
      <button
        type="button"
        className={`path-panel path-panel-bootcamp ${hovered === 'bootcamp' ? 'is-grown' : ''} ${hovered === 'project' ? 'is-shrunk' : ''}`}
        onMouseEnter={() => setHovered('bootcamp')}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered('bootcamp')}
        onBlur={() => setHovered(null)}
      >
        <img src={logoPlateCleanUrl} alt="" className="path-panel-mark" aria-hidden="true" />
        <h3>Rev Bootcamp</h3>
        <p className="path-panel-status">Coming soon</p>
        <p className="path-panel-tag">New to chip design</p>
        <ul className="path-panel-detail">
          <li>Runs one semester, start to finish</li>
          <li>Learn digital design, verification, and RISC-V fundamentals</li>
          <li>Group up to build a RISC-V processor</li>
          <li>Learn physical design to implement it together</li>
        </ul>
      </button>

      <button
        type="button"
        className={`path-panel path-panel-project ${hovered === 'project' ? 'is-grown' : ''} ${hovered === 'bootcamp' ? 'is-shrunk' : ''}`}
        onMouseEnter={() => setHovered('project')}
        onMouseLeave={() => setHovered(null)}
        onFocus={() => setHovered('project')}
        onBlur={() => setHovered(null)}
      >
        <img src={revsiliconLogoUrl} alt="" className="path-panel-mark" aria-hidden="true" />
        <h3>CORE team</h3>
        <p className="path-panel-tag">Already comfortable with the basics</p>
        <ul className="path-panel-detail">
          <li>Work directly on the AI inference accelerator</li>
          <li>Run the full ASIC flow, start to finish</li>
          <li>Build alongside members who've done it before</li>
        </ul>
      </button>
    </div>
  );
}

export default function JoinPage() {
  const teamRows = site.teams.map((team) => ({
    key: team.title,
    title: team.title,
    detail: team.overview,
    extra: (
      <ul className="fx-chips" aria-label={`${team.title} skills`}>
        {team.skills.map((skill) => <li key={skill}>{skill}</li>)}
      </ul>
    ),
  }));

  return (
    <main id="main-content" className="inner-page join-page fx-page">
      <CircuitField />

      <section className="fx-page-hero" aria-labelledby="apply-heading">
        <div className="container fx-split">
          <div className="fx-page-hero-copy">
            <h1 id="apply-heading">
              <span className="fx-line">Applications open</span>
              <span className="fx-line fx-line-accent">each semester</span>
            </h1>
            <div className="fx-actions">
              <a className="fx-button" href={contact.applyForm} target="_blank" rel="noreferrer noopener">
                Apply here <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>

          <Reveal className="info-block" delay={120}>
            <p className="info-block-title">Questions?</p>
            <a className="join-email" href={`mailto:${contact.email}`}>{contact.email}</a>
            <p>Ask what a week looks like, how to prepare, or where your interests fit.</p>
          </Reveal>
        </div>
      </section>

      <Sheet
        title="Two paths"
        wide={(
          <Reveal>
            <PathSplit />
          </Reveal>
        )}
      />

      <Sheet title="Pick where you want to start">
        <SpecRows rows={teamRows} />
        <Reveal className="note-block">
          <div>
            <h3>Start with the fundamentals</h3>
            <p>Our resource repository includes the tutorials, textbooks, and setup guides each team uses.</p>
          </div>
          <a className="fx-button is-ghost" href={contact.resources} target="_blank" rel="noreferrer noopener">
            Open the resource repo <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
      </Sheet>
    </main>
  );
}

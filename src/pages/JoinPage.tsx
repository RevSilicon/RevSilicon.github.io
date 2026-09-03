import { useState } from 'react';
import { logoPlateCleanUrl, revsiliconLogoUrl } from '../assets';
import { Reveal } from '../components/Reveal';
import { contact, site } from '../data/site';

/**
 * Proof of concept: hover either half to see it take over the panel with a
 * sliding flex-basis transition. Copy is placeholder — swap before shipping.
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
        <p className="path-panel-index">01</p>
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
        <p className="path-panel-index">02</p>
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
  return (
    <main id="main-content" className="inner-page join-page">
      <section className="apply-section" aria-labelledby="apply-heading">
        <div className="container apply-layout">
          <Reveal>
            <p className="micro-label">Timeline</p>
            <h1 id="apply-heading">Applications open each semester</h1>
            <a className="apply-button" href={contact.applyForm} target="_blank" rel="noreferrer noopener">
              <span>Apply here</span>
              <span className="apply-arrow" aria-hidden="true">↗</span>
            </a>
          </Reveal>

          <Reveal className="apply-contact" delay={100}>
            <p className="micro-label">Questions?</p>
            <a className="apply-email" href={`mailto:${contact.email}`}>{contact.email}</a>
            <p>Ask what a week looks like, how to prepare, or where your interests fit.</p>
          </Reveal>
        </div>
      </section>

      <section className="path-section" aria-labelledby="path-heading">
        <div className="container">
          <Reveal className="path-intro">
            <h2 id="path-heading">Two paths</h2>
          </Reveal>
          <Reveal delay={90}>
            <PathSplit />
          </Reveal>
        </div>
      </section>

      <section className="teams-section" aria-labelledby="teams-heading">
        <div className="container">
          <Reveal className="teams-intro">
            <h2 id="teams-heading">Pick where you want to start</h2>
          </Reveal>

          <div className="teams-grid">
            {site.teams.map((team, index) => (
              <Reveal key={team.title} delay={(index % 2) * 80} className="team-card">
                <p className="team-index">{String(index + 1).padStart(2, '0')}</p>
                <h3>{team.title}</h3>
                <p className="team-overview">{team.overview}</p>
                <p className="team-skills-label">Skills you build</p>
                <ul className="team-skills">
                  {team.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal className="resources-strip">
            <div>
              <p className="micro-label maroon-text">Before you apply</p>
              <h3>Start with the fundamentals</h3>
              <p>Our resource repository includes the tutorials, textbooks, and setup guides each team uses.</p>
            </div>
            <a className="text-link dark" href={contact.resources} target="_blank" rel="noreferrer noopener">
              Open the resource repo <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

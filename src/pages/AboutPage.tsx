import { useEffect, useId, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal';
import { logoMarkUrl } from '../assets';
import { site } from '../data/site';
import type { Officer } from '../data/site';

function OfficerDialog({
  officer,
  titleId,
  onClose,
}: {
  officer: Officer;
  titleId: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const meta = officer.major
    ? `${officer.major}${officer.gradYear ? ` · Class of ${officer.gradYear}` : ''}`
    : null;

  return (
    <div className="officer-dialog-layer">
      <button className="officer-dialog-backdrop" type="button" aria-label="Close profile" onClick={onClose} />
      <article
        className="officer-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <button className="officer-dialog-close" type="button" aria-label="Close profile" onClick={onClose}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <div className="officer-dialog-media">
          <div className="officer-dialog-portrait">
            <img src={officer.photo ?? logoMarkUrl} alt="" className={officer.photo ? '' : 'is-placeholder'} />
          </div>
          <p className="micro-label maroon-text">{officer.role}</p>
          <h3 id={titleId}>{officer.name ?? officer.role}</h3>
        </div>

        <div className="officer-dialog-info">
          <div className="officer-dialog-field">
            <p className="micro-label">Major &amp; graduation</p>
            <p>{meta ?? 'Details coming soon.'}</p>
          </div>
          <div className="officer-dialog-field">
            <p className="micro-label">Bio</p>
            <p>{officer.bio ?? 'Profile coming soon, check back after officer elections wrap up.'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

/** Parked: the Team / officers page. Not routed or linked from the nav. */
export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cardRefs = useRef(new Map<number, HTMLButtonElement>());
  const titleId = useId();

  useEffect(() => {
    document.body.style.overflow = openIndex === null ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openIndex]);

  const closeDialog = () => {
    const index = openIndex;
    setOpenIndex(null);
    if (index !== null) requestAnimationFrame(() => cardRefs.current.get(index)?.focus());
  };

  const flatOfficers = site.officerGroups.flatMap((group) => group.officers);
  const openOfficer = flatOfficers[openIndex ?? -1];

  const groupStartIndices = site.officerGroups.reduce<{ starts: number[]; total: number }>(
    (acc, group) => {
      acc.starts.push(acc.total);
      acc.total += group.officers.length;
      return acc;
    },
    { starts: [], total: 0 },
  ).starts;

  return (
    <main id="main-content" className="inner-page about-page">
      <section className="officers-section" aria-labelledby="officers-heading">
        <div className="inner-hero team-hero">
          <div className="container team-hero-content">
            <h1 id="officers-heading">Meet the officers</h1>
          </div>
        </div>

        <div className="container">
          {site.officerGroups.map((group, groupIndex) => {
            const startIndex = groupStartIndices[groupIndex] ?? 0;

            return (
              <div key={group.title} className="officer-group">
                <Reveal className="officer-group-title">
                  <h2>{group.title}</h2>
                </Reveal>
                <div className="officer-grid">
                  {group.officers.map((officer, position) => {
                    const index = startIndex + position;
                    return (
                      <Reveal key={`${group.title}-${officer.role}-${position}`} delay={position * 70} className="officer-card-wrap">
                        <button
                          type="button"
                          className="officer-card"
                          ref={(node) => {
                            if (node) cardRefs.current.set(index, node);
                            else cardRefs.current.delete(index);
                          }}
                          onClick={() => setOpenIndex(index)}
                          aria-haspopup="dialog"
                        >
                          <span className="officer-expand" aria-hidden="true">+</span>
                          <div className="portrait-placeholder" role="img" aria-label={`${officer.name ?? officer.role} portrait`}>
                            <img src={officer.photo ?? logoMarkUrl} alt="" className={officer.photo ? '' : 'is-placeholder'} />
                          </div>
                          <div className="officer-card-copy">
                            <h3>{officer.name ?? officer.role}</h3>
                            <p>{officer.name ? officer.role : 'Profile coming soon'}</p>
                            <span className="officer-view-hint">View profile <span aria-hidden="true">↗</span></span>
                          </div>
                        </button>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {openOfficer ? (
        <OfficerDialog officer={openOfficer} titleId={titleId} onClose={closeDialog} />
      ) : null}
    </main>
  );
}

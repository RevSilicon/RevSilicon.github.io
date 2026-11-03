import { useEffect, useId, useRef, useState } from 'react';
import { revsiliconLogoUrl } from '../assets';
import { CircuitField } from '../components/CircuitField';
import { Reveal } from '../components/Reveal';
import { Sheet } from '../components/Sheet';
import { site } from '../data/site';
import type { Officer } from '../data/site';

function Portrait({ officer, className }: { officer: Officer; className: string }) {
  return (
    <span className={className}>
      <img src={officer.photo ?? revsiliconLogoUrl} alt="" className={officer.photo ? undefined : 'is-placeholder'} />
    </span>
  );
}

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

        <Portrait officer={officer} className="officer-dialog-portrait" />

        <div className="officer-dialog-info">
          <header className="officer-dialog-head">
            <p className="officer-dialog-role">{officer.role}</p>
            <h3 id={titleId}>{officer.name ?? officer.role}</h3>
            {meta ? <p className="officer-dialog-meta">{meta}</p> : null}
          </header>
          <p className="officer-dialog-bio">{officer.bio ?? 'Profile coming soon.'}</p>
          {officer.links?.length ? (
            <div className="officer-dialog-links">
              {officer.links.map((link) => (
                <a key={link.url} className="fx-button" href={link.url} target="_blank" rel="noreferrer">
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

/** The officers, grouped by role. Each card opens a profile with the officer's bio. */
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
    <main id="main-content" className="inner-page about-page fx-page">
      <CircuitField />

      {openOfficer ? (
        <OfficerDialog officer={openOfficer} titleId={titleId} onClose={closeDialog} />
      ) : null}

      <section className="fx-page-hero team-hero" aria-labelledby="officers-heading">
        <div className="container">
          <h1 id="officers-heading">
            <span className="fx-line">Meet the</span>
            <span className="fx-line fx-line-accent">officers</span>
          </h1>
        </div>
      </section>

      {site.officerGroups.map((group, groupIndex) => {
        const startIndex = groupStartIndices[groupIndex] ?? 0;

        return (
          <Sheet key={group.title} title={group.title} className="officer-group">
            <div className="officer-grid">
              {group.officers.map((officer, position) => {
                const index = startIndex + position;
                return (
                  <Reveal key={`${group.title}-${officer.role}-${position}`} delay={position * 70}>
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
                      <Portrait officer={officer} className="officer-portrait" />
                      <span className="officer-card-copy">
                        <span className="officer-name">{officer.name ?? officer.role}</span>
                        <span className="officer-role">{officer.name ? officer.role : 'Profile coming soon'}</span>
                      </span>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </Sheet>
        );
      })}
    </main>
  );
}

import { useId } from 'react';
import { Link } from '../router';
import { FlickerGrid } from './FlickerGrid';
import { Reveal } from './Reveal';

type ClosingCtaProps = {
  readonly title: string;
};

/** The flicker-grid join band that closes the Home page. */
export function ClosingCta({ title }: ClosingCtaProps) {
  const headingId = useId();

  return (
    <section className="fx-closing" aria-labelledby={headingId}>
      <FlickerGrid />
      <div className="fx-closing-glow" aria-hidden="true" />
      <Reveal className="fx-closing-content">
        <h2 id={headingId}>{title}</h2>
        <Link className="fx-button" to="/join">Join Rev Silicon <span aria-hidden="true">↗</span></Link>
      </Reveal>
    </section>
  );
}

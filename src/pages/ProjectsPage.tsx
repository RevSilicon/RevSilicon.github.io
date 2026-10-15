import { lazy, Suspense } from 'react';
import { ArchitectureStack } from '../components/ArchitectureStack';
import { ChipSpecs } from '../components/ChipSpecs';
import { CircuitField } from '../components/CircuitField';
import { DecodeText } from '../components/DecodeText';
import { Figure } from '../components/Figure';
import { Reveal } from '../components/Reveal';
import { Sheet } from '../components/Sheet';
import { site } from '../data/site';

const ChipScene = lazy(() =>
  import('../components/ChipScene').then((module) => ({ default: module.ChipScene })),
);

/**
 * Teaser while the accelerator is in design: the module in 3D, then the
 * architecture as an exploded stack. The full page is parked in ProjectsPageFull.
 */
export default function ProjectsPage() {
  const { teaser } = site;

  return (
    <main id="main-content" className="inner-page projects-page fx-page">
      <CircuitField />

      <section className="chip-hero" aria-labelledby="projects-heading">
        <div className="container chip-hero-grid">
          <div className="chip-copy">
            <h1 id="projects-heading">
              <DecodeText className="chip-name" text={teaser.title} duration={1500} />
              <span className="chip-tagline">{teaser.tagline}</span>
            </h1>
            <p className="chip-lede">{teaser.description}</p>
            <ChipSpecs />
          </div>

          <div className="chip-stage">
            <Suspense fallback={<div className="chip-loading" aria-hidden="true" />}>
              <ChipScene />
            </Suspense>
          </div>
        </div>
      </section>

      <Sheet
        title="Inside the chip."
        wide={(
          <Reveal>
            <Figure>
              <ArchitectureStack />
            </Figure>
          </Reveal>
        )}
      >
        <Reveal>
          <p className="sheet-lede">A first look at the stack. The full block diagram drops at architecture freeze.</p>
        </Reveal>
      </Sheet>
    </main>
  );
}

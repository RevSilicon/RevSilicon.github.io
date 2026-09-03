import { lazy, Suspense } from 'react';
import { ProcessFlow } from '../components/ProcessFlow';
import { Reveal } from '../components/Reveal';
import { site } from '../data/site';

const AcceleratorScene = lazy(() =>
  import('../components/AcceleratorScene').then((module) => ({ default: module.AcceleratorScene })),
);

function AcceleratorFallback() {
  return <div className="accelerator-loading" aria-hidden="true" />;
}

function InferencePathVisual() {
  return (
    <figure className="inference-path" aria-labelledby="inference-path-title">
      <figcaption>
        <span>VORTEX + AI</span>
        <strong id="inference-path-title">Inference data flow</strong>
      </figcaption>
      <div className="inference-flow">
        <div className="inference-node">
          <span>01</span>
          <strong>AI workload</strong>
          <small>Model + inputs</small>
        </div>
        <i className="inference-arrow" aria-hidden="true" />
        <div className="inference-node inference-node-core">
          <span>02</span>
          <strong>Vortex</strong>
          <small>Parallel RISC-V kernels</small>
        </div>
        <i className="inference-arrow" aria-hidden="true" />
        <div className="inference-node">
          <span>03</span>
          <strong>Result</strong>
          <small>Measured inference</small>
        </div>
      </div>
      <div className="inference-memory">
        <span>Shared memory path</span>
        <i aria-hidden="true" />
      </div>
    </figure>
  );
}

const inferenceFocus = [
  ['Model mapping', 'Turn inference workloads into parallel kernels.'],
  ['Memory behavior', 'Find where data movement becomes the bottleneck.'],
  ['RTL experiments', 'Build, verify, and measure targeted changes to the hardware.'],
] as const;

export default function ProjectsPage() {
  return (
    <main id="main-content" className="inner-page projects-page">
      <section className="inner-hero projects-hero" aria-labelledby="projects-heading">
        <div className="container inner-hero-grid">
          <div>
            <p className="micro-label">{site.project.eyebrow}</p>
            <h1 id="projects-heading">{site.project.title}</h1>
          </div>
          <div className="project-lede">
            <p>{site.project.description}</p>
            <a
              className="text-link muted vortex-credit"
              href="https://github.com/vortexgpgpu/vortex"
              target="_blank"
              rel="noreferrer"
            >
              Click here for Vortex&apos;s GitHub <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <div className="accelerator-stage">
          <Suspense fallback={<AcceleratorFallback />}>
            <AcceleratorScene />
          </Suspense>
        </div>
      </section>

      <section className="brief-section" aria-labelledby="brief-heading">
        <div className="container brief-layout">
          <Reveal className="brief-copy">
            <h2 id="brief-heading">AI inference.</h2>
            <p>
              Students run AI workloads on the accelerator, then measure what makes them faster.
            </p>
            <dl className="inference-focus">
              {inferenceFocus.map(([title, detail], index) => (
                <div key={title}>
                  <dt>{String(index + 1).padStart(2, '0')}</dt>
                  <dd><strong>{title}</strong><span>{detail}</span></dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="brief-visual" delay={120}>
            <InferencePathVisual />
          </Reveal>
        </div>
      </section>

      <ProcessFlow />
    </main>
  );
}

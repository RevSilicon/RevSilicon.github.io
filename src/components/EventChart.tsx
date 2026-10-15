import { type CSSProperties, type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { site } from '../data/site';
import { prefersReducedMotion } from '../motion';

const VIEW = { width: 1200, height: 500 } as const;
const PLOT = { left: 88, right: 1112, top: 92, bottom: 398 } as const;

const kindLabel = { milestone: 'Milestone', event: 'Club event', workshop: 'Workshop' } as const;

type ChartPoint = (typeof site.events)[number] & {
  readonly x: number;
  readonly y: number;
};

function buildSmoothPath(points: readonly ChartPoint[]) {
  const [first, ...remaining] = points;
  if (!first) return '';

  return remaining.reduce((path, point, index) => {
    const current = points[index] ?? first;
    const previous = points[index - 1] ?? current;
    const next = point;
    const following = points[index + 2] ?? next;
    const firstControlX = current.x + (next.x - previous.x) / 6;
    const firstControlY = current.y + (next.y - previous.y) / 6;
    const secondControlX = next.x - (following.x - current.x) / 6;
    const secondControlY = next.y - (following.y - current.y) / 6;

    return `${path} C ${firstControlX.toFixed(1)} ${firstControlY.toFixed(1)}, ${secondControlX.toFixed(1)} ${secondControlY.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`;
  }, `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`);
}

/** The club year as a rising chart with click-to-open detail. Framed by the page as a figure. */
export function EventChart() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const pointRefs = useRef(new Map<string, SVGGElement>());
  const cardId = useId();
  const cardTitleId = useId();
  const chartTitleId = useId();
  const [visible, setVisible] = useState(prefersReducedMotion);
  const [openId, setOpenId] = useState<string | null>(null);

  const points = useMemo<readonly ChartPoint[]>(() => {
    const span = PLOT.right - PLOT.left;
    const denominator = Math.max(site.events.length - 1, 1);
    return site.events.map((event, index) => ({
      ...event,
      x: PLOT.left + (index / denominator) * span,
      y: PLOT.top + event.arc * (PLOT.bottom - PLOT.top),
    }));
  }, []);
  const path = useMemo(() => buildSmoothPath(points), [points]);
  const open = points.find((point) => point.id === openId) ?? null;

  useEffect(() => {
    const element = sectionRef.current;
    if (!element || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (openId) cardRef.current?.focus();
  }, [openId]);

  const closeCard = useCallback(() => {
    const activeId = openId;
    setOpenId(null);
    if (activeId) requestAnimationFrame(() => pointRefs.current.get(activeId)?.focus());
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeCard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openId, closeCard]);

  const toggle = (id: string) => (id === openId ? closeCard() : setOpenId(id));

  const handlePointKeyDown = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle(id);
  };

  return (
    <div ref={sectionRef} className={`calendar ${visible ? 'is-visible' : ''}`}>
        <div className={`calendar-figure ${open ? 'has-open-card' : ''}`}>
          <div className="chart-scroll" role="group" tabIndex={0} aria-label="Scrollable club event map">
            <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="group" aria-labelledby={chartTitleId}>
              <title id={chartTitleId}>The recurring rhythm of Rev Silicon club events</title>
              <path className="chart-line-underlay" d={path} pathLength="1" aria-hidden="true" />
              <path className="chart-line" d={path} pathLength="1" aria-hidden="true" />

              <g className="chart-points">
                {points.map((point, index) => {
                  const above = point.side === 'above';
                  const titleY = above ? point.y - 48 : point.y + 58;
                  const leaderStart = above ? point.y - 14 : point.y + 14;
                  const leaderEnd = above ? point.y - 34 : point.y + 34;
                  const isOpen = openId === point.id;

                  return (
                    <g
                      key={point.id}
                      ref={(node) => {
                        if (node) pointRefs.current.set(point.id, node);
                        else pointRefs.current.delete(point.id);
                      }}
                      className={`chart-point ${point.kind === 'milestone' ? 'is-milestone' : ''} ${isOpen ? 'is-open' : ''}`}
                      style={{ '--point-index': index } as CSSProperties}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? cardId : undefined}
                      aria-label={`${point.label}: ${point.title}`}
                      onClick={() => toggle(point.id)}
                      onKeyDown={(event) => handlePointKeyDown(event, point.id)}
                    >
                      <line className="point-leader" x1={point.x} y1={leaderStart} x2={point.x} y2={leaderEnd} />
                      <text className="point-name" x={point.x} y={titleY} textAnchor="middle">{point.label}</text>
                      <circle className="point-halo" cx={point.x} cy={point.y} r="14" />
                      <circle className="point-dot" cx={point.x} cy={point.y} r="6" />
                      <circle className="point-hit" cx={point.x} cy={point.y} r="26" />
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {open ? (
            <div className="event-detail-layer">
              <button className="event-detail-backdrop" type="button" aria-label="Close event details" onClick={closeCard} />
              <article
                className="event-detail"
                id={cardId}
                key={open.id}
                ref={cardRef}
                role="dialog"
                aria-labelledby={cardTitleId}
                tabIndex={-1}
              >
                <p className="event-detail-meta">{open.phase} · {kindLabel[open.kind]}</p>
                <h3 id={cardTitleId}>{open.title}</h3>
                <p>{open.detail}</p>
                <button className="event-detail-close" type="button" aria-label="Close event details" onClick={closeCard}>
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </button>
              </article>
            </div>
          ) : null}
        </div>
    </div>
  );
}

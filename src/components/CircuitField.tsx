import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../motion';

type Point = readonly [number, number];

type Segment = {
  readonly from: Point;
  readonly to: Point;
  readonly start: number;
  readonly size: number;
};

/** Two-tone copper: mostly maroon, with a navy layer underneath for depth. */
type Tone = 'maroon' | 'navy';

type Trace = {
  readonly points: readonly Point[];
  readonly segments: readonly Segment[];
  readonly length: number;
  readonly tone: Tone;
};

type Signal = {
  readonly trace: Trace;
  distance: number;
  readonly speed: number;
  readonly tail: number;
};

/** Eight routing directions, clockwise from east. Even indices are orthogonal. */
const DIRECTIONS: readonly Point[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const GLOW_RADIUS = 230;

function buildTrace(points: readonly Point[], tone: Tone): Trace {
  const segments: Segment[] = [];
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]!;
    const to = points[index]!;
    const size = Math.hypot(to[0] - from[0], to[1] - from[1]);
    segments.push({ from, to, start: length, size });
    length += size;
  }
  return { points, segments, length, tone };
}

function pointAt(trace: Trace, distance: number): Point {
  const clamped = Math.min(Math.max(distance, 0), trace.length);
  const segment = trace.segments.find((entry) => clamped <= entry.start + entry.size) ?? trace.segments[trace.segments.length - 1]!;
  const t = segment.size === 0 ? 0 : (clamped - segment.start) / segment.size;
  return [segment.from[0] + (segment.to[0] - segment.from[0]) * t, segment.from[1] + (segment.to[1] - segment.from[1]) * t];
}

/**
 * Routes traces the way a board router would: mostly straight runs with paired
 * 45 degree bends, never sharing a grid cell and never crossing on a diagonal.
 */
function routeTraces(width: number, height: number, pitch: number) {
  const columns = Math.ceil(width / pitch) + 2;
  const rows = Math.ceil(height / pitch) + 2;
  const used = new Uint8Array(columns * rows);
  const crossed = new Uint8Array(columns * rows);
  const traces: Trace[] = [];
  const target = Math.round((columns * rows) / 8.5);

  for (let attempt = 0; attempt < target * 10 && traces.length < target; attempt += 1) {
    let column = Math.floor(Math.random() * columns);
    let row = Math.floor(Math.random() * rows);
    if (used[row * columns + column]) continue;

    let direction = Math.floor(Math.random() * 4) * 2;
    let diagonalLeft = 0;
    let bend = 1;
    const cells: Point[] = [[column, row]];
    used[row * columns + column] = 1;
    const steps = 3 + Math.floor(Math.random() * 14);

    for (let step = 0; step < steps; step += 1) {
      if (direction % 2 === 0 && step > 1 && Math.random() < 0.2) {
        bend = Math.random() < 0.5 ? 1 : 7;
        direction = (direction + bend) % 8;
        diagonalLeft = 1 + Math.floor(Math.random() * 3);
      } else if (direction % 2 === 1) {
        diagonalLeft -= 1;
        // Leave the diagonal either completing a 90 degree turn or resuming the original heading.
        if (diagonalLeft <= 0) direction = (direction + (Math.random() < 0.5 ? bend : 8 - bend)) % 8;
      }

      const [dx, dy] = DIRECTIONS[direction]!;
      const nextColumn = column + dx;
      const nextRow = row + dy;
      if (nextColumn < 0 || nextRow < 0 || nextColumn >= columns || nextRow >= rows) break;
      if (used[nextRow * columns + nextColumn]) break;
      if (dx !== 0 && dy !== 0) {
        const square = Math.min(row, nextRow) * columns + Math.min(column, nextColumn);
        if (crossed[square]) break;
        crossed[square] = 1;
      }
      column = nextColumn;
      row = nextRow;
      used[row * columns + column] = 1;
      cells.push([column, row]);
    }

    if (cells.length < 4) continue;

    // Keep only the corners so each trace strokes as one clean polyline.
    const corners: Point[] = [cells[0]!];
    for (let index = 1; index < cells.length - 1; index += 1) {
      const previous = cells[index - 1]!;
      const current = cells[index]!;
      const next = cells[index + 1]!;
      if (current[0] - previous[0] !== next[0] - current[0] || current[1] - previous[1] !== next[1] - current[1]) corners.push(current);
    }
    corners.push(cells[cells.length - 1]!);
    const tone: Tone = traces.length % 3 === 1 ? 'navy' : 'maroon';
    traces.push(buildTrace(corners.map(([c, r]) => [(c - 0.5) * pitch, (r - 0.5) * pitch] as const), tone));
  }
  return traces;
}

function paintTraces(context: CanvasRenderingContext2D, traces: readonly Trace[], stroke: string, via: string, lineWidth: number) {
  context.lineWidth = lineWidth;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = stroke;
  context.beginPath();
  traces.forEach((trace) => {
    trace.points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
  });
  context.stroke();

  context.strokeStyle = via;
  context.fillStyle = '#06101d';
  traces.forEach((trace, index) => {
    const ends = index % 3 === 0 ? [trace.points[0]!, trace.points[trace.points.length - 1]!] : [trace.points[trace.points.length - 1]!];
    ends.forEach(([x, y]) => {
      context.beginPath();
      context.arc(x, y, 2.7, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    });
  });
}

const SIGNAL = {
  maroon: { tail: '226, 130, 140', core: 'rgba(255,244,245,1)', mid: 'rgba(232,160,168,0.95)', halo: '170,20,40' },
  navy: { tail: '138, 176, 228', core: 'rgba(236,244,255,1)', mid: 'rgba(160,196,240,0.95)', halo: '74,118,178' },
} as const;

function createSprite(tone: Tone) {
  const colors = SIGNAL[tone];
  const sprite = document.createElement('canvas');
  sprite.width = 48;
  sprite.height = 48;
  const context = sprite.getContext('2d');
  if (context) {
    const glow = context.createRadialGradient(24, 24, 0, 24, 24, 24);
    glow.addColorStop(0, colors.core);
    glow.addColorStop(0.16, colors.mid);
    glow.addColorStop(0.42, `rgba(${colors.halo},0.35)`);
    glow.addColorStop(1, `rgba(${colors.halo},0)`);
    context.fillStyle = glow;
    context.fillRect(0, 0, 48, 48);
  }
  return sprite;
}

/**
 * The fixed backdrop behind the dark pages: a routed copper field, a few
 * signals running along it, and the traces under the cursor lighting up.
 */
export function CircuitField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduceMotion = prefersReducedMotion();
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const base = document.createElement('canvas');
    const lit = document.createElement('canvas');
    const glow = document.createElement('canvas');
    const baseContext = base.getContext('2d');
    const litContext = lit.getContext('2d');
    const glowContext = glow.getContext('2d');
    if (!baseContext || !litContext || !glowContext) return;
    const sprites = { maroon: createSprite('maroon'), navy: createSprite('navy') };

    let width = 0;
    let height = 0;
    let ratio = 1;
    let traces: Trace[] = [];
    let longTraces: Trace[] = [];
    const signals: Signal[] = [];
    const pointer = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, strength: 0, active: false };

    const layout = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      [canvas, base, lit].forEach((target) => {
        target.width = Math.round(width * ratio);
        target.height = Math.round(height * ratio);
      });
      glow.width = Math.round(GLOW_RADIUS * 2 * ratio);
      glow.height = glow.width;

      const pitch = width < 700 ? 24 : 26;
      traces = routeTraces(width, height, pitch);
      longTraces = traces.filter((trace) => trace.length > pitch * 6);
      signals.length = 0;

      [baseContext, litContext].forEach((target) => {
        target.setTransform(ratio, 0, 0, ratio, 0, 0);
        target.clearRect(0, 0, width, height);
      });
      const maroon = traces.filter((trace) => trace.tone === 'maroon');
      const navy = traces.filter((trace) => trace.tone === 'navy');
      paintTraces(baseContext, navy, 'rgba(56, 90, 136, 0.3)', 'rgba(82, 120, 170, 0.44)', 1.1);
      paintTraces(baseContext, maroon, 'rgba(150, 34, 48, 0.26)', 'rgba(176, 52, 66, 0.4)', 1.1);
      paintTraces(litContext, navy, 'rgba(150, 188, 236, 0.9)', 'rgba(196, 220, 250, 1)', 1.4);
      paintTraces(litContext, maroon, 'rgba(236, 188, 194, 0.95)', 'rgba(255, 236, 238, 1)', 1.4);
    };

    const spawn = () => {
      const trace = longTraces[Math.floor(Math.random() * longTraces.length)];
      if (!trace) return;
      signals.push({ trace, distance: 0, speed: 70 + Math.random() * 90, tail: 34 + Math.random() * 30 });
    };

    const drawSignal = (signal: Signal) => {
      const samples = 9;
      context.lineCap = 'round';
      for (let index = 0; index < samples; index += 1) {
        const a = pointAt(signal.trace, signal.distance - (signal.tail * index) / samples);
        const b = pointAt(signal.trace, signal.distance - (signal.tail * (index + 1)) / samples);
        context.strokeStyle = `rgba(${SIGNAL[signal.trace.tone].tail}, ${(0.85 * (1 - index / samples)).toFixed(3)})`;
        context.lineWidth = 1.8;
        context.beginPath();
        context.moveTo(a[0], a[1]);
        context.lineTo(b[0], b[1]);
        context.stroke();
      }
      const [x, y] = pointAt(signal.trace, signal.distance);
      context.drawImage(sprites[signal.trace.tone], x - 12, y - 12, 24, 24);
    };

    const paint = (delta: number) => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(base, 0, 0);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Cursor light: the bright copy of the field, faded out radially around the pointer.
      pointer.x += (pointer.targetX - pointer.x) * 0.14;
      pointer.y += (pointer.targetY - pointer.y) * 0.14;
      pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
      if (pointer.strength > 0.01) {
        const size = glow.width;
        const radius = GLOW_RADIUS * ratio;
        glowContext.globalCompositeOperation = 'source-over';
        glowContext.clearRect(0, 0, size, size);
        const falloff = glowContext.createRadialGradient(radius, radius, 0, radius, radius, radius);
        falloff.addColorStop(0, `rgba(0,0,0,${(0.9 * pointer.strength).toFixed(3)})`);
        falloff.addColorStop(0.55, `rgba(0,0,0,${(0.28 * pointer.strength).toFixed(3)})`);
        falloff.addColorStop(1, 'rgba(0,0,0,0)');
        glowContext.fillStyle = falloff;
        glowContext.fillRect(0, 0, size, size);
        glowContext.globalCompositeOperation = 'source-in';
        glowContext.drawImage(lit, pointer.x * ratio - radius, pointer.y * ratio - radius, size, size, 0, 0, size, size);

        const haze = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, GLOW_RADIUS);
        haze.addColorStop(0, `rgba(120, 0, 18, ${(0.2 * pointer.strength).toFixed(3)})`);
        haze.addColorStop(1, 'rgba(120, 0, 18, 0)');
        context.fillStyle = haze;
        context.fillRect(pointer.x - GLOW_RADIUS, pointer.y - GLOW_RADIUS, GLOW_RADIUS * 2, GLOW_RADIUS * 2);
        context.drawImage(glow, pointer.x - GLOW_RADIUS, pointer.y - GLOW_RADIUS, GLOW_RADIUS * 2, GLOW_RADIUS * 2);
      }

      if (reduceMotion) return;
      const limit = Math.round(Math.min(Math.max((width * height) / 85000, 6), 18));
      if (signals.length < limit && Math.random() < 0.06) spawn();
      for (let index = signals.length - 1; index >= 0; index -= 1) {
        const signal = signals[index]!;
        signal.distance += signal.speed * delta;
        if (signal.distance - signal.tail > signal.trace.length) signals.splice(index, 1);
        else drawSignal(signal);
      }
    };

    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < 22) return;
      last = now;
      paint(Math.min(elapsed, 64) / 1000);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      if (!pointer.active) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      }
      pointer.active = true;
      if (reduceMotion) paint(0);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.active = false;
      if (reduceMotion) paint(0);
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        // Mobile browsers resize on every toolbar show/hide; only re-route on real changes.
        if (Math.abs(window.innerWidth - width) < 2 && Math.abs(window.innerHeight - height) < 120) return;
        layout();
        paint(0);
      }, 160);
    };

    layout();
    paint(0);
    if (!reduceMotion) frame = requestAnimationFrame(loop);
    if (finePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerout', onPointerOut);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="circuit-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

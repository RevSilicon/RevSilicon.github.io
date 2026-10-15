import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { chipModuleUrl, revsiliconLogoUrl } from '../assets';
import { chipName } from '../data/site';
import { prefersReducedMotion } from '../motion';

/**
 * The Rev Silicon accelerator module, rebuilt in 3D from the reference render
 * (assets/chip-module.webp). Every part is placed in that image's pixel space so
 * the model stays in register with it: the board spans x 85..1003, y 62..1310.
 * At the module's real-world size one image pixel is 0.1 mm, so standard part
 * footprints (an 0402 is 10 x 5 px) drop straight in.
 */
const BOARD = { left: 85, top: 62, right: 1003, bottom: 1310 } as const;
const CENTER_X = (BOARD.left + BOARD.right) / 2;
const CENTER_Y = (BOARD.top + BOARD.bottom) / 2;
/** World units per image pixel. */
const UNIT = 0.01;
const BOARD_THICKNESS = 0.16;
const CORNER = 20;
/** Shallow edge notches, mirrored on both sides of the board. */
const NOTCHES = [[392, 462], [1060, 1112]] as const;

const wx = (px: number) => (px - CENTER_X) * UNIT;
const wy = (py: number) => (CENTER_Y - py) * UNIT;

type Rect = { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
type Round = { readonly x: number; readonly y: number; readonly r: number };
type Connector = Rect & { readonly height: number; readonly rows: number; readonly pins: number; readonly tongue?: boolean };
type Qfp = { readonly x: number; readonly y: number; readonly size: number; readonly leads: number };
type Smd = Rect & { readonly height: number; readonly vertical: boolean; readonly tone: number };

const SIDE_ROWS = [490, 558, 627, 695, 763, 832, 900];
const TOP_INDUCTOR_X = [390, 467, 545, 622, 699];

const LAYOUT = {
  lid: { x: 543, y: 694, w: 463, h: 501 },
  substrate: { x: 544, y: 706, w: 528, h: 557 },
  capacitors: [
    { x: 175, y: 212, r: 33 }, { x: 175, y: 287, r: 33 },
    { x: 241, y: 175, r: 30 }, { x: 318, y: 175, r: 30 },
    { x: 241, y: 240, r: 30 }, { x: 318, y: 240, r: 30 },
  ],
  inductors: [
    ...TOP_INDUCTOR_X.map((x) => ({ x, y: 286, w: 64, h: 66 })),
    ...SIDE_ROWS.flatMap((y) => [{ x: 221, y, w: 58, h: 58 }, { x: 867, y, w: 58, h: 58 }]),
  ],
  silverInductors: [445, 511, 575, 641].map((x) => ({ x, y: 1136, w: 54, h: 66 })),
  /** Power stages: black body with an exposed tab at the lower end. */
  fets: [
    ...TOP_INDUCTOR_X.flatMap((x) => [x - 15, x + 15].map((fx) => ({ x: fx, y: 360, w: 24, h: 48 }))),
    ...[360, 390, 692, 720].map((x) => ({ x, y: 1140, w: 24, h: 60 })),
  ],
  /** Black parts with a white ceramic top, flanking the die. */
  ceramicParts: SIDE_ROWS.flatMap((y) => [{ x: 167, y, w: 34, h: 40 }, { x: 922, y, w: 34, h: 40 }]),
  /** Molded power inductors with tinned end caps. */
  moldedInductors: [
    ...[120, 155, 188].map((y) => ({ x: 724, y, w: 46, h: 30 })),
    ...[172, 212, 250, 286].map((y) => ({ x: 812, y, w: 62, h: 36 })),
  ],
  modules: [{ x: 300, y: 1105, w: 62, h: 60 }, { x: 770, y: 1105, w: 62, h: 60 }],
  chips: [
    { x: 548, y: 125, w: 52, h: 46 }, { x: 632, y: 125, w: 46, h: 46 }, { x: 433, y: 190, w: 30, h: 30 },
    { x: 192, y: 126, w: 30, h: 30 }, { x: 832, y: 340, w: 36, h: 36 }, { x: 175, y: 432, w: 36, h: 36 },
    { x: 920, y: 432, w: 36, h: 36 }, { x: 120, y: 505, w: 24, h: 30 }, { x: 120, y: 545, w: 24, h: 30 },
    { x: 968, y: 505, w: 24, h: 30 }, { x: 968, y: 545, w: 24, h: 30 }, { x: 397, y: 1030, w: 30, h: 30 },
    { x: 516, y: 1050, w: 34, h: 34 }, { x: 677, y: 1032, w: 40, h: 40 }, { x: 243, y: 1258, w: 30, h: 40 },
    { x: 850, y: 1278, w: 30, h: 30 }, { x: 800, y: 1160, w: 32, h: 32 }, { x: 120, y: 965, w: 30, h: 30 },
  ],
  goldPads: [
    ...[388, 428, 460, 492, 528, 560, 594, 628, 660, 693].map((x) => ({ x, y: 230, w: 18, h: 18 })),
    { x: 172, y: 380, w: 36, h: 34 }, { x: 180, y: 345, w: 30, h: 18 }, { x: 457, y: 1055, w: 30, h: 30 },
    { x: 610, y: 1055, w: 30, h: 30 }, { x: 925, y: 968, w: 34, h: 34 }, { x: 163, y: 963, w: 24, h: 30 },
    { x: 117, y: 852, w: 32, h: 28 }, { x: 117, y: 886, w: 32, h: 28 }, { x: 850, y: 1238, w: 40, h: 30 },
    { x: 832, y: 980, w: 22, h: 30 },
  ],
  qfps: [{ x: 195, y: 1150, size: 78, leads: 16 }, { x: 855, y: 1075, size: 64, leads: 13 }] satisfies readonly Qfp[],
  connectors: [
    { x: 375, y: 97, w: 234, h: 71, height: 0.3, rows: 1, pins: 14 },
    { x: 907, y: 245, w: 69, h: 240, height: 0.34, rows: 2, pins: 26 },
    { x: 944, y: 1147, w: 48, h: 135, height: 0.22, rows: 1, pins: 12 },
    { x: 388, y: 1245, w: 233, h: 95, height: 0.3, rows: 2, pins: 30, tongue: true },
    { x: 694, y: 1245, w: 232, h: 95, height: 0.3, rows: 2, pins: 30, tongue: true },
  ] satisfies readonly Connector[],
  holes: [
    { x: 118, y: 97, r: 22 }, { x: 815, y: 97, r: 22 }, { x: 968, y: 97, r: 22 },
    { x: 110, y: 1043, r: 14 }, { x: 975, y: 1043, r: 14 },
    { x: 115, y: 1273, r: 22 }, { x: 542, y: 1277, r: 22 }, { x: 970, y: 1273, r: 22 },
    { x: 188, y: 1281, r: 10 }, { x: 897, y: 1281, r: 10 },
  ] satisfies readonly Round[],
} as const;

/** Small deterministic PRNG so the scattered passives land the same way every load. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function requireContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required to paint the module textures.');
  return context;
}

type PathTarget = {
  moveTo(x: number, y: number): unknown;
  lineTo(x: number, y: number): unknown;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): unknown;
};

/** Draws the board outline into either a canvas path or a THREE.Shape. */
function traceOutline(path: PathTarget, map: (x: number, y: number) => readonly [number, number]) {
  const { left, top, right, bottom } = BOARD;
  const move = (x: number, y: number) => path.moveTo(...map(x, y));
  const line = (x: number, y: number) => path.lineTo(...map(x, y));
  const curve = (cx: number, cy: number, x: number, y: number) => {
    const [px, py] = map(cx, cy);
    const [ex, ey] = map(x, y);
    path.quadraticCurveTo(px, py, ex, ey);
  };
  move(left + CORNER, top);
  line(right - CORNER, top);
  curve(right, top, right, top + CORNER);
  for (const [start, end] of NOTCHES) {
    line(right, start);
    line(right - 12, start + 12);
    line(right - 12, end - 12);
    line(right, end);
  }
  line(right, bottom - CORNER);
  curve(right, bottom, right - CORNER, bottom);
  line(left + CORNER, bottom);
  curve(left, bottom, left, bottom - CORNER);
  for (const [start, end] of [...NOTCHES].reverse()) {
    line(left, end);
    line(left + 12, end - 12);
    line(left + 12, start + 12);
    line(left, start);
  }
  line(left, top + CORNER);
  curve(left, top, left + CORNER, top);
}

const overlaps = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;

const pad = (rect: Rect, amount: number): Rect => ({ ...rect, w: rect.w + amount * 2, h: rect.h + amount * 2 });

/** Fills the open board area with 0402 to 0805 passives, the dense texture that makes the render read as real. */
function scatterPassives(random: () => number): Smd[] {
  const blocked: Rect[] = [
    pad(LAYOUT.substrate, 14),
    ...LAYOUT.capacitors.map((c) => ({ x: c.x, y: c.y, w: c.r * 2 + 12, h: c.r * 2 + 12 })),
    ...[
      ...LAYOUT.inductors, ...LAYOUT.silverInductors, ...LAYOUT.fets, ...LAYOUT.ceramicParts,
      ...LAYOUT.moldedInductors, ...LAYOUT.modules, ...LAYOUT.chips, ...LAYOUT.goldPads,
      ...LAYOUT.connectors,
    ].map((rect) => pad(rect, 6)),
    ...LAYOUT.qfps.map((q) => ({ x: q.x, y: q.y, w: q.size + 26, h: q.size + 26 })),
    ...LAYOUT.holes.map((h) => ({ x: h.x, y: h.y, w: h.r * 2 + 12, h: h.r * 2 + 12 })),
  ];
  const sizes = [[10, 5, 0.035], [12, 6, 0.04], [16, 8, 0.05], [20, 12, 0.065]] as const;
  const placed: Smd[] = [];
  for (let attempt = 0; attempt < 14000 && placed.length < 950; attempt += 1) {
    const [length, width, height] = sizes[Math.floor(random() * sizes.length)] ?? sizes[0];
    const vertical = random() < 0.45;
    const part = {
      x: BOARD.left + 26 + random() * (BOARD.right - BOARD.left - 52),
      y: BOARD.top + 22 + random() * (BOARD.bottom - BOARD.top - 44),
      w: vertical ? width : length,
      h: vertical ? length : width,
    };
    const footprint = pad(part, 4);
    if (blocked.some((rect) => overlaps(footprint, rect))) continue;
    if (placed.some((rect) => overlaps(footprint, rect))) continue;
    const roll = random();
    placed.push({ ...part, height, vertical, tone: roll < 0.52 ? 0 : roll < 0.9 ? 1 : 2 });
  }
  return placed;
}

type Paint = {
  readonly mask: string;
  readonly speck: string;
  readonly trace: string;
  readonly gold: string;
  readonly hole: string;
};

const COLOR_PAINT: Paint = { mask: '#0a0a0c', speck: '#141418', trace: '#18181d', gold: '#c49b4b', hole: '#020203' };
/** Roughness lives in green and metalness in blue, the channels three.js samples. */
const PBR_PAINT: Paint = {
  mask: 'rgb(0,150,28)',
  speck: 'rgb(0,138,28)',
  trace: 'rgb(0,118,52)',
  gold: 'rgb(0,72,255)',
  hole: 'rgb(0,255,0)',
};

type Trace = readonly (readonly [number, number])[];

/** Exposed gold runs from the render: edge keep-out lines and the bus lines above and below the socket. */
const GOLD_RUNS: readonly (readonly [number, number, number, number])[] = [
  [100, 140, 100, 382], [988, 140, 988, 382], [100, 475, 100, 1046], [988, 475, 988, 1046],
  [100, 1124, 100, 1250], [988, 1124, 988, 1250],
  [300, 408, 420, 408], [446, 408, 560, 408], [612, 408, 700, 408], [722, 408, 792, 408],
  [312, 1002, 420, 1002], [470, 1002, 600, 1002], [648, 1002, 780, 1002],
];

function planTraces(random: () => number): Trace[] {
  const traces: Trace[] = [];
  for (let index = 0; index < 150; index += 1) {
    let x = BOARD.left + 30 + random() * (BOARD.right - BOARD.left - 60);
    let y = BOARD.top + 30 + random() * (BOARD.bottom - BOARD.top - 60);
    const points: [number, number][] = [[x, y]];
    for (let leg = 0; leg < 3; leg += 1) {
      const length = 20 + random() * 120;
      if (leg % 2 === 0) x += random() < 0.5 ? -length : length;
      else y += random() < 0.5 ? -length : length;
      x = THREE.MathUtils.clamp(x, BOARD.left + 26, BOARD.right - 26);
      y = THREE.MathUtils.clamp(y, BOARD.top + 26, BOARD.bottom - 26);
      points.push([x, y]);
    }
    traces.push(points);
  }
  return traces;
}

function paintBoard(context: CanvasRenderingContext2D, paint: Paint, smds: readonly Smd[], traces: readonly Trace[], vias: readonly Round[], random: () => number) {
  const { left, top, right, bottom } = BOARD;
  context.fillStyle = paint.mask;
  context.fillRect(left - 4, top - 4, right - left + 8, bottom - top + 8);

  context.fillStyle = paint.speck;
  for (let index = 0; index < 2600; index += 1) {
    context.fillRect(left + random() * (right - left), top + random() * (bottom - top), 1.4, 1.4);
  }

  context.strokeStyle = paint.trace;
  context.lineWidth = 2.4;
  context.lineJoin = 'round';
  traces.forEach((trace) => {
    context.beginPath();
    trace.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)));
    context.stroke();
  });

  context.strokeStyle = paint.gold;
  context.fillStyle = paint.gold;

  // Plated rim and the inner keep-out line that follows it.
  context.lineWidth = 7;
  context.beginPath();
  traceOutline(context, (x, y) => [x, y]);
  context.closePath();
  context.stroke();
  context.lineWidth = 2;
  GOLD_RUNS.forEach(([x1, y1, x2, y2]) => {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  });

  // Socket brackets around the package substrate.
  const { substrate } = LAYOUT;
  const halfW = substrate.w / 2 + 10;
  const halfH = substrate.h / 2 + 10;
  context.lineWidth = 3;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx = 1, sy = 1]) => {
    const cx = substrate.x + sx * halfW;
    const cy = substrate.y + sy * halfH;
    context.beginPath();
    context.moveTo(cx - sx * 34, cy);
    context.lineTo(cx, cy);
    context.lineTo(cx, cy - sy * 34);
    context.stroke();
  });

  // Decoupling pads along the socket and the row above the lower inductors.
  for (let y = 446; y <= 968; y += 13) {
    context.fillRect(264, y, 8, 5);
    context.fillRect(816, y, 8, 5);
  }
  for (let x = 420; x <= 668; x += 12) context.fillRect(x, 1083, 7, 10);

  LAYOUT.goldPads.forEach((p) => context.fillRect(p.x - p.w / 2 - 2, p.y - p.h / 2 - 2, p.w + 4, p.h + 4));

  // Copper lands under every passive, peeking out past the terminals.
  smds.forEach((smd) => {
    const land = smd.vertical ? smd.h * 0.32 : smd.w * 0.32;
    if (smd.vertical) {
      context.fillRect(smd.x - smd.w / 2 - 1.5, smd.y - smd.h / 2 - 1.5, smd.w + 3, land + 1.5);
      context.fillRect(smd.x - smd.w / 2 - 1.5, smd.y + smd.h / 2 - land, smd.w + 3, land + 1.5);
    } else {
      context.fillRect(smd.x - smd.w / 2 - 1.5, smd.y - smd.h / 2 - 1.5, land + 1.5, smd.h + 3);
      context.fillRect(smd.x + smd.w / 2 - land, smd.y - smd.h / 2 - 1.5, land + 1.5, smd.h + 3);
    }
  });

  vias.forEach((via) => {
    context.beginPath();
    context.arc(via.x, via.y, via.r, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = paint.hole;
  vias.forEach((via) => {
    context.beginPath();
    context.arc(via.x, via.y, via.r * 0.42, 0, Math.PI * 2);
    context.fill();
  });

  // Mounting holes: plated annulus around the drill.
  LAYOUT.holes.forEach((hole) => {
    context.fillStyle = paint.gold;
    context.beginPath();
    context.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = paint.hole;
    context.beginPath();
    context.arc(hole.x, hole.y, hole.r * 0.55, 0, Math.PI * 2);
    context.fill();
  });
}

function createBoardTextures(smds: readonly Smd[], anisotropy: number) {
  const width = 1024;
  const scale = width / (BOARD.right - BOARD.left);
  const height = Math.round((BOARD.bottom - BOARD.top) * scale);
  const traces = planTraces(mulberry32(7));
  const viaRandom = mulberry32(11);
  const vias: Round[] = [];
  for (let index = 0; index < 260; index += 1) {
    vias.push({
      x: BOARD.left + 24 + viaRandom() * (BOARD.right - BOARD.left - 48),
      y: BOARD.top + 24 + viaRandom() * (BOARD.bottom - BOARD.top - 48),
      r: 2 + viaRandom() * 1.4,
    });
  }

  const textures = [COLOR_PAINT, PBR_PAINT].map((paint, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = requireContext(canvas);
    context.setTransform(scale, 0, 0, scale, -BOARD.left * scale, -BOARD.top * scale);
    paintBoard(context, paint, smds, traces, vias, mulberry32(23));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = index === 0 ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = anisotropy;
    // ExtrudeGeometry's cap UVs are raw world x/y, so map those back onto the image.
    texture.repeat.set(1 / ((BOARD.right - BOARD.left) * UNIT), 1 / ((BOARD.bottom - BOARD.top) * UNIT));
    texture.offset.set(0.5, 0.5);
    return texture;
  });
  return { map: textures[0]!, pbr: textures[1]! };
}

/** The lid: fine bead-blasted nickel with the Rev mark printed on it. */
function createLidTextures(anisotropy: number) {
  const width = 1024;
  const height = Math.round((width * LAYOUT.lid.h) / LAYOUT.lid.w);
  const random = mulberry32(31);

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const color = requireContext(colorCanvas);
  const image = color.createImageData(width, height);
  for (let y = 0, index = 0; y < height; y += 1) {
    const rowTone = (random() - 0.5) * 3;
    for (let x = 0; x < width; x += 1, index += 4) {
      const falloff = Math.sin((x / width) * Math.PI) * 5 + Math.sin((y / height) * Math.PI) * 4;
      const value = 188 + rowTone + falloff + (random() - 0.5) * 10;
      image.data[index] = value + 5;
      image.data[index + 1] = value + 2;
      image.data[index + 2] = value - 4;
      image.data[index + 3] = 255;
    }
  }
  color.putImageData(image, 0, 0);
  const sheen = color.createLinearGradient(0, 0, width, height);
  sheen.addColorStop(0, 'rgba(255,255,255,.16)');
  sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(60,52,44,.16)');
  color.fillStyle = sheen;
  color.fillRect(0, 0, width, height);
  const inset = 26;
  color.lineWidth = 4;
  color.strokeStyle = 'rgba(70,62,52,.16)';
  color.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  color.lineWidth = 2;
  color.strokeStyle = 'rgba(255,255,255,.45)';
  color.strokeRect(inset + 3, inset + 3, width - inset * 2 - 6, height - inset * 2 - 6);

  const pbrCanvas = document.createElement('canvas');
  pbrCanvas.width = width;
  pbrCanvas.height = height;
  const pbr = requireContext(pbrCanvas);
  pbr.fillStyle = 'rgb(0,92,225)';
  pbr.fillRect(0, 0, width, height);

  // The chip's name, laser-etched under the mark: darker and matte, so it reads at any angle.
  const engraving = { font: `500 ${Math.round(width * 0.04)}px "IBM Plex Mono", monospace`, y: height * 0.935 };
  [color, pbr].forEach((target, index) => {
    target.font = engraving.font;
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    target.letterSpacing = `${Math.round(width * 0.012)}px`;
    target.fillStyle = index === 0 ? 'rgba(62,54,46,.62)' : 'rgb(0,170,40)';
    target.fillText(chipName, width / 2, engraving.y);
  });

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  const pbrMap = new THREE.CanvasTexture(pbrCanvas);
  pbrMap.colorSpace = THREE.NoColorSpace;
  pbrMap.anisotropy = anisotropy;

  const logo = new Image();
  logo.onload = () => {
    const drawHeight = height * 0.74;
    const drawWidth = (drawHeight * logo.width) / logo.height;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2 - height * 0.035;
    // Printed ink sits a touch deeper and more saturated than the flat logo file.
    color.filter = 'saturate(1.45) brightness(0.74)';
    color.drawImage(logo, x, y, drawWidth, drawHeight);
    color.filter = 'none';

    // The printed mark is ink, not metal: knock metalness out under it.
    const silhouette = document.createElement('canvas');
    silhouette.width = width;
    silhouette.height = height;
    const mask = requireContext(silhouette);
    mask.drawImage(logo, x, y, drawWidth, drawHeight);
    mask.globalCompositeOperation = 'source-in';
    mask.fillStyle = 'rgb(0,195,10)';
    mask.fillRect(0, 0, width, height);
    pbr.drawImage(silhouette, 0, 0);

    map.needsUpdate = true;
    pbrMap.needsUpdate = true;
  };
  logo.src = revsiliconLogoUrl;
  return { map, pbr: pbrMap };
}

type AssemblyStep = {
  readonly object: THREE.Object3D;
  readonly restZ: number;
  readonly delay: number;
  readonly duration: number;
  readonly lift: number;
};

function buildModule(anisotropy: number) {
  const module = new THREE.Group();
  const random = mulberry32(5);
  const smds = scatterPassives(mulberry32(3));
  const boardTextures = createBoardTextures(smds, anisotropy);
  const lidTextures = createLidTextures(anisotropy);
  const steps: AssemblyStep[] = [];
  const queue = (object: THREE.Object3D, delay: number, lift: number, duration = 700) => {
    steps.push({ object, restZ: object.position.z, delay, duration, lift });
  };

  const material = {
    board: new THREE.MeshStandardMaterial({
      map: boardTextures.map,
      roughnessMap: boardTextures.pbr,
      metalnessMap: boardTextures.pbr,
      roughness: 1,
      metalness: 1,
    }),
    boardEdge: new THREE.MeshStandardMaterial({ color: 0xa3803a, roughness: 0.38, metalness: 0.85 }),
    mold: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.42, metalness: 0.08 }),
    moldSoft: new THREE.MeshStandardMaterial({ color: 0x1e1e21, roughness: 0.6, metalness: 0.05 }),
    ferrite: new THREE.MeshStandardMaterial({ color: 0x504d49, roughness: 0.66, metalness: 0.22 }),
    silverFerrite: new THREE.MeshStandardMaterial({ color: 0xb9b1a4, roughness: 0.36, metalness: 0.62, envMapIntensity: 0.8 }),
    aluminum: new THREE.MeshStandardMaterial({ color: 0xcac4b9, roughness: 0.3, metalness: 0.9, envMapIntensity: 0.85 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.85, metalness: 0 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe2b65e, roughness: 0.26, metalness: 1 }),
    barrel: new THREE.MeshStandardMaterial({ color: 0xb08a40, roughness: 0.34, metalness: 1, side: THREE.DoubleSide }),
    tin: new THREE.MeshStandardMaterial({ color: 0xd0d1d0, roughness: 0.3, metalness: 0.9 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xeeebe4, roughness: 0.45, metalness: 0 }),
    shell: new THREE.MeshStandardMaterial({ color: 0xc2c1bc, roughness: 0.28, metalness: 0.92 }),
    substrate: new THREE.MeshStandardMaterial({ color: 0x131915, roughness: 0.5, metalness: 0.25 }),
    lid: new THREE.MeshStandardMaterial({ color: 0xb4afa5, roughness: 0.36, metalness: 0.9, envMapIntensity: 0.78 }),
    lidTop: new THREE.MeshStandardMaterial({
      map: lidTextures.map,
      roughnessMap: lidTextures.pbr,
      metalnessMap: lidTextures.pbr,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 0.78,
    }),
    passive: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 }),
  };

  const geometryCache = new Map<string, THREE.BufferGeometry>();
  const roundedBox = (width: number, height: number, depth: number, radius: number) => {
    const key = [width, height, depth, radius].map((value) => value.toFixed(4)).join('|');
    let geometry = geometryCache.get(key);
    if (!geometry) {
      const safeRadius = Math.min(radius, width / 2 - 0.001, height / 2 - 0.001, depth / 2 - 0.001);
      geometry = safeRadius > 0.002
        ? new RoundedBoxGeometry(width, height, depth, 2, safeRadius)
        : new THREE.BoxGeometry(width, height, depth);
      geometryCache.set(key, geometry);
    }
    return geometry;
  };

  /** A part on the board, given in image pixels, `height` in world units. */
  const part = (parent: THREE.Object3D, rect: Rect, height: number, partMaterial: THREE.Material, options: { z?: number; radius?: number; shadow?: boolean } = {}) => {
    const mesh = new THREE.Mesh(roundedBox(rect.w * UNIT, rect.h * UNIT, height, (options.radius ?? 3) * UNIT), partMaterial);
    mesh.position.set(wx(rect.x), wy(rect.y), (options.z ?? 0) + height / 2);
    mesh.castShadow = options.shadow ?? height > 0.12;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Board: the extruded outline with real drill holes.
  const shape = new THREE.Shape();
  traceOutline(shape, (x, y) => [wx(x), wy(y)]);
  LAYOUT.holes.forEach((hole) => {
    const drill = new THREE.Path();
    drill.absarc(wx(hole.x), wy(hole.y), hole.r * 0.55 * UNIT, 0, Math.PI * 2, true);
    shape.holes.push(drill);
  });
  const boardGeometry = new THREE.ExtrudeGeometry(shape, { depth: BOARD_THICKNESS, bevelEnabled: false, curveSegments: 18 });
  boardGeometry.translate(0, 0, -BOARD_THICKNESS);
  const board = new THREE.Mesh(boardGeometry, [material.board, material.boardEdge]);
  board.receiveShadow = true;
  module.add(board);

  LAYOUT.holes.forEach((hole) => {
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(hole.r * 0.55 * UNIT, hole.r * 0.55 * UNIT, BOARD_THICKNESS, 24, 1, true),
      material.barrel,
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(wx(hole.x), wy(hole.y), -BOARD_THICKNESS / 2);
    module.add(barrel);
  });

  // Passives: one instanced body mesh plus one for the tinned terminals.
  const passives = new THREE.Group();
  const bodyMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material.passive, smds.length);
  const terminalMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material.tin, smds.length * 2);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const identity = new THREE.Quaternion();
  const tones = [new THREE.Color(0x0f0f11), new THREE.Color(0x8f6b3f), new THREE.Color(0xc4beb2)];
  smds.forEach((smd, index) => {
    const length = smd.vertical ? smd.h : smd.w;
    const cap = length * 0.22;
    position.set(wx(smd.x), wy(smd.y), smd.height / 2);
    scale.set((smd.vertical ? smd.w : smd.w - cap * 2) * UNIT, (smd.vertical ? smd.h - cap * 2 : smd.h) * UNIT, smd.height);
    bodyMesh.setMatrixAt(index, matrix.compose(position, identity, scale));
    bodyMesh.setColorAt(index, tones[smd.tone] ?? tones[0]!);
    [-1, 1].forEach((side, end) => {
      const offset = (length / 2 - cap / 2) * side;
      position.set(wx(smd.x + (smd.vertical ? 0 : offset)), wy(smd.y + (smd.vertical ? offset : 0)), smd.height / 2);
      scale.set((smd.vertical ? smd.w : cap) * UNIT, (smd.vertical ? cap : smd.h) * UNIT, smd.height + 0.006);
      terminalMesh.setMatrixAt(index * 2 + end, matrix.compose(position, identity, scale));
    });
  });
  bodyMesh.instanceMatrix.needsUpdate = true;
  if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
  terminalMesh.instanceMatrix.needsUpdate = true;
  passives.add(bodyMesh, terminalMesh);
  module.add(passives);
  queue(passives, 0, 0.8, 650);

  // Flat-pack ICs with gull-wing leads.
  LAYOUT.qfps.forEach((qfp) => {
    const group = new THREE.Group();
    part(group, { x: qfp.x, y: qfp.y, w: qfp.size, h: qfp.size }, 0.1, material.mold, { radius: 2 });
    const leads = new THREE.InstancedMesh(new THREE.BoxGeometry(3 * UNIT, 10 * UNIT, 0.022), material.gold, qfp.leads * 4);
    const pitch = (qfp.size - 14) / (qfp.leads - 1);
    let index = 0;
    for (let side = 0; side < 4; side += 1) {
      for (let lead = 0; lead < qfp.leads; lead += 1) {
        const along = -qfp.size / 2 + 7 + lead * pitch;
        const out = qfp.size / 2 + 4;
        const [dx, dy] = side === 0 ? [along, -out] : side === 1 ? [out, along] : side === 2 ? [along, out] : [-out, along];
        const rotate = side % 2 === 1;
        matrix.makeRotationZ(rotate ? Math.PI / 2 : 0);
        matrix.setPosition(wx(qfp.x + dx), wy(qfp.y + dy), 0.011);
        leads.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    leads.instanceMatrix.needsUpdate = true;
    group.add(leads);
    module.add(group);
    queue(group, 120 + random() * 420, 1.3);
  });

  LAYOUT.chips.forEach((rect) => queue(part(module, rect, 0.08, material.mold, { radius: 2 }), 120 + random() * 420, 1.3));
  LAYOUT.goldPads.forEach((rect) => queue(part(module, rect, 0.022, material.gold, { radius: 1 }), 80 + random() * 300, 0.9));

  LAYOUT.fets.forEach((rect) => {
    const group = new THREE.Group();
    part(group, { ...rect, h: rect.h - 14, y: rect.y - 7 }, 0.1, material.mold, { radius: 2 });
    part(group, { x: rect.x, y: rect.y + rect.h / 2 - 8, w: rect.w - 4, h: 16 }, 0.04, material.tin, { radius: 1 });
    module.add(group);
    queue(group, 220 + random() * 420, 1.5);
  });

  LAYOUT.ceramicParts.forEach((rect) => {
    const group = new THREE.Group();
    part(group, rect, 0.14, material.mold, { radius: 3 });
    part(group, { x: rect.x, y: rect.y - 3, w: rect.w - 12, h: rect.w - 12 }, 0.02, material.ceramic, { z: 0.14, radius: 1 });
    module.add(group);
    queue(group, 260 + random() * 420, 1.6);
  });

  LAYOUT.moldedInductors.forEach((rect) => {
    const group = new THREE.Group();
    part(group, { ...rect, w: rect.w - 10 }, 0.2, material.mold, { radius: 3 });
    [-1, 1].forEach((side) => part(group, { x: rect.x + side * (rect.w / 2 - 5), y: rect.y, w: 10, h: rect.h - 4 }, 0.18, material.tin, { radius: 2 }));
    module.add(group);
    queue(group, 380 + random() * 380, 1.9);
  });

  // Tall parts: power inductors, bulk capacitors, modules, connectors.
  let order = 0;
  const nextTall = () => 460 + (order += 1) * 22;
  LAYOUT.inductors.forEach((rect) => queue(part(module, rect, 0.4, material.ferrite, { radius: 4 }), nextTall(), 2.2));
  LAYOUT.silverInductors.forEach((rect) => queue(part(module, rect, 0.38, material.silverFerrite, { radius: 5 }), nextTall(), 2.2));
  LAYOUT.modules.forEach((rect) => queue(part(module, rect, 0.3, material.moldSoft, { radius: 7 }), nextTall(), 2.2));

  LAYOUT.capacitors.forEach((capacitor) => {
    const radius = capacitor.r * UNIT;
    const height = 0.64;
    const group = new THREE.Group();
    group.position.set(wx(capacitor.x), wy(capacitor.y), 0);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.04, radius * 1.04, 0.06, 40), material.rubber);
    base.rotation.x = Math.PI / 2;
    base.position.z = 0.03;
    const can = new THREE.Mesh(
      new THREE.LatheGeometry([
        new THREE.Vector2(0, 0.05), new THREE.Vector2(radius, 0.05), new THREE.Vector2(radius, height - 0.06),
        new THREE.Vector2(radius * 0.97, height - 0.02), new THREE.Vector2(radius * 0.9, height),
        new THREE.Vector2(radius * 0.86, height - 0.008), new THREE.Vector2(0, height - 0.008),
      ], 48),
      material.aluminum,
    );
    can.rotation.x = Math.PI / 2;
    can.castShadow = true;
    group.add(base, can);
    module.add(group);
    queue(group, nextTall(), 2.6);
  });

  LAYOUT.connectors.forEach((connector) => {
    const group = new THREE.Group();
    const wall = 7;
    const { x, y, w, h, height } = connector;
    part(group, { x, y: y - h / 2 + wall / 2, w, h: wall }, height, material.shell, { radius: 1.5 });
    part(group, { x, y: y + h / 2 - wall / 2, w, h: wall }, height, material.shell, { radius: 1.5 });
    part(group, { x: x - w / 2 + wall / 2, y, w: wall, h: h - wall * 2 }, height, material.shell, { radius: 1.5 });
    part(group, { x: x + w / 2 - wall / 2, y, w: wall, h: h - wall * 2 }, height, material.shell, { radius: 1.5 });
    part(group, { x, y, w: w - wall * 2, h: h - wall * 2 }, height * 0.3, material.mold, { radius: 1, shadow: false });
    const horizontal = w >= h;
    const innerAlong = (horizontal ? w : h) - wall * 2 - 16;
    const innerAcross = (horizontal ? h : w) - wall * 2;
    if (connector.tongue) {
      part(group, { x, y, w: horizontal ? innerAlong + 8 : innerAcross * 0.3, h: horizontal ? innerAcross * 0.3 : innerAlong + 8 }, height * 0.72, material.mold, { radius: 1.5, shadow: false });
    }
    const pinLength = connector.tongue ? 9 : Math.min(14, innerAcross * 0.3);
    const pinGeometry = new THREE.BoxGeometry((horizontal ? 3 : pinLength) * UNIT, (horizontal ? pinLength : 3) * UNIT, height * 0.5);
    const pins = new THREE.InstancedMesh(pinGeometry, material.gold, connector.rows * connector.pins);
    const pitch = innerAlong / connector.pins;
    let index = 0;
    for (let row = 0; row < connector.rows; row += 1) {
      const across = connector.rows === 1 ? 0 : (row === 0 ? -1 : 1) * (connector.tongue ? innerAcross * 0.15 + pinLength / 2 + 1 : innerAcross * 0.22);
      for (let pin = 0; pin < connector.pins; pin += 1) {
        const along = -innerAlong / 2 + pitch * (pin + 0.5);
        matrix.makeTranslation(
          wx(x + (horizontal ? along : across)),
          wy(y + (horizontal ? across : along)),
          height * 0.3 + height * 0.25,
        );
        pins.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    pins.instanceMatrix.needsUpdate = true;
    group.add(pins);
    module.add(group);
    queue(group, nextTall(), 2.4);
  });

  // The package: substrate first, then the lid seats on top of it.
  const substrate = part(module, LAYOUT.substrate, 0.1, material.substrate, { radius: 3 });
  queue(substrate, 1180, 2.8, 760);

  const lid = new THREE.Group();
  const lidHeight = 0.34;
  const lidRadius = 0.06;
  const lidBody = part(lid, LAYOUT.lid, lidHeight, material.lid, { z: 0.1, radius: lidRadius / UNIT });
  lidBody.castShadow = true;
  const lidTop = new THREE.Mesh(
    new THREE.PlaneGeometry(LAYOUT.lid.w * UNIT - lidRadius * 2, LAYOUT.lid.h * UNIT - lidRadius * 2),
    material.lidTop,
  );
  lidTop.position.set(wx(LAYOUT.lid.x), wy(LAYOUT.lid.y), 0.1 + lidHeight + 0.0015);
  lidTop.receiveShadow = true;
  lid.add(lidTop);
  module.add(lid);
  queue(lid, 1500, 3.6, 950);

  const dispose = () => {
    module.traverse((object) => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    geometryCache.forEach((geometry) => geometry.dispose());
    Object.values(material).forEach((entry) => entry.dispose());
    [boardTextures.map, boardTextures.pbr, lidTextures.map, lidTextures.pbr].forEach((texture) => texture.dispose());
  };

  return { module, steps, landingAt: 1500 + 950, dispose };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** Resting pose: tilted back like a board on a bench, turned a little toward the copy. */
const POSE = { x: -0.42, y: -0.3, z: -0.04 } as const;

export function ChipScene() {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;
    const reduceMotion = prefersReducedMotion();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (error) {
      console.warn('The module WebGL scene is unavailable; showing the reference render instead.', error);
      shell.classList.add('is-unavailable');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = environment;
    scene.environmentIntensity = 0.62;

    const { module, steps, landingAt, dispose } = buildModule(renderer.capabilities.getMaxAnisotropy());
    module.rotation.set(POSE.x, POSE.y, POSE.z);
    scene.add(module);

    const keyLight = new THREE.DirectionalLight(0xfff3e6, 2.05);
    keyLight.position.set(-5, 7, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.radius = 4;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    const shadowCamera = keyLight.shadow.camera;
    shadowCamera.left = -8;
    shadowCamera.right = 8;
    shadowCamera.top = 8;
    shadowCamera.bottom = -8;
    shadowCamera.near = 1;
    shadowCamera.far = 40;
    shadowCamera.updateProjectionMatrix();
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xbfd0e6, 0.55);
    fillLight.position.set(7, -3, 6);
    scene.add(fillLight);
    const warmLight = new THREE.PointLight(0xc23a48, 0, 22, 1.6);
    warmLight.position.set(3.5, -5, 4.5);
    scene.add(warmLight);
    const warmBase = 26;

    const camera = new THREE.PerspectiveCamera(24, 1, 0.5, 120);
    const resize = () => {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      camera.aspect = width / height;
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = Math.max(7.25 / tangent, 5.4 / (tangent * camera.aspect));
      camera.position.set(0, 0.2, distance);
      camera.lookAt(0, 0.1, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const state = { pointerX: 0, pointerY: 0, dragX: 0, dragY: 0, dragging: false, lastX: 0, lastY: 0 };
    const onPointerDown = (event: PointerEvent) => {
      state.dragging = true;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      state.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      if (!state.dragging) return;
      state.dragY = THREE.MathUtils.clamp(state.dragY + (event.clientX - state.lastX) * 0.007, -0.95, 0.95);
      state.dragX = THREE.MathUtils.clamp(state.dragX + (event.clientY - state.lastY) * 0.005, -0.5, 0.42);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      state.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const onPointerLeave = () => {
      state.pointerX = 0;
      state.pointerY = 0;
    };

    // Compile every program up front so the first frame's stall isn't spent
    // inside the assembly animation.
    renderer.compile(scene, camera);
    if (!reduceMotion) steps.forEach((step) => { step.object.visible = false; });

    let frame = 0;
    let visible = false;
    let introStart = -1;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!visible) return;
      if (introStart < 0) {
        // First visible frame: draw the bare board, then start the clock.
        renderer.render(scene, camera);
        introStart = performance.now();
        shell.classList.add('is-ready');
        return;
      }
      const elapsed = reduceMotion ? Number.POSITIVE_INFINITY : now - introStart;

      steps.forEach((step) => {
        const progress = THREE.MathUtils.clamp((elapsed - step.delay) / step.duration, 0, 1);
        step.object.visible = elapsed >= step.delay;
        const eased = step.lift > 3 ? easeOutQuart(progress) : easeOutCubic(progress);
        step.object.position.z = step.restZ + step.lift * (1 - eased);
      });

      // A maroon flare when the lid seats, settling to a low rim glow.
      const sinceLanding = elapsed - landingAt;
      const flare = sinceLanding > 0 && Number.isFinite(sinceLanding) ? Math.exp(-sinceLanding / 420) * 90 : 0;
      warmLight.intensity = (reduceMotion || sinceLanding > 0 ? warmBase : warmBase * THREE.MathUtils.clamp(elapsed / landingAt, 0, 1)) + flare;

      if (!state.dragging) {
        state.dragX *= 0.94;
        state.dragY *= 0.94;
      }
      const seconds = reduceMotion ? 0 : now / 1000;
      const targetX = POSE.x + Math.sin(seconds * 0.33) * 0.045 + state.pointerY * 0.16 + state.dragX;
      const targetY = POSE.y + Math.sin(seconds * 0.41) * 0.17 + state.pointerX * 0.24 + state.dragY;
      module.rotation.x += (targetX - module.rotation.x) * 0.07;
      module.rotation.y += (targetY - module.rotation.y) * 0.07;
      keyLight.position.x = -5 + state.pointerX * 9;
      keyLight.position.y = 7 - state.pointerY * 5;

      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    }, { rootMargin: '80px' });
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    resize();
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      dispose();
      environment.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="chip-shell" ref={shellRef}>
      <img className="chip-fallback" src={chipModuleUrl} alt="" />
      <canvas
        ref={canvasRef}
        className="chip-canvas"
        role="img"
        aria-label={`${chipName}, the Rev Silicon accelerator module, as an interactive 3D concept model. Drag to tilt it.`}
      />
    </div>
  );
}

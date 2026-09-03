import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { revsiliconLogoUrl } from '../assets';

/** Manual rounded-rect path so the die plate doesn't depend on CanvasRenderingContext2D.roundRect support. */
function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, size: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + size, y, x + size, y + size, radius);
  context.arcTo(x + size, y + size, x, y + size, radius);
  context.arcTo(x, y + size, x, y, radius);
  context.arcTo(x, y, x + size, y, radius);
  context.closePath();
}

type SceneState = {
  targetX: number;
  targetY: number;
  dragging: boolean;
  pointerX: number;
  pointerY: number;
  startX: number;
  startY: number;
};

function requireContext(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required to create accelerator materials.');
  return context;
}

function createDieTexture() {
  /** Rendered at 2x the old 512px canvas so the die reads sharp at close camera range instead of blocky. */
  const size = 1024;
  const scale = size / 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = requireContext(canvas);
  context.fillStyle = '#0b1017';
  context.fillRect(0, 0, size, size);

  const sheen = context.createLinearGradient(0, 0, size, size);
  sheen.addColorStop(0, 'rgba(209,221,236,.22)');
  sheen.addColorStop(0.48, 'rgba(112,139,172,.08)');
  sheen.addColorStop(1, 'rgba(112,139,172,0)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, size, size);

  const padding = 34 * scale;
  const span = size - padding * 2;
  const cellSize = span / 4;
  context.strokeStyle = 'rgba(201,217,236,.48)';
  context.lineWidth = 1.2 * scale;
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      const x = padding + column * cellSize + 5 * scale;
      const y = padding + row * cellSize + 5 * scale;
      const cellInset = cellSize - 10 * scale;
      context.strokeRect(x, y, cellInset, cellInset);
      context.fillStyle = 'rgba(164,188,216,.11)';
      context.fillRect(x, y, cellInset, cellInset);
      const quadrant = (cellInset - 9 * scale) / 2;
      context.fillStyle = 'rgba(219,228,239,.22)';
      for (let qx = 0; qx < 2; qx += 1) {
        for (let qy = 0; qy < 2; qy += 1) {
          context.fillRect(
            x + 3 * scale + qx * (quadrant + 3 * scale),
            y + 3 * scale + qy * (quadrant + 3 * scale),
            quadrant,
            quadrant,
          );
        }
      }
    }
  }

  const center = size / 2;
  /** Plate spans the four center grid cells so the logo reads clearly without zooming in. */
  const plateSize = 224 * scale;
  const plateX = center - plateSize / 2;
  const plateY = center - plateSize / 2;
  const plateRadius = 20 * scale;
  roundedRectPath(context, plateX, plateY, plateSize, plateRadius);
  context.fillStyle = '#f1eee8';
  context.fill();
  context.strokeStyle = '#8c2230';
  context.lineWidth = 3 * scale;
  context.stroke();
  context.strokeStyle = 'rgba(241,238,232,.46)';
  context.lineWidth = 1.2 * scale;
  context.strokeRect(padding - 12 * scale, padding - 12 * scale, span + 24 * scale, span + 24 * scale);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  /** The die badge draws in asynchronously once the brand logo image decodes. */
  const badge = new Image();
  badge.onload = () => {
    const boxSize = plateSize - 28 * scale;
    const badgeScale = Math.min(boxSize / badge.width, boxSize / badge.height);
    const drawWidth = badge.width * badgeScale;
    const drawHeight = badge.height * badgeScale;
    context.save();
    roundedRectPath(context, plateX, plateY, plateSize, plateRadius);
    context.clip();
    context.drawImage(badge, center - drawWidth / 2, center - drawHeight / 2, drawWidth, drawHeight);
    context.restore();
    texture.needsUpdate = true;
  };
  badge.src = revsiliconLogoUrl;

  return texture;
}

function createBrandTexture() {
  /** Rendered at 2x so the plate text stays crisp instead of soft/blocky up close. */
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = requireContext(canvas);
  const background = context.createLinearGradient(0, 0, 1024, 0);
  background.addColorStop(0, '#30353b');
  background.addColorStop(1, '#1d2126');
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 256);
  context.fillStyle = '#f1eee8';
  context.fillRect(32, 86, 84, 84);
  context.fillStyle = '#500000';
  context.fillRect(50, 104, 48, 48);
  context.fillStyle = '#f1eee8';
  context.font = '500 78px Archivo, Helvetica, Arial, sans-serif';
  context.fillText('REV SILICON', 156, 156);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createEnvironmentTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = requireContext(canvas);
  const gradient = context.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, '#68717c');
  gradient.addColorStop(0.38, '#252c34');
  gradient.addColorStop(0.52, '#0b1016');
  gradient.addColorStop(1, '#05080c');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 128);
  context.fillStyle = 'rgba(255,255,255,.92)';
  context.fillRect(36, 5, 76, 17);
  context.fillStyle = 'rgba(224,231,239,.48)';
  context.fillRect(170, 10, 46, 11);
  context.fillStyle = 'rgba(140,34,48,.22)';
  context.fillRect(10, 60, 60, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildAccelerator() {
  const card = new THREE.Group();
  const graphite = new THREE.MeshStandardMaterial({ color: 0x343a42, metalness: 0.92, roughness: 0.34 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1b2026, metalness: 0.84, roughness: 0.48 });
  const pcbMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1820, metalness: 0.24, roughness: 0.76 });
  const finMaterial = new THREE.MeshStandardMaterial({ color: 0x4b545e, metalness: 0.96, roughness: 0.24 });
  const silverMaterial = new THREE.MeshStandardMaterial({ color: 0xd7d9d8, metalness: 0.94, roughness: 0.2 });
  const maroonMaterial = new THREE.MeshStandardMaterial({
    color: 0x8c1420,
    metalness: 0.5,
    roughness: 0.32,
    emissive: 0x3a0008,
    emissiveIntensity: 0.46,
  });
  const dieMaterial = new THREE.MeshStandardMaterial({
    map: createDieTexture(),
    metalness: 0.54,
    roughness: 0.4,
    emissive: 0x0a1420,
    emissiveIntensity: 0.25,
  });
  const brandMaterial = new THREE.MeshStandardMaterial({ map: createBrandTexture(), metalness: 0.7, roughness: 0.4 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0x9f8a5c, metalness: 1, roughness: 0.32 });

  const box = (
    width: number,
    height: number,
    depth: number,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    card.add(mesh);
    return mesh;
  };

  box(6.68, 0.035, 3.08, silverMaterial, 0, -0.355, 0);
  box(6.6, 0.1, 3, darkMetal, 0, -0.28, 0);
  box(6.3, 0.09, 2.7, pcbMaterial, 0, -0.16, 0);
  box(6.3, 0.025, 0.06, maroonMaterial, 0, -0.1, 1.36);

  const radiusX = 3.15;
  const radiusZ = 1.35;
  const cornerRadius = 0.16;
  const shroudShape = new THREE.Shape();
  shroudShape.moveTo(-radiusX + cornerRadius, -radiusZ);
  shroudShape.lineTo(radiusX - cornerRadius, -radiusZ);
  shroudShape.quadraticCurveTo(radiusX, -radiusZ, radiusX, -radiusZ + cornerRadius);
  shroudShape.lineTo(radiusX, radiusZ - cornerRadius);
  shroudShape.quadraticCurveTo(radiusX, radiusZ, radiusX - cornerRadius, radiusZ);
  shroudShape.lineTo(-radiusX + cornerRadius, radiusZ);
  shroudShape.quadraticCurveTo(-radiusX, radiusZ, -radiusX, radiusZ - cornerRadius);
  shroudShape.lineTo(-radiusX, -radiusZ + cornerRadius);
  shroudShape.quadraticCurveTo(-radiusX, -radiusZ, -radiusX + cornerRadius, -radiusZ);

  const fanOpening = (centerX: number) => {
    const opening = new THREE.Path();
    opening.absarc(centerX, 0, 0.95, 0, Math.PI * 2, true);
    return opening;
  };
  shroudShape.holes.push(fanOpening(-2.05), fanOpening(2.05));
  const dieOpening = new THREE.Path();
  dieOpening.moveTo(-0.95, -0.95);
  dieOpening.lineTo(-0.95, 0.95);
  dieOpening.lineTo(0.95, 0.95);
  dieOpening.lineTo(0.95, -0.95);
  dieOpening.lineTo(-0.95, -0.95);
  shroudShape.holes.push(dieOpening);

  const shroudGeometry = new THREE.ExtrudeGeometry(shroudShape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 4,
    curveSegments: 64,
  });
  shroudGeometry.rotateX(-Math.PI / 2);
  const shroud = new THREE.Mesh(shroudGeometry, graphite);
  shroud.position.y = 0.34;
  card.add(shroud);
  const shroudOutline = new THREE.LineSegments(
    new THREE.EdgesGeometry(shroudGeometry, 24),
    new THREE.LineBasicMaterial({ color: 0xf4f0e9, transparent: true, opacity: 0.34 }),
  );
  shroudOutline.position.copy(shroud.position);
  card.add(shroudOutline);

  for (let index = 0; index < 30; index += 1) {
    const x = -3 + index * 0.207;
    if (Math.abs(x) < 1.05) continue;
    box(0.024, 0.3, 2.35, finMaterial, x, 0.02, 0);
  }

  box(2, 0.13, 2, graphite, 0, 0.02, 0);
  const dieFrame = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.018, 16, 4), maroonMaterial);
  dieFrame.rotation.x = Math.PI / 2;
  dieFrame.rotation.z = Math.PI / 4;
  dieFrame.position.y = 0.1;
  card.add(dieFrame);
  const die = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.55), dieMaterial);
  die.rotation.x = -Math.PI / 2;
  die.position.y = 0.092;
  card.add(die);
  box(1.62, 0.05, 1.62, darkMetal, 0, 0.06, 0);

  [-0.86, 0.86].forEach((x) => {
    [-0.55, 0.55].forEach((z) => box(0.28, 0.1, 0.62, darkMetal, x, 0.09, z));
  });

  [-2.05, 2.05].forEach((x) => {
    const fan = new THREE.Group();
    fan.name = 'fan-rotor';
    fan.position.set(x, 0.3, 0);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.14, 48), graphite);
    fan.add(hub);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), maroonMaterial);
    badge.rotation.x = -Math.PI / 2;
    badge.position.y = 0.075;
    fan.add(badge);
    for (let index = 0; index < 9; index += 1) {
      const bladeMaterial = index % 3 === 0 ? silverMaterial : finMaterial;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.016, 0.24), bladeMaterial);
      const angle = (index / 9) * Math.PI * 2;
      blade.position.set(Math.cos(angle) * 0.52, 0, Math.sin(angle) * 0.52);
      blade.rotation.y = -angle;
      blade.rotation.z = 0.28;
      fan.add(blade);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.03, 16, 64), graphite);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    fan.add(ring);
    card.add(fan);
  });

  const brandPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), brandMaterial);
  brandPlate.rotation.x = -Math.PI / 2;
  brandPlate.position.set(0, 0.762, -1.06);
  card.add(brandPlate);
  box(2.4, 0.05, 0.16, goldMaterial, -0.4, -0.2, 1.44);
  return card;
}

function createContactShadow() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = requireContext(canvas);
  const gradient = context.createRadialGradient(128, 128, 10, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(0,0,0,.58)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.2), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.72;
  return shadow;
}

function StaticAccelerator() {
  return (
    <div className="accelerator-static" aria-hidden="true">
      <div className="static-board">
        <div className="static-fan fan-left" />
        <div className="static-die"><span /><span /><span /><span /></div>
        <div className="static-fan fan-right" />
        <div className="static-brand-plate">REV SILICON</div>
      </div>
    </div>
  );
}

export function AcceleratorScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<SceneState>({
    targetX: 0.3,
    targetY: -0.62,
    dragging: false,
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
  });
  const resetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch (error) {
      console.warn('The accelerator WebGL scene is unavailable; using the static fallback.', error);
      canvas.parentElement?.classList.add('is-unavailable');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const environment = createEnvironmentTexture();
    scene.environment = environment;
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 200);
    const accelerator = buildAccelerator();
    accelerator.rotation.set(0.3, -0.62, 0);
    scene.add(accelerator);
    scene.add(createContactShadow());
    const acceleratorBounds = new THREE.Box3().setFromObject(accelerator);
    const acceleratorSphere = acceleratorBounds.getBoundingSphere(new THREE.Sphere());
    const cameraFit = { minimum: 1, maximum: 1, current: 1 };

    scene.add(new THREE.HemisphereLight(0xd8e0e8, 0x05080c, 0.94));
    const keyLight = new THREE.DirectionalLight(0xfffcf5, 2.8);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xb7c6d8, 1.35);
    rimLight.position.set(-6, 3, -4);
    scene.add(rimLight);
    const warmLight = new THREE.PointLight(0x8c2230, 4.4, 12, 2);
    warmLight.position.set(0, 0.9, 0);
    scene.add(warmLight);

    const resize = () => {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      const aspect = Math.max(0.4, width / height);
      camera.aspect = aspect;
      const verticalFov = (camera.fov * Math.PI) / 180;
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
      const fitFov = Math.min(verticalFov, horizontalFov);
      const fitDistance = acceleratorSphere.radius / Math.sin(fitFov / 2);
      cameraFit.minimum = fitDistance * 0.72;
      cameraFit.maximum = fitDistance * 1.03;
      const orientation = Math.pow(Math.abs(Math.sin(accelerator.rotation.y)), 2.4);
      cameraFit.current = THREE.MathUtils.lerp(cameraFit.minimum, cameraFit.maximum, orientation);
      camera.position.set(0, cameraFit.current * 0.28, cameraFit.current * 0.96);
      camera.lookAt(acceleratorSphere.center.x, acceleratorSphere.center.y - 0.12, acceleratorSphere.center.z);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const onPointerDown = (event: PointerEvent) => {
      stateRef.current.dragging = true;
      stateRef.current.startX = event.clientX;
      stateRef.current.startY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.16;
      stateRef.current.pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.1;
      if (!stateRef.current.dragging) return;
      stateRef.current.targetY += (event.clientX - stateRef.current.startX) * 0.006;
      stateRef.current.targetX = THREE.MathUtils.clamp(
        stateRef.current.targetX + (event.clientY - stateRef.current.startY) * 0.004,
        -0.15,
        1.05,
      );
      stateRef.current.startX = event.clientX;
      stateRef.current.startY = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      stateRef.current.dragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const onPointerLeave = () => {
      stateRef.current.dragging = false;
      stateRef.current.pointerX = 0;
      stateRef.current.pointerY = 0;
    };
    /** Idle drift is paused briefly after a reset so the snap-back is visible. */
    let driftResumesAt = 0;
    const reset = () => {
      const state = stateRef.current;
      state.dragging = false;
      state.pointerX = 0;
      state.pointerY = 0;
      state.targetX = 0.3;
      state.targetY = Math.round((state.targetY + 0.62) / (Math.PI * 2)) * Math.PI * 2 - 0.62;
      driftResumesAt = performance.now() + 1100;
    };
    resetRef.current = reset;

    let frame = 0;
    let visible = true;
    const fanRotors = accelerator.getObjectsByProperty('name', 'fan-rotor');
    const render = (now: number) => {
      if (visible) {
        if (!stateRef.current.dragging && !reduceMotion && now >= driftResumesAt) stateRef.current.targetY += 0.0014;
        accelerator.rotation.y += (stateRef.current.targetY + stateRef.current.pointerX - accelerator.rotation.y) * 0.06;
        accelerator.rotation.x += (stateRef.current.targetX + stateRef.current.pointerY - accelerator.rotation.x) * 0.06;
        const orientation = Math.pow(Math.abs(Math.sin(accelerator.rotation.y)), 2.4);
        const targetDistance = THREE.MathUtils.lerp(cameraFit.minimum, cameraFit.maximum, orientation);
        cameraFit.current += (targetDistance - cameraFit.current) * 0.045;
        camera.position.set(0, cameraFit.current * 0.28, cameraFit.current * 0.96);
        camera.lookAt(acceleratorSphere.center.x, acceleratorSphere.center.y - 0.12, acceleratorSphere.center.z);
        if (!reduceMotion) fanRotors.forEach((fan, index) => { fan.rotation.y -= 0.052 + index * 0.006; });
        keyLight.position.x = 4 + stateRef.current.pointerX * 12;
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
    }, { rootMargin: '120px' });
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('dblclick', reset);
    resize();
    render(performance.now());

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('dblclick', reset);
      resetRef.current = null;
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          const materialWithMap = material as THREE.Material & { map?: THREE.Texture | null };
          materialWithMap.map?.dispose();
          material.dispose();
        });
      });
      environment.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="accelerator-shell">
      <StaticAccelerator />
      <canvas
        ref={canvasRef}
        className="accelerator-canvas"
        aria-label="Interactive conceptual AI inference accelerator. Drag to rotate and double-click to reset."
      />
      <div className="accelerator-meta" aria-hidden="true">
        <span>ACCELERATOR I / CONCEPT MODEL</span>
        <span>INFERENCE ACCELERATOR CLASS · NOT TO SPECIFICATION</span>
      </div>
      <button className="reset-view" type="button" onClick={() => resetRef.current?.()}>
        Reset view
      </button>
    </div>
  );
}

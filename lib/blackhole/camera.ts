export type Vec3 = [number, number, number];

export interface RaymarchCamera {
  distance: number;
  latitude: number;
  longitude: number;

  target: Vec3;

  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;

  rotateSpeed: number;
  zoomSpeed: number;

  minDistance: number;
  maxDistance: number;

  minLatitude: number;
  maxLatitude: number;
}

export interface CameraFrame {
  position: Vec3;
  target: Vec3;
  up: Vec3;
}

export function createCamera(): RaymarchCamera {
  return {
    distance: 30,
    latitude: (15 * Math.PI) / 180,
    longitude: 0,

    target: [0, 0, 0],

    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,

    rotateSpeed: 0.005,
    zoomSpeed: 1.1,

    minDistance: 5,
    maxDistance: 120,

    minLatitude: (-85 * Math.PI) / 180,
    maxLatitude: (85 * Math.PI) / 180,
  };
}

export function setupCameraControls(
  canvas: HTMLCanvasElement,
  camera: RaymarchCamera,
  onCameraChange?: () => void
): () => void {
  const onMouseDown = (event: MouseEvent) => {
    camera.isDragging = true;
    camera.lastMouseX = event.clientX;
    camera.lastMouseY = event.clientY;
  };

  const onMouseMove = (event: MouseEvent) => {
    if (!camera.isDragging) return;
    const dx = event.clientX - camera.lastMouseX;
    const dy = event.clientY - camera.lastMouseY;
    camera.longitude -= dx * camera.rotateSpeed;
    camera.latitude += dy * camera.rotateSpeed;
    camera.latitude = clamp(
      camera.latitude,
      camera.minLatitude,
      camera.maxLatitude
    );
    camera.lastMouseX = event.clientX;
    camera.lastMouseY = event.clientY;
    onCameraChange?.();
  };

  const onMouseUp = () => {
    camera.isDragging = false;
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? camera.zoomSpeed : 1 / camera.zoomSpeed;
    camera.distance *= zoomFactor;
    camera.distance = clamp(
      camera.distance,
      camera.minDistance,
      camera.maxDistance
    );
    onCameraChange?.();
  };

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    camera.isDragging = true;
    camera.lastMouseX = event.touches[0].clientX;
    camera.lastMouseY = event.touches[0].clientY;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!camera.isDragging || event.touches.length !== 1) return;
    event.preventDefault();
    const t = event.touches[0];
    const dx = t.clientX - camera.lastMouseX;
    const dy = t.clientY - camera.lastMouseY;
    camera.longitude -= dx * camera.rotateSpeed;
    camera.latitude += dy * camera.rotateSpeed;
    camera.latitude = clamp(
      camera.latitude,
      camera.minLatitude,
      camera.maxLatitude
    );
    camera.lastMouseX = t.clientX;
    camera.lastMouseY = t.clientY;
    onCameraChange?.();
  };

  const onTouchEnd = () => {
    camera.isDragging = false;
  };

  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: true });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd);

  return () => {
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
  };
}

export function getCameraFrame(camera: RaymarchCamera): CameraFrame {
  const cosLat = Math.cos(camera.latitude);

  const x =
    camera.target[0] +
    camera.distance * cosLat * Math.sin(camera.longitude);

  const y =
    camera.target[1] +
    camera.distance * Math.sin(camera.latitude);

  const z =
    camera.target[2] +
    camera.distance * cosLat * Math.cos(camera.longitude);

  return {
    position: [x, y, z],
    target: camera.target,
    up: [0, 1, 0],
  };
}

export function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function length(v: Vec3): number {
  return Math.sqrt(dot(v, v));
}

export function normalize(v: Vec3): Vec3 {
  const len = length(v);

  if (len === 0) {
    return [0, 0, 0];
  }

  return [v[0] / len, v[1] / len, v[2] / len];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
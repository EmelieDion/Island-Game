import * as THREE from 'three/webgpu';

export const VILLAGE = new THREE.Vector2(-1.5, 2);
export const WINDMILL = new THREE.Vector2(6.5, -4.5);

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const terrainHeight = (x, z) => {
  const r = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  const coast = 12.5 + 1.6 * Math.sin(3 * angle + 0.5) + 0.9 * Math.sin(5 * angle - 1.2);
  const land = 1 - smooth(0.55, 1.05, r / coast);

  const villageDistance = Math.hypot(x - VILLAGE.x, z - VILLAGE.y);
  const hillsAllowed = smooth(3.5, 7, villageDistance);
  const hills = (Math.sin(x * 0.35 + 1.3) * Math.cos(z * 0.31 - 0.7) * 0.9
    + Math.sin(x * 0.9 + z * 0.7) * 0.25) * hillsAllowed;

  const windmillHill = 1.8 * Math.exp(-((x - WINDMILL.x) ** 2 + (z - WINDMILL.y) ** 2) / 8);
  const seabed = Math.sin(x * 0.4) * Math.cos(z * 0.37) * 0.15;

  return -2.2 + seabed * (1 - land) + land * (2.9 + Math.max(hills, -0.4) + windmillHill);
};

const SEABED = new THREE.Color(0x8f8a63);
const WET_SAND = new THREE.Color(0xc7b07a);
const SAND = new THREE.Color(0xe9d39c);
const GRASS = new THREE.Color(0x5c9e45);
const GRASS_DARK = new THREE.Color(0x467f38);
const ROCK = new THREE.Color(0x857d74);

const paintTriangles = (geometry, pickColor) => {
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  const position = flat.attributes.position;
  const normal = flat.attributes.normal;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 3) {
    const x = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;
    const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3;
    const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3;
    pickColor(color, x, y, z, normal.getY(i), i);
    for (let k = 0; k < 3; k++) colors.set([color.r, color.g, color.b], (i + k) * 3);
  }

  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return flat;
};

const createTerrain = () => {
  const geometry = new THREE.PlaneGeometry(62, 62, 124, 124);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let z = position.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 30) {
      x *= 30 / r;
      z *= 30 / r;
      position.setX(i, x);
      position.setZ(i, z);
    }
    position.setY(i, terrainHeight(x, z));
  }
  geometry.computeVertexNormals();

  const painted = paintTriangles(geometry, (color, x, y, z, slope) => {
    if (y < -1.6) color.copy(SEABED);
    else if (y < 0.05) color.copy(WET_SAND);
    else if (y < 0.55) color.copy(SAND);
    else if (slope < 0.72) color.copy(ROCK);
    else color.copy(Math.sin(x * 1.7) * Math.cos(z * 1.3) > 0.1 ? GRASS_DARK : GRASS);
    color.offsetHSL(0, 0, Math.sin(x * 12.9898 + z * 78.233) * 0.02);
  });

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 });
  const mesh = new THREE.Mesh(painted, material);
  mesh.receiveShadow = true;
  return mesh;
};

const createRockBase = () => {
  const geometry = new THREE.ConeGeometry(30.5, 26, 40, 7, true);
  geometry.rotateX(Math.PI);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (Math.hypot(x, z) < 0.01 || y > 12.9) continue;
    const angle = Math.atan2(z, x);
    const bump = 1 + Math.sin(angle * 7 + y * 0.8) * 0.08 + Math.sin(angle * 13 - y * 1.3) * 0.05;
    position.setX(i, x * bump);
    position.setZ(i, z * bump);
  }
  geometry.computeVertexNormals();

  const layers = [0x7a5b43, 0x6b4f3a, 0x8a6a4e];
  const painted = paintTriangles(geometry, (color, x, y, z, slope, i) => {
    color.set(layers[Math.floor((y + 13) / 3.2) % 3]);
    if (y > 11.5) color.set(0x4f7a3a);
    color.offsetHSL(0, 0, Math.sin(i * 0.37) * 0.025);
  });

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  const mesh = new THREE.Mesh(painted, material);
  mesh.position.y = -15.4;
  return mesh;
};

export const createIsland = () => {
  const group = new THREE.Group();
  const terrain = createTerrain();
  group.add(terrain);
  group.add(createRockBase());

  return {
    mesh: group,
    terrain,
  };
};

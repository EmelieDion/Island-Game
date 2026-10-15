import * as THREE from 'three/webgpu';

const STRIPES = [0xe8463a, 0xffffff, 0xf6c23e, 0xffffff, 0x2f8fd8, 0xffffff];

export const BEACH_BALL_RADIUS = 0.35;

const createGeometry = () => {
  const geometry = new THREE.SphereGeometry(BEACH_BALL_RADIUS, 24, 16).toNonIndexed();
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 3) {
    const x = (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3;
    const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3;
    const z = (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3;
    const angle = Math.atan2(z, x) + Math.PI;
    const stripe = Math.floor((angle / (Math.PI * 2)) * STRIPES.length) % STRIPES.length;
    color.set(Math.abs(y) > BEACH_BALL_RADIUS * 0.88 ? 0xffffff : STRIPES[stripe]);
    for (let k = 0; k < 3; k++) colors.set([color.r, color.g, color.b], (i + k) * 3);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
};

const geometry = createGeometry();
const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 });

export const createBeachBall = () => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
};

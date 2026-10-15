import * as THREE from 'three/webgpu';

export const BARREL_RADIUS = 0.3;
export const BARREL_HEIGHT = 0.8;

const WOOD = new THREE.Color(0x9a6233);
const WOOD_DARK = new THREE.Color(0x7c4b26);
const METAL = new THREE.Color(0x4a4f57);

const createGeometry = () => {
  const geometry = new THREE.CylinderGeometry(BARREL_RADIUS, BARREL_RADIUS, BARREL_HEIGHT, 14, 6).toNonIndexed();
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const bulge = 1 + Math.cos((y / BARREL_HEIGHT) * Math.PI) * 0.12;
    position.setX(i, position.getX(i) * bulge);
    position.setZ(i, position.getZ(i) * bulge);
  }

  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 3) {
    const y = (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3;
    const angle = Math.atan2(position.getZ(i), position.getX(i));
    const band = Math.abs(Math.abs(y) - BARREL_HEIGHT * 0.3) < 0.05;
    const color = band ? METAL : (Math.floor((angle + Math.PI) * 2.2) % 2 ? WOOD : WOOD_DARK);
    for (let k = 0; k < 3; k++) colors.set([color.r, color.g, color.b], (i + k) * 3);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
};

const geometry = createGeometry();
const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true });

export const createBarrel = () => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
};

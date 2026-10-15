import * as THREE from 'three/webgpu';

export const ROCK_SIZE = 0.35;

const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });

export const createRock = () => {
  const seed = Math.random() * 100;
  const geometry = new THREE.IcosahedronGeometry(ROCK_SIZE, 1);
  const position = geometry.attributes.position;
  const point = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i);
    const bump = 0.8 + Math.sin(point.x * 9 + seed) * Math.cos(point.z * 7 - seed) * 0.15 + Math.sin(point.y * 11 + seed * 2) * 0.08;
    point.multiplyScalar(bump);
    point.y *= 0.8;
    position.setXYZ(i, point.x, point.y, point.z);
  }

  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i += 3) {
    color.setHSL(0.08, 0.06, 0.38 + Math.sin(i * 1.7 + seed) * 0.06);
    for (let k = 0; k < 3; k++) colors.set([color.r, color.g, color.b], (i + k) * 3);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
};

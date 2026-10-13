import * as THREE from 'three/webgpu';

export const createSea = () => {
  const geometry = new THREE.RingGeometry(0.01, 30, 160, 60);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshBasicNodeMaterial({ color: 0x1a6b8a });

  const mesh = new THREE.Mesh(geometry, material);

  return {
    mesh,
  };
};

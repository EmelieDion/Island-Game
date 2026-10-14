import * as THREE from 'three/webgpu';
import { uniform, mix, vec3, normalWorld, positionWorld, smoothstep, materialColor, vertexColor, min } from 'three/tsl';

export const snowCover = uniform(0);

const flatEnough = smoothstep(snowCover.mul(-0.6).add(1.0), snowCover.mul(-0.45).add(1.05), normalWorld.y);
const aboveBeach = smoothstep(0.4, 0.9, positionWorld.y);
const snowMask = flatEnough.mul(aboveBeach).mul(min(snowCover.mul(3.0), 1.0));

export const addSnow = (material) => {
  const snowy = new THREE.MeshStandardNodeMaterial({
    name: material.name,
    color: material.color,
    map: material.map,
    roughness: material.roughness,
    metalness: material.metalness,
    emissive: material.emissive,
    emissiveIntensity: material.emissiveIntensity,
    flatShading: material.flatShading,
  });
  const baseColor = material.vertexColors ? vertexColor() : materialColor;
  snowy.colorNode = mix(baseColor.rgb, vec3(0.93, 0.95, 1.0), snowMask);
  return snowy;
};

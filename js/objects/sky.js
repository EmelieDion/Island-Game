import * as THREE from 'three/webgpu';
import { wgslFn, uniform, positionLocal, normalize, colorSpaceToWorking, vec4 } from 'three/tsl';

import skyShader from '../shaders/sky/fragment.wgsl?raw';

export const createSky = () => {
  const uniforms = {
    iTime: uniform(0),
    sunDir: uniform(new THREE.Vector3(0.6, 0.75, 0.3).normalize()),
    day: uniform(1),
  };

  const sky = wgslFn(skyShader);
  const skyColor = sky({
    dir: normalize(positionLocal),
    sunDir: uniforms.sunDir,
    day: uniforms.day,
    iTime: uniforms.iTime,
  });

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false });
  material.colorNode = colorSpaceToWorking(vec4(skyColor.rgb, 1.0), THREE.SRGBColorSpace);

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), material);
  mesh.renderOrder = -1;

  const update = (elapsedTime) => {
    uniforms.iTime.value = elapsedTime;
  };

  return {
    mesh,
    update,
    uniforms,
  };
};

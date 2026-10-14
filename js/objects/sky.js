import * as THREE from 'three/webgpu';
import { wgslFn, uniform, positionLocal, normalize, colorSpaceToWorking, vec3, vec4 } from 'three/tsl';

import skyShader from '../shaders/sky/fragment.wgsl?raw';
import auroraShader from '../shaders/aurora/fragment.wgsl?raw';

export const createSky = () => {
  const uniforms = {
    iTime: uniform(0),
    sunDir: uniform(new THREE.Vector3(0.6, 0.75, 0.3).normalize()),
    day: uniform(1),
    aurora: uniform(0),
  };

  const dir = normalize(positionLocal);

  const sky = wgslFn(skyShader);
  const skyColor = sky({
    dir,
    sunDir: uniforms.sunDir,
    day: uniforms.day,
    iTime: uniforms.iTime,
  });

  const aurora = wgslFn(auroraShader);
  const auroraColor = aurora({
    rd: normalize(dir.add(vec3(0.0, 0.12, 0.0))),
    iTime: uniforms.iTime,
    amount: uniforms.aurora,
  });

  const combined = skyColor.rgb.mul(auroraColor.a.oneMinus()).add(auroraColor.rgb);

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false });
  material.colorNode = colorSpaceToWorking(vec4(combined, 1.0), THREE.SRGBColorSpace);

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

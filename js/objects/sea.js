import * as THREE from 'three/webgpu';
import { wgslFn, uniform, uv, positionLocal, sin, cos, vec3, colorSpaceToWorking } from 'three/tsl';

import seaShader from '../shaders/sea/fragment.wgsl?raw';

export const createSea = () => {
  const uniforms = {
    time: uniform(0),
    waveHeight: uniform(0.25),
    iTime: uniform(0),
    iResolution: uniform(new THREE.Vector2(1, 1)),
    glints: uniform(1),
    brightness: uniform(1),
  };

  const geometry = new THREE.RingGeometry(0.01, 30, 160, 60);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshBasicNodeMaterial();

  const p = positionLocal;
  const t = uniforms.time;
  const wave = sin(p.x.mul(0.55).add(t.mul(1.3))).mul(cos(p.z.mul(0.45).add(t.mul(0.9))))
    .add(sin(p.x.add(p.z).mul(0.9).add(t.mul(2.1))).mul(0.35))
    .mul(uniforms.waveHeight);
  material.positionNode = vec3(p.x, p.y.add(wave), p.z);

  const sea = wgslFn(seaShader);
  material.colorNode = colorSpaceToWorking(sea({
    fragCoord: uv().mul(7.0).fract().mul(uniforms.iResolution),
    iResolution: uniforms.iResolution,
    iTime: uniforms.iTime,
    glints: uniforms.glints,
  }), THREE.SRGBColorSpace).mul(uniforms.brightness);

  const mesh = new THREE.Mesh(geometry, material);

  const update = (deltaTime, mouse, day, wind) => {
    uniforms.time.value += deltaTime * (1 + wind * 1.5);
    uniforms.waveHeight.value = 0.2 + wind * 0.22;
    uniforms.iTime.value += deltaTime * (0.3 + mouse.x * 2.7 + wind * 1.5);
    const glintsTarget = 0.55 + (1 - mouse.y) * 0.45;
    uniforms.glints.value += (glintsTarget - uniforms.glints.value) * Math.min(1, deltaTime * 3);
    uniforms.brightness.value = 0.07 + day * 0.93;
  };

  return {
    mesh,
    update,
  };
};

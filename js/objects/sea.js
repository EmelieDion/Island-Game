import * as THREE from 'three/webgpu';
import { wgslFn, uniform, uv, positionLocal, sin, cos, vec3, mix, colorSpaceToWorking } from 'three/tsl';

import seaShader from '../shaders/sea/fragment.wgsl?raw';

const WALL_DEPTH = 2.7;

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

  const mesh = new THREE.Group();
  mesh.add(new THREE.Mesh(geometry, material));

  const wallGeometry = new THREE.CylinderGeometry(30, 30, WALL_DEPTH, 160, 1, true);
  wallGeometry.translate(0, -WALL_DEPTH / 2, 0);
  const wallMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
  wallMaterial.positionNode = vec3(p.x, p.y.add(wave.mul(p.y.div(WALL_DEPTH).add(1))), p.z);
  wallMaterial.colorNode = colorSpaceToWorking(
    mix(vec3(0.0, 0.08, 0.15), vec3(0.0, 0.3, 0.45), uv().y),
    THREE.SRGBColorSpace,
  ).mul(uniforms.brightness);
  mesh.add(new THREE.Mesh(wallGeometry, wallMaterial));

  const update = (deltaTime, mouse, day, wind) => {
    uniforms.time.value += deltaTime * (1 + wind * 1.5);
    uniforms.waveHeight.value = 0.2 + wind * 0.22;
    uniforms.iTime.value += deltaTime * (0.3 + mouse.x * 2.7 + wind * 1.5);
    const glintsTarget = 0.55 + (1 - mouse.y) * 0.45;
    uniforms.glints.value += (glintsTarget - uniforms.glints.value) * Math.min(1, deltaTime * 3);
    uniforms.brightness.value = 0.07 + day * 0.93;
  };

  const getHeight = (x, z) => {
    const t = uniforms.time.value;
    const wave = Math.sin(x * 0.55 + t * 1.3) * Math.cos(z * 0.45 + t * 0.9)
      + Math.sin((x + z) * 0.9 + t * 2.1) * 0.35;
    return wave * uniforms.waveHeight.value;
  };

  return {
    mesh,
    update,
    getHeight,
  };
};

import * as THREE from 'three/webgpu';
import { wgslFn, uniform, positionLocal, normalize, colorSpaceToWorking, vec3, vec4, texture, screenUV } from 'three/tsl';

import skyShader from '../shaders/sky/fragment.wgsl?raw';
import auroraShader from '../shaders/aurora/fragment.wgsl?raw';

const AURORA_SCALE = 0.25;

export const createSky = () => {
  const uniforms = {
    iTime: uniform(0),
    sunDir: uniform(new THREE.Vector3(0.6, 0.75, 0.3).normalize()),
    day: uniform(1),
    aurora: uniform(0),
    auroraVisible: uniform(0),
  };

  const geometry = new THREE.SphereGeometry(400, 48, 24);
  const dir = normalize(positionLocal);

  const aurora = wgslFn(auroraShader);
  const auroraMaterial = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, blending: THREE.NoBlending });
  auroraMaterial.colorNode = aurora({
    rd: normalize(dir.add(vec3(0.0, 0.12, 0.0))),
    iTime: uniforms.iTime,
    amount: uniforms.aurora,
  });

  const auroraScene = new THREE.Scene();
  auroraScene.add(new THREE.Mesh(geometry, auroraMaterial));

  const auroraTarget = new THREE.RenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });

  const sky = wgslFn(skyShader);
  const skyColor = sky({
    dir,
    sunDir: uniforms.sunDir,
    day: uniforms.day,
    iTime: uniforms.iTime,
  });

  const auroraColor = texture(auroraTarget.texture, screenUV).mul(uniforms.auroraVisible);
  const combined = skyColor.rgb.mul(auroraColor.a.oneMinus()).add(auroraColor.rgb);

  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false });
  material.colorNode = colorSpaceToWorking(vec4(combined, 1.0), THREE.SRGBColorSpace);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = -1;

  const drawingSize = new THREE.Vector2();

  const update = (elapsedTime, renderer, camera) => {
    uniforms.iTime.value = elapsedTime;

    const visible = uniforms.aurora.value > 0.001;
    uniforms.auroraVisible.value = visible ? 1 : 0;
    if (!visible) return;

    renderer.getDrawingBufferSize(drawingSize);
    const width = Math.max(1, Math.round(drawingSize.x * AURORA_SCALE));
    const height = Math.max(1, Math.round(drawingSize.y * AURORA_SCALE));
    if (auroraTarget.width !== width || auroraTarget.height !== height) auroraTarget.setSize(width, height);

    renderer.setRenderTarget(auroraTarget);
    renderer.render(auroraScene, camera);
    renderer.setRenderTarget(null);
  };

  return {
    mesh,
    update,
    uniforms,
  };
};

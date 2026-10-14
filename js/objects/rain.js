import * as THREE from 'three/webgpu';
import { Fn, If, instancedArray, instanceIndex, uniform, hash, vec2, vec3, vec4, float, select, length, uv } from 'three/tsl';

export const createRain = ({ count = 24000, radius = 30, height = 26, bottom = -1 } = {}) => {
  const uniforms = {
    amount: uniform(0),
    wind: uniform(new THREE.Vector2()),
    delta: uniform(0),
    brightness: uniform(1),
  };

  const positions = instancedArray(count, 'vec3');

  const computeInit = Fn(() => {
    const p = positions.element(instanceIndex);
    const angle = hash(instanceIndex).mul(Math.PI * 2);
    const distance = hash(instanceIndex.add(1234)).sqrt().mul(radius);
    p.x.assign(angle.cos().mul(distance));
    p.z.assign(angle.sin().mul(distance));
    p.y.assign(hash(instanceIndex.add(5678)).mul(height).add(bottom));
  })().compute(count);

  const computeUpdate = Fn(() => {
    const p = positions.element(instanceIndex);
    const fallSpeed = float(14.0).add(hash(instanceIndex.add(42)).mul(6.0));
    const velocity = vec3(uniforms.wind.x, fallSpeed.negate(), uniforms.wind.y);

    p.addAssign(velocity.mul(uniforms.delta));

    If(p.y.lessThan(bottom), () => {
      p.y.addAssign(height);
    });

    If(length(p.xz).greaterThan(radius), () => {
      p.x.assign(p.x.negate().mul(0.97));
      p.z.assign(p.z.negate().mul(0.97));
    });
  })().compute(count);

  const material = new THREE.SpriteNodeMaterial({ transparent: true, depthWrite: false });
  material.positionNode = positions.toAttribute();

  const visible = hash(instanceIndex.add(999)).lessThan(uniforms.amount);
  material.scaleNode = select(visible, vec2(0.02, 0.42), vec2(0.0, 0.0));
  material.colorNode = vec4(vec3(0.72, 0.8, 0.9).mul(uniforms.brightness), uv().y.mul(0.5).add(0.1));

  const mesh = new THREE.Sprite(material);
  mesh.count = count;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  let initialized = false;

  const update = (renderer, amount, wind, deltaTime, brightness) => {
    if (!initialized) {
      renderer.compute(computeInit);
      initialized = true;
    }
    uniforms.amount.value = amount;
    uniforms.wind.value.copy(wind);
    uniforms.delta.value = Math.min(deltaTime, 0.05);
    uniforms.brightness.value = brightness;
    mesh.visible = amount > 0.005;
    if (mesh.visible) renderer.compute(computeUpdate);
  };

  return { mesh, update };
};

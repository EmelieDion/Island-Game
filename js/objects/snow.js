import * as THREE from 'three/webgpu';
import { Fn, If, instancedArray, instanceIndex, uniform, hash, vec2, vec3, vec4, float, select, length, sin, uv } from 'three/tsl';

export const createSnow = ({ count = 18000, radius = 30, height = 26, bottom = -1 } = {}) => {
  const uniforms = {
    amount: uniform(0),
    wind: uniform(new THREE.Vector2()),
    delta: uniform(0),
    time: uniform(0),
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
    const random = hash(instanceIndex.add(42));
    const fallSpeed = float(1.2).add(random.mul(0.8));
    const flutter = vec2(
      sin(uniforms.time.mul(1.3).add(random.mul(40.0))),
      sin(uniforms.time.mul(1.1).add(random.mul(25.0))),
    ).mul(0.6);
    const velocity = vec3(
      uniforms.wind.x.mul(1.6).add(flutter.x),
      fallSpeed.negate(),
      uniforms.wind.y.mul(1.6).add(flutter.y),
    );

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
  material.scaleNode = select(visible, vec2(0.08, 0.08), vec2(0.0, 0.0));

  const alpha = float(1.0).sub(length(uv().sub(0.5)).mul(2.0)).clamp(0.0, 1.0);
  material.colorNode = vec4(vec3(0.95, 0.97, 1.0).mul(uniforms.brightness), alpha.mul(0.9));

  const mesh = new THREE.Sprite(material);
  mesh.count = count;
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;

  let initialized = false;

  const update = (renderer, amount, wind, deltaTime, elapsedTime, brightness) => {
    if (!initialized) {
      renderer.compute(computeInit);
      initialized = true;
    }
    uniforms.amount.value = amount;
    uniforms.wind.value.copy(wind);
    uniforms.delta.value = Math.min(deltaTime, 0.05);
    uniforms.time.value = elapsedTime;
    uniforms.brightness.value = brightness;
    mesh.visible = amount > 0.005;
    if (mesh.visible) renderer.compute(computeUpdate);
  };

  return { mesh, update };
};

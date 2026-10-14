import * as THREE from 'three/webgpu';

export const createDayCycle = (startTime = 13) => {
  const state = {
    target: startTime,
    time: startTime,
    day: 1,
    sunDir: new THREE.Vector3(),
  };

  const update = (deltaTime) => {
    let difference = state.target - state.time;
    if (difference > 12) difference -= 24;
    if (difference < -12) difference += 24;
    state.time = (state.time + difference * Math.min(1, deltaTime * 3) + 24) % 24;

    const angle = ((state.time - 6) / 24) * Math.PI * 2;
    state.sunDir.set(Math.cos(angle), Math.sin(angle), 0.35).normalize();
    state.day = THREE.MathUtils.smoothstep(state.sunDir.y, -0.12, 0.22);
  };

  update(0);

  return { state, update };
};

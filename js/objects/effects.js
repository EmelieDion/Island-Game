import * as THREE from 'three/webgpu';

const BOLT_TIME = 0.35;
const GUST_TIME = 0.9;

const boltCore = new THREE.MeshBasicMaterial({ color: 0xffffff });
const boltGlow = new THREE.MeshBasicMaterial({
  color: 0x9fc4ff,
  transparent: true,
  opacity: 0.35,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const streakGeometry = new THREE.BoxGeometry(1.6, 0.04, 0.04);

export const createEffects = (scene) => {
  const bolts = [];
  const gusts = [];
  const flashLight = new THREE.PointLight(0xc8dcff, 0, 40, 1.5);
  scene.add(flashLight);
  let flash = 0;

  const strike = (point) => {
    const points = [];
    const start = new THREE.Vector3(point.x + (Math.random() - 0.5) * 6, 26, point.z + (Math.random() - 0.5) * 6);
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const jitter = (1 - t) * 1.2;
      points.push(new THREE.Vector3(
        THREE.MathUtils.lerp(start.x, point.x, t) + (i && i < 14 ? (Math.random() - 0.5) * jitter : 0),
        THREE.MathUtils.lerp(start.y, point.y, t),
        THREE.MathUtils.lerp(start.z, point.z, t) + (i && i < 14 ? (Math.random() - 0.5) * jitter : 0),
      ));
    }
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.05, 4), boltCore));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 70, 0.22, 6), boltGlow));
    scene.add(group);
    bolts.push({ group, age: 0 });

    flashLight.position.set(point.x, point.y + 2, point.z);
    flash = 1;
  };

  const blow = (point, direction) => {
    const streaks = [];
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(streakGeometry, material);
      const side = (Math.random() - 0.5) * 5;
      mesh.position.set(
        point.x - direction.x * 4 - direction.z * side,
        point.y + 0.3 + Math.random() * 2.5,
        point.z - direction.z * 4 + direction.x * side,
      );
      mesh.rotation.y = Math.atan2(-direction.z, direction.x);
      mesh.userData.speed = 9 + Math.random() * 6;
      scene.add(mesh);
      streaks.push(mesh);
    }
    gusts.push({ streaks, material, direction: direction.clone(), age: 0 });
  };

  const update = (deltaTime) => {
    flash = Math.max(0, flash - deltaTime * 3);
    flashLight.intensity = flash * 60;

    [...bolts].forEach((bolt) => {
      bolt.age += deltaTime;
      bolt.group.visible = bolt.age < 0.08 || (bolt.age > 0.12 && bolt.age < BOLT_TIME);
      if (bolt.age < BOLT_TIME) return;
      bolt.group.children.forEach((mesh) => mesh.geometry.dispose());
      bolt.group.removeFromParent();
      bolts.splice(bolts.indexOf(bolt), 1);
    });

    [...gusts].forEach((gust) => {
      gust.age += deltaTime;
      const t = gust.age / GUST_TIME;
      gust.material.opacity = Math.sin(Math.min(t, 1) * Math.PI) * 0.7;
      gust.streaks.forEach((mesh) => {
        mesh.position.addScaledVector(gust.direction, mesh.userData.speed * deltaTime);
      });
      if (t < 1) return;
      gust.streaks.forEach((mesh) => mesh.removeFromParent());
      gust.material.dispose();
      gusts.splice(gusts.indexOf(gust), 1);
    });
  };

  return { strike, blow, update, getFlash: () => flash };
};

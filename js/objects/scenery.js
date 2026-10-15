import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fitToSize } from './models.js';
import { terrainHeight, VILLAGE, WINDMILL } from './island.js';
import { addSnow } from '../systems/snowCover.js';

const TREE_COUNT = 12;
const BOAT_DISTANCE = 19;
const BOAT_SPEED = 0.04;

const createRandom = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const prepare = (object) => {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = addSnow(child.material);
  });
};

const groundUnder = (x, z, radius) => {
  let ground = terrainHeight(x, z);
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    ground = Math.min(ground, terrainHeight(x + Math.cos(angle) * radius, z + Math.sin(angle) * radius));
  }
  return ground;
};

const findTreeSpots = () => {
  const random = createRandom(7);
  const spots = [];
  for (let tries = 0; spots.length < TREE_COUNT && tries < 2000; tries++) {
    const angle = random() * Math.PI * 2;
    const distance = 3 + random() * 9;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (terrainHeight(x, z) < 0.9) continue;
    if (Math.hypot(x - VILLAGE.x, z - VILLAGE.y) < 4.5) continue;
    if (Math.hypot(x - WINDMILL.x, z - WINDMILL.y) < 2.2) continue;
    if (spots.some((spot) => Math.hypot(spot.x - x, spot.z - z) < 1.6)) continue;
    spots.push({ x, z, type: random() < 0.5 ? 0 : 1, scale: 0.8 + random() * 0.5, rotation: random() * Math.PI * 2 });
  }
  return spots;
};

export const loadScenery = async (scene, physics, breakables) => {
  const loader = new GLTFLoader();
  const [tree1, tree2, boatModel] = await Promise.all(
    ['assets/tree1.glb', 'assets/tree2.glb', 'assets/boat.glb'].map((url) => loader.loadAsync(url)),
  );

  const trees = [fitToSize(tree1.scene, 2.2, 'height'), fitToSize(tree2.scene, 2.6, 'height')];
  trees.forEach(prepare);

  findTreeSpots().forEach((spot) => {
    const tree = trees[spot.type].clone();
    tree.scale.multiplyScalar(spot.scale);
    tree.rotation.y = spot.rotation;
    tree.position.set(spot.x, groundUnder(spot.x, spot.z, 0.25) - 0.05, spot.z);
    scene.add(tree);
    tree.updateMatrixWorld(true);
    breakables.addStatic(tree, 0.35);
  });

  const boat = fitToSize(boatModel.scene, 2.4, 'height');
  prepare(boat);
  scene.add(boat);

  boat.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(boat);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const body = physics.world.createRigidBody(physics.RAPIER.RigidBodyDesc.kinematicPositionBased());
  physics.world.createCollider(
    physics.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2).setTranslation(center.x, center.y, center.z),
    body,
  );

  const update = (elapsedTime, waterHeight) => {
    const angle = elapsedTime * BOAT_SPEED + 1;
    const x = Math.cos(angle) * BOAT_DISTANCE;
    const z = Math.sin(angle) * BOAT_DISTANCE;
    const tiltX = (waterHeight(x, z + 0.6) - waterHeight(x, z - 0.6)) / 1.2;
    const tiltZ = (waterHeight(x + 0.6, z) - waterHeight(x - 0.6, z)) / 1.2;
    const water = Math.max(
      waterHeight(x, z),
      waterHeight(x + 0.6, z),
      waterHeight(x - 0.6, z),
      waterHeight(x, z + 0.6),
      waterHeight(x, z - 0.6),
    );

    boat.position.set(x, water + 0.08, z);
    boat.rotation.set(tiltX, -angle, -tiltZ, 'YXZ');
    body.setNextKinematicTranslation(boat.position);
    body.setNextKinematicRotation(boat.quaternion);
  };

  return { update };
};

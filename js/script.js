import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createSea } from './objects/sea.js';
import { createIsland, terrainHeight, VILLAGE } from './objects/island.js';
import { loadModels } from './objects/models.js';

const $canvas = document.getElementById('webgl');
let renderer, camera, scene, controls;
let seaMesh, seaUpdate;
const timer = new THREE.Timer();
const mouse = new THREE.Vector2(0.3, 0.5);

const init = async () => {
  renderer = new THREE.WebGPURenderer({ canvas: $canvas, alpha: false, antialias: true });
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(19, 12.5, 22);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d4ee);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 1, 0);
  controls.maxDistance = 85;
  controls.minDistance = 5;

  const { mesh, update } = createSea();
  seaMesh = mesh;
  seaUpdate = update;
  scene.add(seaMesh);

  const { mesh: islandMesh } = createIsland();
  scene.add(islandMesh);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(27, 34, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const hemisphereLight = new THREE.HemisphereLight(0xcfe6ff, 0x4a3b2a, 0.9);
  scene.add(hemisphereLight);

  const { house } = await loadModels();
  house.position.set(VILLAGE.x, terrainHeight(VILLAGE.x, VILLAGE.y) - 0.05, VILLAGE.y);
  scene.add(house);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  });

  window.addEventListener('resize', resize);
  resize();

  renderer.setAnimationLoop(draw);
};

const draw = () => {
  timer.update();
  seaUpdate(timer.getElapsed(), timer.getDelta(), mouse);

  controls.update();
  renderer.render(scene, camera);
};

const resize = () => {
  renderer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

init();

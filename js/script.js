import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createSea } from './objects/sea.js';

const $canvas = document.getElementById('webgl');
let renderer, camera, scene, controls;
let seaMesh, seaUpdate;
const timer = new THREE.Timer();

const init = () => {
  renderer = new THREE.WebGPURenderer({ canvas: $canvas, alpha: false });

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 18, 34);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8d4ee);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const { mesh, update } = createSea();
  seaMesh = mesh;
  seaUpdate = update;
  scene.add(seaMesh);

  window.addEventListener('resize', resize);
  resize();

  renderer.setAnimationLoop(draw);
};

const draw = () => {
  timer.update();
  seaUpdate(timer.getElapsed());

  controls.update();
  renderer.render(scene, camera);
};

const resize = () => {
  renderer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

init();

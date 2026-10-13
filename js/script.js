import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $canvas = document.getElementById('webgl');
let renderer, camera, scene, controls;
let plane, material;

const init = () => {
  renderer = new THREE.WebGPURenderer({ canvas: $canvas, alpha: false });

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
  camera.position.set(0, 0, 10);

  scene = new THREE.Scene();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  window.addEventListener('resize', resize);
  resize();

  renderer.setAnimationLoop(draw);
};

const draw = () => {
  controls.update();
  renderer.render(scene, camera);
};

const resize = () => {
  renderer.setSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

init();

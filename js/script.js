import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createSea } from './objects/sea.js';
import { createIsland, terrainHeight, VILLAGE, WINDMILL } from './objects/island.js';
import { loadModels } from './objects/models.js';
import { createSky } from './objects/sky.js';
import { createDayCycle } from './systems/dayCycle.js';
import { createRain } from './objects/rain.js';
import { createSnow } from './objects/snow.js';
import { snowCover } from './systems/snowCover.js';

const $canvas = document.getElementById('webgl');
let renderer, camera, scene, controls;
let seaMesh, seaUpdate, sky;
let sun, moon, hemisphereLight, setHouseBrightness;
let rain, snow;
const weather = { rainTarget: 0, rain: 0, snowTarget: 0, snow: 0, snowCover: 0, windTarget: 0.15, wind: 0.15 };
const wind = new THREE.Vector2();
const dayCycle = createDayCycle(13);
const sunColor = new THREE.Color();
const timer = new THREE.Timer();
const mouse = new THREE.Vector2(0.3, 0.5);

const init = async () => {
  renderer = new THREE.WebGPURenderer({ canvas: $canvas, alpha: false, antialias: true });
  renderer.shadowMap.enabled = true;
  await renderer.init();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(19, 12.5, 22);

  scene = new THREE.Scene();

  sky = createSky();
  scene.add(sky.mesh);

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

  rain = createRain();
  scene.add(rain.mesh);

  snow = createSnow();
  scene.add(snow.mesh);

  sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  moon = new THREE.DirectionalLight(0x9fb4ff, 0);
  scene.add(moon);

  hemisphereLight = new THREE.HemisphereLight(0xcfe6ff, 0x4a3b2a, 0.9);
  scene.add(hemisphereLight);

  const { createHouse, setBrightness, windmill } = await loadModels();
  setHouseBrightness = setBrightness;

  const houses = [
    { x: -1.9, z: -1.7, rotation: 0.2, tint: 0xffffff },
    { x: 0.9, z: -2.1, rotation: -0.5, tint: 0xffe2d6 },
    { x: 2.8, z: 0.1, rotation: -1.3, tint: 0xdfefff },
    { x: -2.9, z: 0.9, rotation: 0.9, tint: 0xfff1c9 },
    { x: 0.1, z: 1.3, rotation: 1.6, tint: 0xe4f5dc },
    { x: 2.2, z: 2.8, rotation: -0.8, tint: 0xf6dcef },
  ];
  houses.forEach(({ x, z, rotation, tint }) => {
    const house = createHouse(tint);
    const px = VILLAGE.x + x;
    const pz = VILLAGE.y + z;
    house.position.set(px, terrainHeight(px, pz) - 0.05, pz);
    house.rotation.y = rotation;
    scene.add(house);
  });

  windmill.position.set(WINDMILL.x, terrainHeight(WINDMILL.x, WINDMILL.y) - 0.1, WINDMILL.y);
  windmill.rotation.y = -0.6;
  scene.add(windmill);

  const $time = document.getElementById('time');
  const $timeOutput = document.getElementById('timeOutput');
  $time.addEventListener('input', () => {
    dayCycle.state.target = parseFloat($time.value);
    const hours = Math.floor(dayCycle.state.target) % 24;
    const minutes = Math.floor((dayCycle.state.target % 1) * 60);
    $timeOutput.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  });

  const $rain = document.getElementById('rain');
  const $rainOutput = document.getElementById('rainOutput');
  $rain.addEventListener('input', () => {
    weather.rainTarget = parseFloat($rain.value);
    $rainOutput.textContent = `${Math.round(weather.rainTarget * 100)}%`;
  });

  const $snow = document.getElementById('snow');
  const $snowOutput = document.getElementById('snowOutput');
  $snow.addEventListener('input', () => {
    weather.snowTarget = parseFloat($snow.value);
    $snowOutput.textContent = `${Math.round(weather.snowTarget * 100)}%`;
  });

  const $wind = document.getElementById('wind');
  const $windOutput = document.getElementById('windOutput');
  $wind.addEventListener('input', () => {
    weather.windTarget = parseFloat($wind.value);
    $windOutput.textContent = `${Math.round(weather.windTarget * 100)}%`;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  });

  window.addEventListener('resize', resize);
  resize();

  await renderer.compileAsync(scene, camera);
  await sky.compile(renderer, camera);

  renderer.setAnimationLoop(draw);
  const $loader = document.getElementById('loader');
  $loader.addEventListener('transitionend', () => $loader.remove());
  $loader.classList.add('is-done');
};

const updateLights = () => {
  const { sunDir, day } = dayCycle.state;

  sun.position.copy(sunDir).multiplyScalar(45);
  const sunUp = THREE.MathUtils.smoothstep(sunDir.y, -0.05, 0.15);
  const low = 1 - THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.4);
  sunColor.setRGB(1, 1 - low * 0.35, 1 - low * 0.6);
  sun.color.copy(sunColor);
  const clouds = Math.max(weather.rain, weather.snow * 0.7);
  sun.intensity = sunUp * 2.4 * (1 - clouds * 0.6);

  moon.position.copy(sunDir).multiplyScalar(-45);
  moon.intensity = (1 - day) * 0.45;

  hemisphereLight.intensity = (0.18 + day * 0.8) * (1 - clouds * 0.3);
  setHouseBrightness(0.25 + day * 0.75);

  sky.uniforms.sunDir.value.copy(sunDir);
  sky.uniforms.day.value = day;
  const night = THREE.MathUtils.smoothstep(1 - day, 0.6, 1);
  const cold = THREE.MathUtils.smoothstep(weather.snow, 0.2, 0.7);
  sky.uniforms.aurora.value = night * cold * 1.4;
};

const draw = () => {
  timer.update();
  const deltaTime = timer.getDelta();
  dayCycle.update(deltaTime);
  weather.rain += (weather.rainTarget - weather.rain) * Math.min(1, deltaTime * 1.5);
  weather.snow += (weather.snowTarget - weather.snow) * Math.min(1, deltaTime * 1.5);
  weather.wind += (weather.windTarget - weather.wind) * Math.min(1, deltaTime * 1.5);
  if (weather.snow > 0.05) {
    weather.snowCover = Math.min(1, weather.snowCover + weather.snow * deltaTime * 0.1);
  } else {
    const melt = 0.02 + dayCycle.state.day * 0.04 + weather.rain * 0.1;
    weather.snowCover = Math.max(0, weather.snowCover - melt * deltaTime);
  }
  snowCover.value = weather.snowCover;
  const windAngle = 0.3 + Math.sin(timer.getElapsed() * 0.05) * 0.6;
  wind.set(Math.cos(windAngle), Math.sin(windAngle)).multiplyScalar(weather.wind * 9);
  updateLights();

  seaUpdate(deltaTime, mouse, dayCycle.state.day, weather.wind);
  sky.update(timer.getElapsed(), renderer, camera);
  const particleBrightness = 0.35 + dayCycle.state.day * 0.65;
  rain.update(renderer, weather.rain, wind, deltaTime, particleBrightness);
  snow.update(renderer, weather.snow, wind, deltaTime, timer.getElapsed(), particleBrightness);

  controls.update();
  renderer.render(scene, camera);
};

const resize = () => {
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  renderer.setSize(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

init();

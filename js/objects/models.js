import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const fitToSize = (group, width) => {
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach((child) => {
    child.position.x -= center.x;
    child.position.z -= center.z;
    child.position.y -= box.min.y;
  });
  const wrapper = new THREE.Group();
  wrapper.add(group);
  wrapper.scale.setScalar(width / Math.max(size.x, size.z));
  return wrapper;
};

export const loadModels = async () => {
  const gltf = await new GLTFLoader().loadAsync('assets/island-game-assets.glb');

  const bakedTexture = await new THREE.TextureLoader().loadAsync('assets/island-game-assets.jpg');
  bakedTexture.flipY = false;
  bakedTexture.colorSpace = THREE.SRGBColorSpace;
  const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
  bakedMaterial.color.setScalar(3.5);

  const house = new THREE.Group();
  [...gltf.scene.children].forEach((child) => {
    if (!child.name.startsWith('Molen')) house.add(child);
  });

  house.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material.name === 'Creme') child.material = bakedMaterial;
  });

  return {
    house: fitToSize(house, 1.6),
  };
};

import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const WALL_BRIGHTNESS = 3.5;

const fitToSize = (group, size, axis = 'width') => {
  const box = new THREE.Box3().setFromObject(group);
  const dimensions = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach((child) => {
    child.position.x -= center.x;
    child.position.z -= center.z;
    child.position.y -= box.min.y;
  });
  const wrapper = new THREE.Group();
  wrapper.add(group);
  const current = axis === 'height' ? dimensions.y : Math.max(dimensions.x, dimensions.z);
  wrapper.scale.setScalar(size / current);
  return wrapper;
};

const prepare = (group) => {
  group.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
};

export const loadModels = async () => {
  const gltf = await new GLTFLoader().loadAsync('assets/island-game-assets.glb');

  const bakedTexture = await new THREE.TextureLoader().loadAsync('assets/island-game-assets.jpg');
  bakedTexture.flipY = false;
  bakedTexture.colorSpace = THREE.SRGBColorSpace;
  const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture, name: 'Baked' });
  bakedMaterial.color.setScalar(WALL_BRIGHTNESS);

  const house = new THREE.Group();
  const windmill = new THREE.Group();
  [...gltf.scene.children].forEach((child) => {
    if (child.name.startsWith('Molen')) windmill.add(child);
    else house.add(child);
  });

  house.traverse((child) => {
    if (child.isMesh && child.material.name === 'Creme') child.material = bakedMaterial;
  });

  prepare(house);
  prepare(windmill);

  const houseTemplate = fitToSize(house, 1.6);
  const houseMaterials = [];

  const createHouse = (tint) => {
    const copy = houseTemplate.clone();
    const material = bakedMaterial.clone();
    material.userData.tint = new THREE.Color(tint);
    houseMaterials.push(material);
    copy.traverse((child) => {
      if (child.isMesh && child.material.name === 'Baked') child.material = material;
    });
    return copy;
  };

  const setBrightness = (brightness) => {
    houseMaterials.forEach((material) => {
      material.color.copy(material.userData.tint).multiplyScalar(WALL_BRIGHTNESS * brightness);
    });
  };

  return {
    createHouse,
    setBrightness,
    windmill: fitToSize(windmill, 3.4, 'height'),
  };
};

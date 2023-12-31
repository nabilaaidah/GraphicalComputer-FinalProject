import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
import { PCFShadowMap, sRGBEncoding } from "three";

/**
 * Loaders
 */

const gltfLoader = new GLTFLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();

/**
 * Base
 */
// Debug
const gui = new dat.GUI();
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Test sphere
 */
// const testSphere = new THREE.Mesh(
//   new THREE.SphereBufferGeometry(1, 32, 32),
//   new THREE.MeshStandardMaterial()
// );
// scene.add(testSphere);

/**
 * Update all materials
 */

const updateAllMaterials = () => {
  scene.traverse((child) => {
    // console.log(child);
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      //   console.log(child);
      //   child.material.envMap = environmentMap;
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environments Map
 */
const environmentMap = cubeTextureLoader.load([
  "/textures/environmentMaps/1/px.jpg",
  "/textures/environmentMaps/1/nx.jpg",
  "/textures/environmentMaps/1/py.jpg",
  "/textures/environmentMaps/1/ny.jpg",
  "/textures/environmentMaps/1/pz.jpg",
  "/textures/environmentMaps/1/nz.jpg",
]);
environmentMap.encoding = sRGBEncoding;

scene.background = environmentMap;
scene.environment = environmentMap;

debugObject.envMapIntensity = 5;
gui.add(debugObject, "envMapIntensity").min(0).max(10).step(0.001).onChange(updateAllMaterials);

// Texture
const textureLoader = new THREE.TextureLoader();

const bakedTexture = textureLoader.load("/models/Musholla_Bake1_CyclesBake_COMBINED.png");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

const bakedMaterial = new THREE.MeshStandardMaterial({
  map: bakedTexture,
});

let gltfObject;

gltfLoader.load("/models/rendersimplebake.glb", (gltf) => {
  gltfObject = gltf;
  gltf.scene.scale.set(0.3, 0.3, 0.3);

  // Centering the object
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  gltf.scene.position.sub(center);

  scene.add(gltf.scene);

  // Rotation
  gui.add(gltf.scene.rotation, "y").min(-Math.PI).max(Math.PI).step(0.001).name("rotation");

  // Adjusting material properties for glass
  const glassMaterial = new THREE.MeshStandardMaterial({
    map: bakedTexture,
    metalness: 1, // Set to 1 for a metal-like reflection
    roughness: 0.1, // Adjust the roughness for glossiness
    transparent: true,
    opacity: 0.99, // Set opacity for transparency
  });

  gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      //console.log("Mesh Name:", child.name);
      if (child.name.includes("Cube")) {
        child.material = glassMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (
        child.name.includes("Cube_1") ||
        child.name.includes("Cube_2") ||
        child.name.includes("Cube_3") ||
        child.name.includes("Cube_4") ||
        child.name.includes("Cube_5") ||
        child.name.includes("Cube_6") ||
        child.name.includes("Cube_6") ||
        child.name.includes("Cube_7") ||
        child.name.includes("Cube_8") ||
        child.name.includes("Cube_9")
      ) {
        child.material = bakedMaterial; // Keep original material for non-glass parts
        child.castShadow = true;
        child.receiveShadow = true;
      }
    }
  });

  updateAllMaterials();
});

/**
 * Lights
 */
// Creating a directional light with a white color and intensity of 2.5
const directionalLight = new THREE.DirectionalLight("#ffffff", 2.5);
directionalLight.position.set(0.28, 5, 2.02); // Setting the position of the directional light in 3D space
directionalLight.castShadow = true; // Enabling shadow casting for the directional ligh

// Configuring the shadow properties of the light's camerat
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05; // the value btw 0.02 and 0.05 will be enough
scene.add(directionalLight);

// Camera Helper
const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(directionalLightCameraHelper);

gui.add(directionalLight, "intensity").min(0).max(10).step(0.001).name("lightIntensity");
gui.add(directionalLight.position, "x").min(-5).max(5).step(0.001).name("lightX");
gui.add(directionalLight.position, "y").min(-5).max(5).step(0.001).name("lightY");
gui.add(directionalLight.position, "z").min(-5).max(5).step(0.001).name("lightZ");

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(4, 1, -4);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 3;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFShadowMap;

gui
  .add(renderer, "toneMapping", {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping,
  })
  .onFinishChange(() => {
    renderer.toneMapping = Number(renderer.toneMapping);
    updateAllMaterials();
  });

gui.add(renderer, "toneMappingExposure").min(0).max(10).step(0.001);

/**
 * Animate
 */
const rotationControls = {
  rotateScene: false,
};

const spinningControls = {
  rotateObjectX: false, // Add properties for each desired axis
  rotateObjectY: false,
  rotateObjectZ: false,
  rotateScene: false,
  autoRotateLight: false,
};

gui.add(spinningControls, "autoRotateLight").name("Auto Rotate Light");
gui.add(spinningControls, "rotateObjectX").name("Object X Rotation");
gui.add(spinningControls, "rotateObjectY").name("Object Y Rotation");
gui.add(spinningControls, "rotateObjectZ").name("Object Z Rotation");
gui.add(rotationControls, "rotateScene").name("Scene Rotation");

const autoRotateLight = () => {
  if (spinningControls.autoRotateLight) {
    const time = performance.now();
    const speed = 0.0005;

    const angle = time * speed;
    directionalLight.position.x = Math.cos(angle) * 5;
    directionalLight.position.z = Math.sin(angle) * 5;

    const target = new THREE.Vector3(0, 0, 0);
    directionalLight.target.position.copy(target);
    directionalLight.target.updateMatrixWorld();
  }
};

const tick = () => {
  // Update controls
  if (rotationControls.rotateScene) {
    // Rotate the entire scene
    scene.rotation.x += 0.005; // Adjust the rotation speed as needed
    scene.rotation.y += 0.002; // Adjust the rotation speed as needed
  }

  if (spinningControls.rotateObjectX) {
    gltfObject.scene.rotation.x += 0.01; // Adjust rotation speed
  }
  if (spinningControls.rotateObjectY) {
    gltfObject.scene.rotation.y += 0.01; // Adjust rotation speed
  }
  if (spinningControls.rotateObjectZ) {
    gltfObject.scene.rotation.z += 0.01; // Adjust rotation speed
  }

  autoRotateLight();
  controls.update();

  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

//Import
import * as THREE from "three";
import * as YUKA from "yuka";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as dat from "dat.gui";
//--------------------------------------------
//NOTE constant
let hei = 20.75;
let bri_hei = 7.75;
//--------------------------------------------

//--------------------------------------------
//NOTE Creating renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//--------------------------------------------

//--------------------------------------------
//NOTE Creating scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
//--------------------------------------------

//--------------------------------------------
//NOTE Perspective Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(240, 100, 10);
//--------------------------------------------

//--------------------------------------------
//NOTE Percpective controll
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.zoomSpeed = 4;
//--------------------------------------------

//////////////////////////////////////
//NOTE - direction light
const directionLight = new THREE.DirectionalLight(0xffffff, 3);
scene.add(directionLight);
directionLight.position.set(-30, 20, 10);
directionLight.castShadow = true;
const frustumSize = 50;
directionLight.shadow.camera.left = -frustumSize;
directionLight.shadow.camera.right = frustumSize;
directionLight.shadow.camera.top = frustumSize;
directionLight.shadow.camera.bottom = -frustumSize;
//////////////////////////////////////

//////////////////////////////////////
//NOTE - ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
//////////////////////////////////////

//////////////////////////////////////
//NOTE - spotLight light
const spotLight = new THREE.SpotLight(0xffffff); // White light
spotLight.angle = Math.PI / 18; // Set the spotlight cone angle (in radians)
spotLight.intensity = 0; // Set the light intensity
spotLight.decay = 1;
spotLight.penumbra = 0.5;
scene.add(spotLight);

// Step 3 (Optional): Enable shadows
spotLight.castShadow = true;
//////////////////////////////////////

//--------------------------------------------
//NOTE -load manager
const loadingManager = new THREE.LoadingManager();
const progressBar = document.getElementById("progress-bar");
loadingManager.onProgress = function (url, loaded, total) {
  progressBar.value = (loaded / total) * 100;
};

const progressBarContainer = document.querySelector(".progress-bar-container");

loadingManager.onLoad = function () {
  setTimeout(() => {
    progressBarContainer.style.display = "none";
    car.matrixAutoUpdate = false;
    YUKA_ini(car);
    datGui_ini();
  }, 2500);
};
//--------------------------------------------

//--------------------------------------------
//NOTE - load gltb

const gltfLoader = new GLTFLoader(loadingManager);
const loadGLTF = (
  modelurl,
  scale,
  callback = () => {},
  success = () => {},
  error = () => {}
) => {
  gltfLoader.load(
    modelurl.href,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      model.castShadow = true;
      model.receiveShadow = true;
      model.scale.set(scale, scale, scale);
      callback(model);
    },
    success,
    error
  );
};
//--------------------------------------------

//--------------------------------------------
//NOTE - create city
const cityUrl = new URL("../assets/city.glb", import.meta.url);
loadGLTF(cityUrl, 5);
//--------------------------------------------

//--------------------------------------------
//NOTE - create house
const houseUrl = new URL("../assets/house.glb", import.meta.url);
loadGLTF(houseUrl, 5, (house) => {
  house.position.set(50, hei - 1.04, 25);
  house.rotation.set(0, Math.PI / 2, 0);
});
//--------------------------------------------

//--------------------------------------------
//NOTE - YUKA
let entityManager, vehicle, path;
function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}
const YUKA_ini = (car) => {
  //--------------------------------------------
  //NOTE - path
  const pathList = [
    [72, hei, -40],
    [72, hei, 7.85],
    [115, hei, 7.85],
    [115, hei, -22.5],
    [192, hei, -22.5],
    [192, hei, -88],
    [111, hei + bri_hei, -88],
    [-18, hei + bri_hei, -88],
    [-93.5, hei, -88],
    [-100, hei, -88],
    [-100, hei, 112],
    [192.5, hei, 112],
    [192.5, hei, -63.5],
    [72, hei, -63.5],
    [72, hei, -40],
  ];
  //
  path = new YUKA.Path();
  pathList.forEach(([dx, dy, dz]) => {
    path.add(new YUKA.Vector3(dx, dy, dz));
  });
  path.loop = true;
  //--------------------------------------------

  //--------------------------------------------
  //NOTE - vehicle
  vehicle = new YUKA.Vehicle();
  vehicle.maxSpeed = 4;
  vehicle.position.copy(path.current());
  vehicle.scale = new YUKA.Vector3(0.005, 0.005, 0.005);
  //--------------------------------------------

  //--------------------------------------------
  //NOTE - follow path behavior and path behavior
  const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.1);
  vehicle.steering.add(followPathBehavior);
  const onPathBehavior = new YUKA.OnPathBehavior(path);

  vehicle.steering.add(onPathBehavior);
  //--------------------------------------------
  vehicle.setRenderComponent(car, sync);

  //--------------------------------------------
  //NOTE - entity manager
  entityManager = new YUKA.EntityManager();
  entityManager.add(vehicle);
  //--------------------------------------------
};
//--------------------------------------------

//--------------------------------------------
//NOTE - create city
const carUrl = new URL("../assets/car.glb", import.meta.url);
let car;
loadGLTF(carUrl, 0.005, (model) => {
  car = model;
  model.position.set(72, hei, -40);
  spotLight.target = model;
});
//--------------------------------------------

//--------------------------------------------
//NOTE - GUI options
const setState = (di, ai, si, color) => {
  directionLight.intensity = di;
  ambientLight.intensity = ai;
  spotLight.intensity = si;
  scene.background = new THREE.Color(color);
};
const datGui_ini = () => {
  var GUI = dat.gui.GUI;
  const gui = new GUI();
  const setting = {
    Time: "Day", // Default value
  };
  gui
    .add(setting, "Time", ["Day", "Afternoon time", "Night"])
    .onChange((time) => {
      if (time === "Day") {
        setState(3, 1, 0, 0x87ceeb);
      } else if (time === "Afternoon time") {
        setState(0, 0.3, 90, 0x00bfff);
      } else {
        setState(0, 0.07, 120, 0x111111);
      }
    });
};
//--------------------------------------------

//--------------------------------------------
//NOTE - animate function
const time = new YUKA.Time();
function animate() {
  if (entityManager) {
    const delta = time.update().getDelta();
    entityManager.update(delta);
    let { x, y, z } = vehicle.position;
    camera.lookAt(new THREE.Vector3(x, y, z));
    orbit.target.set(x, y, z);
    spotLight.position.set(x, y + 50, z);
  }
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
//--------------------------------------------

//--------------------------------------------
//NOTE - resize camera view
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
//--------------------------------------------

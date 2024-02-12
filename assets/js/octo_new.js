const scene = new THREE.Scene();
const canvasSize = 50;
const aspectRatio = 1;
const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), alpha: true, preserveDrawingBuffer: true });
renderer.setSize(canvasSize, canvasSize);
renderer.setClearColor(0x000000, 0); // Set the background color to transparent

const scaleY = 1.00; // Adjust the y-axis scale factor to make it taller
const geometry = new THREE.OctahedronGeometry(28, 0); // Set the edge length to 40 (20 * 2)

// Define the colors for each face
const colors = [
  0xE60047, // red
  0xE5D988, // yellow
  0x28B690, // green
  0x349be5, // blue
  0xE5D988, // yellow
  0xE60047, // red
  0x349be5, // blue
  0x28B690, // green
];

// Create materials for each face without shading and lighting
const materials = colors.map((color) => new THREE.MeshLambertMaterial({ color }));

// Assign the materials to each face
for (let i = 0; i < 8; i++) {
  geometry.faces[i].materialIndex = i;
}

// Create the octahedron mesh
const octahedron = new THREE.Mesh(geometry, materials);

// Scale the octahedron to fit the canvas size
octahedron.scale.set(1, scaleY, 1); // Set the y-axis scale to make it taller

// Center the octahedron on the canvas
octahedron.position.set(canvasSize / 2, canvasSize / 2, 0);

scene.add(octahedron);

// Set the aspect ratio to match the canvas size
camera.aspect = aspectRatio;
camera.updateProjectionMatrix();

// Center the camera on the octahedron
camera.position.set(canvasSize / 2, canvasSize / 2, 60); // Adjust camera position based on canvas size

// Look at the center of the canvas
camera.lookAt(canvasSize / 2, canvasSize / 2, 0);

//Add some lighting to see the colors properly
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);

// Add some lighting to see the colors properly
const backLight = new THREE.DirectionalLight(0xffffff, .2);
backLight.position.set(1, 1, -1);
scene.add(backLight);

// Add some lighting to fill
const fillLight = new THREE.DirectionalLight(0xffffff, .5);
fillLight.position.set(-1, 0, 1);
scene.add(fillLight);


// Animation loop
function animate() {
  requestAnimationFrame(animate);

  octahedron.rotation.x += 0.01;
  octahedron.rotation.y += 0.01;

  renderer.render(scene, camera);
}

animate();

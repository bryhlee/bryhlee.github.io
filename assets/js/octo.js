// Get the canvas element
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cameraAngle = -Math.PI / 12;

// Define the rotation speed
const rotationSpeed = 0.002;

// Define the center point of the canvas
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Function to rotate a point around the Y axis
function rotateY(point, angle) {
  const x = point[0];
  const z = point[2];
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  point[0] = x * cos + z * sin;
  point[2] = z * cos - x * sin;
}

// Function to project a 3D point to 2D space
function project(point) {
  const scale = 22;
  const x = point[0] * scale;
  const y = point[1] * scale;
  const z = point[2] * scale + 4; // Translate the shape away from the camera

  // Apply camera angle adjustment
  const cos = Math.cos(cameraAngle);
  const sin = Math.sin(cameraAngle);
  const adjustedY = y * cos - z * sin;
  const adjustedZ = z * cos + y * sin;

  return [centerX + x, centerY + adjustedY, adjustedZ];
}

const vertices = [
  [0, 0, -1],  // 0
  [1, 0, 0],   // 1
  [0, 1, 0],   // 2
  [-1, 0, 0],  // 3
  [0, -1, 0],  // 4
  [0, 0, 1]    // 5
];

// Define the octahedron faces
const faces = [
  [0, 1, 2],   // Front face
  [0, 2, 3],   // Left face
  [0, 3, 4],   // Bottom face
  [0, 4, 1],   // Right face
  [5, 2, 1],   // Top face
  [5, 3, 2],   // Back face
  [5, 4, 3],   // Bottom face
  [5, 1, 4]    // Right face
];

// Function to draw the octahedron
function drawOctahedron() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#99CDF2"; // Set the line color to white

  for (const face of faces) {
    const p1 = vertices[face[0]];
    const p2 = vertices[face[1]];
    const p3 = vertices[face[2]];

    // Rotate the points around the Y axis
    rotateY(p1, rotationSpeed);
    rotateY(p2, rotationSpeed);
    rotateY(p3, rotationSpeed);

    // Project the 3D points to 2D space
    const projectedP1 = project(p1);
    const projectedP2 = project(p2);
    const projectedP3 = project(p3);

    // Draw the face
    ctx.beginPath();
    ctx.moveTo(projectedP1[0], projectedP1[1]);
    ctx.lineTo(projectedP2[0], projectedP2[1]);
    ctx.lineTo(projectedP3[0], projectedP3[1]);
    ctx.closePath();
    ctx.stroke();
  }

  // Animate the rotation
  requestAnimationFrame(drawOctahedron);
}

// Start the animation
drawOctahedron();

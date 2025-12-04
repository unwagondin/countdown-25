import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const { renderer, run, finish, input, math } = createEngine();
const { ctx, canvas } = renderer;
run(update);

// SVG paths
const svgPaths = [
  "1.svg",
  "candy-7.svg",
  "candy-6.svg",
  "candy-5.svg",
  "candy-4.svg",
  "candy-3.svg",
  "candy-2.svg",
  "candy-1.svg",
  "candy-full.svg",
];

// // Define click zones for each layer (relative to center)
// // Each zone has x, y offset from center and a radius
// const clickZones = [
//   { x: 0, y: 0, radius: 200 }, // 1.svg
//   { x: -150, y: -230, radius: 300 }, // candy-7.svg (top right)
//   { x: 190, y: 130, radius: 200 }, // candy-6.svg (top left)
//   { x: 190, y: -90, radius: 200 }, // candy-5.svg (right)
//   { x: -150, y: 250, radius: 300 }, // candy-4.svg (left)
//   { x: 190, y: 0, radius: 200 }, // candy-3.svg (bottom right)
//   { x: 190, y: -230, radius: 200 }, // candy-2.svg (bottom left)
//   { x: -150, y: 70, radius: 200 }, // candy-1.svg (top)
//   { x: 350, y: 500, radius: 200 }, // candy-full.svg (bottom)
// ];

let hammerScale = 0;

let grid = [];
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const numberWidth = 100;
const numberHeight = 500;
grid.push({
  x: centerX - numberWidth / 2,
  y: centerY - numberHeight / 2,
  width: numberWidth,
  height: numberHeight,
  rotation: 0,
  rotationSpeed: 0,
  isFalling: false,
  velX: 0,
  velY: 0,
  fallRotation: Math.random() > 0.5 ? 5 : -5,
  isBlocked: true,
});

const gridX = 2;
const gridY = 4;
const cellSizeX = 400;
const cellSizeY = 200;
for (let x = 0; x < gridX; x++) {
  for (let y = 0; y < gridY; y++) {
    grid.push({
      x: centerX - (gridX * cellSizeX) / 2 + x * cellSizeX,
      y: centerY - (gridY * cellSizeY) / 2 + y * cellSizeY,
      width: cellSizeX,
      height: cellSizeY,
      rotation: 0,
      rotationSpeed: 0,
      isFalling: false,
      velX: 0,
      velY: 0,
      fallRotation: Math.random() > 0.5 ? 5 : -5,
    });
  }
}

let topLayerIndex = svgPaths.length - 1;
const svgSize = 2000;
const images = [];
let imagesLoaded = 0;

console.log("Starting to load SVGs...");
svgPaths.forEach((path, i) => {
  const img = new Image();
  img.onload = () => {
    imagesLoaded++;
    console.log(`✓ Loaded (${imagesLoaded}/${svgPaths.length}): ${path}`);
  };
  img.onerror = (err) => {
    console.error(`✗ Failed to load: ${path}`, err);
    imagesLoaded++;
  };
  console.log(`Attempting to load: ${path}`);
  img.src = path;
  images[i] = img;
});

// Track mouse
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mouseX = (e.clientX - rect.left) * scaleX;
  mouseY = (e.clientY - rect.top) * scaleY;
});

// Custom cursor
const cursorImg = new Image();
cursorImg.src = "hammer.svg";
canvas.style.cursor = "none";

// Hammer swing variables
let hammerRotation = 0;
let hammerRotationTarget = 0;
const hammerMaxRotation = Math.PI / 8;
const speedClockwise = 0.1;
const speedCounter = 0.2;

let hammerSwinging = false;
let removeLayerNext = false;

canvas.addEventListener("click", () => {
  if (!hammerSwinging) {
    // Always play hammer animation
    hammerRotationTarget = hammerMaxRotation;
    hammerSwinging = true;

    // Check if click is within the current top layer's zone
    if (topLayerIndex > 0) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const zone = clickZones[topLayerIndex];

      const zoneX = centerX + zone.x;
      const zoneY = centerY + zone.y;

      const dx = mouseX - zoneX;
      const dy = mouseY - zoneY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      console.log(`Click distance: ${distance}, zone radius: ${zone.radius}`);

      if (distance <= zone.radius) {
        removeLayerNext = true;
      } else {
        console.log("Click outside the target zone!");
        removeLayerNext = false;
      }
    }
  }
});

function update(dt) {
  const x = canvas.width / 2;
  const y = canvas.height / 2;

  // Clear canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Loading status
  if (imagesLoaded < svgPaths.length) {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Loading SVGs: ${imagesLoaded}/${svgPaths.length}`,
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  // Draw SVG layers
  // ctx.save()
  // ctx.translate(x, y)
  // for (let i = 0; i <= topLayerIndex; i++) {
  //     ctx.drawImage(images[i], -svgSize / 2, -svgSize / 2, svgSize, svgSize)
  // }
  // ctx.restore()

  const inputX = input.getX();
  const inputY = input.getY();

  grid = grid.filter((o) => {
    return o.y < canvas.height + 100;
  });

  if (grid.length == 1) {
    grid[0].isBlocked = false;
  }

  if (grid.length == 0) {
    finish();
  }

  for (let i = 0; i < grid.length; i++) {
    grid[i].isOver =
      inputX >= grid[i].x &&
      inputX <= grid[i].x + grid[i].width &&
      inputY >= grid[i].y &&
      inputY <= grid[i].y + grid[i].height;

    if (
      input.isPressed() &&
      grid[i].isOver &&
      !grid[i].isFalling &&
      !grid[i].isBlocked
    ) {
      grid[i].isFalling = true;

      const onRight = grid[i].x >= centerX;
      grid[i].velX = onRight ? 200 : -200;
    }

    if (grid[i].isFalling) {
      grid[i].velY += 5000 * dt;
      grid[i].rotationSpeed += grid[i].fallRotation * dt;
    }

    grid[i].x += grid[i].velX * dt;
    grid[i].y += grid[i].velY * dt;
    grid[i].rotation += grid[i].rotationSpeed * dt;
  }

  for (let i = grid.length - 1; i >= 0; i--) {
    ctx.save();
    ctx.translate(
      grid[i].x + grid[i].width / 2,
      grid[i].y + grid[i].height / 2
    );
    ctx.rotate(grid[i].rotation);

    drawOutline(grid[i]);
    ctx.restore();
  }

  for (let i = grid.length - 1; i >= 0; i--) {
    ctx.save();
    ctx.translate(
      grid[i].x + grid[i].width / 2,
      grid[i].y + grid[i].height / 2
    );
    ctx.rotate(grid[i].rotation);

    if (grid[i].isFalling) {
      drawOutline(grid[i]);
    }
    // main image
    ctx.beginPath();
    ctx.rect(
      -grid[i].width / 2,
      -grid[i].height / 2,
      grid[i].width,
      grid[i].height
    );
    // if (grid[i].isBlocked) {
    //   ctx.fillStyle = "white";
    // } else {
    //   ctx.fillStyle = grid[i].isOver || grid[i].isFalling ? "red" : "green";
    // }
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
  }

  // Debug: Show click zone for current top layer
  //   if (topLayerIndex > 0) {
  //     const zone = clickZones[topLayerIndex];
  //     ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  //     ctx.lineWidth = 2;
  //     ctx.beginPath();
  //     ctx.arc(x + zone.x, y + zone.y, zone.radius, 0, Math.PI * 2);
  //     ctx.stroke();
  //   }

  // Hammer animation
  const currentSpeed =
    hammerRotationTarget > hammerRotation ? speedClockwise : speedCounter;
  hammerRotation += (hammerRotationTarget - hammerRotation) * currentSpeed;

  // Remove layer at max forward swing
  if (removeLayerNext && hammerRotation >= hammerMaxRotation - 0.01) {
    if (topLayerIndex > 0) {
      topLayerIndex--;
      console.log(`Layer removed. Remaining layers: ${topLayerIndex + 1}`);
    }
    removeLayerNext = false;
  }

  // Flip direction or reset
  if (Math.abs(hammerRotation - hammerRotationTarget) < 0.01) {
    if (hammerRotationTarget > 0) {
      hammerRotationTarget = -hammerMaxRotation;
    } else if (hammerRotationTarget < 0) {
      hammerRotationTarget = 0;
      hammerSwinging = false;
    }
  }

  // Draw hammer
  if (cursorImg.complete) {
    const cursorWidth = cursorImg.width;
    const cursorHeight = cursorImg.height;

    const isEnd = (grid.length == 1 && grid[0].isFalling) || grid.length == 0;

    const targetScale = isEnd ? 0 : 1.2;
    hammerScale = math.lerp(hammerScale, targetScale, 10 * dt);

    ctx.save();
    ctx.translate(mouseX, mouseY);
    ctx.scale(hammerScale, hammerScale);
    ctx.rotate(hammerRotation);
    ctx.drawImage(
      cursorImg,
      -cursorWidth * 0.1,
      -cursorHeight * 0.5,
      cursorWidth,
      cursorHeight
    );
    ctx.restore();
  }
}

function drawOutline(item) {
  // stroke
  ctx.beginPath();
  const strokeWidth = 4;
  ctx.roundRect(
    -item.width / 2 - strokeWidth,
    -item.height / 2 - strokeWidth,
    item.width + strokeWidth * 2,
    item.height + strokeWidth * 2,
    strokeWidth
  );
  ctx.fillStyle = "red";
  ctx.fill();
}

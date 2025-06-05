// TSP Game – The Route Challenge
// Uses Globe.gl, Three.js, and Turf.js for calculations and rendering

// === 1. COUNTRY DATA (15 nodes, can be customized) ===
const countryNodes = [
  { name: "United States", lat: 37.0902, lng: -95.7129 },
  { name: "Brazil", lat: -14.2350, lng: -51.9253 },
  { name: "United Kingdom", lat: 55.3781, lng: -3.4360 },
  { name: "Germany", lat: 51.1657, lng: 10.4515 },
  { name: "South Africa", lat: -30.5595, lng: 22.9375 },
  { name: "Egypt", lat: 26.8206, lng: 30.8025 },
  { name: "Russia", lat: 61.5240, lng: 105.3188 },
  { name: "India", lat: 20.5937, lng: 78.9629 },
  { name: "China", lat: 35.8617, lng: 104.1954 },
  { name: "Japan", lat: 36.2048, lng: 138.2529 },
  { name: "Australia", lat: -25.2744, lng: 133.7751 },
  { name: "Indonesia", lat: -0.7893, lng: 113.9213 },
  { name: "Saudi Arabia", lat: 23.8859, lng: 45.0792 },
  { name: "Canada", lat: 56.1304, lng: -106.3468 },
  { name: "Mexico", lat: 23.6345, lng: -102.5528 }
];

// === 2. GAME STATE ===
let selectedNodes = [];
let arcsData = [];
let totalDistance = 0;
let totalEnergy = 0;
let isAutoRotating = true;
let globe;

// === 3. GLOBE INITIALIZATION ===
function initGlobe() {
  globe = Globe()
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .pointsData(countryNodes)
    .pointColor(() => '#00f3ff')
    .pointAltitude(0.03)
    .pointRadius(0.45)
    .pointsMerge(true)
    .arcsData(arcsData)
    .arcColor(() => '#00f3ff')
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(1200)
    .arcStroke(1.5)
    .arcAltitude(0.2)
    .onPointClick(handleNodeClick)
    .onPointHover(handleNodeHover)
    (document.getElementById('globe-container'));

  globe.controls().autoRotate = isAutoRotating;
  globe.controls().autoRotateSpeed = 0.5;

  // Responsive globe
  window.addEventListener('resize', () => {
    globe.width(document.getElementById('globe-container').offsetWidth);
    globe.height(document.getElementById('globe-container').offsetHeight);
  });
}

// === 4. NODE CLICK HANDLER ===
function handleNodeClick(node) {
  if (selectedNodes.length === 0) {
    selectedNodes.push(node);
    updateUI();
    return;
  }
  // Prevent duplicate selection
  if (selectedNodes.some(n => n.name === node.name)) return;

  // Animate arc from last node to this node
  const lastNode = selectedNodes[selectedNodes.length - 1];
  animateArc(lastNode, node, () => {
    selectedNodes.push(node);
    updateScore(lastNode, node);
    updateUI();
  });
}

// === 5. ANIMATED ARC DRAWING ===
function animateArc(start, end, onComplete) {
  // Add arc to arcsData with a unique id
  const arc = {
    startLat: start.lat,
    startLng: start.lng,
    endLat: end.lat,
    endLng: end.lng,
    color: '#00f3ff',
    animationProgress: 0 // custom property for animation
  };
  arcsData.push(arc);
  globe.arcsData([...arcsData]); // update globe

  // Animate the arc's dash length
  let progress = 0;
  const duration = 600; // ms
  const step = 16;
  function animate() {
    progress += step;
    arc.arcDashLength = Math.min(1, progress / duration);
    globe.arcsData([...arcsData]);
    if (progress < duration) {
      requestAnimationFrame(animate);
    } else {
      arc.arcDashLength = 1;
      globe.arcsData([...arcsData]);
      if (onComplete) onComplete();
    }
  }
  animate();
}

// === 6. NODE HOVER HANDLER (TOOLTIP) ===
function handleNodeHover(node) {
  let tooltip = document.querySelector('.tooltip');
  if (node) {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = node.name;
    document.body.onmousemove = e => {
      tooltip.style.left = (e.clientX + 15) + 'px';
      tooltip.style.top = (e.clientY + 10) + 'px';
    };
  } else if (tooltip) {
    tooltip.remove();
    document.body.onmousemove = null;
  }
}

// === 7. SCORE CALCULATION ===
function updateScore(from, to) {
  // Use turf.js for geodesic distance
  const fromPt = turf.point([from.lng, from.lat]);
  const toPt = turf.point([to.lng, to.lat]);
  const dist = turf.distance(fromPt, toPt, { units: 'kilometers' });
  totalDistance += dist;
  totalEnergy += Math.round(dist / 100); // 1 energy per 100km
}

// === 8. UI UPDATE ===
function updateUI() {
  // Path sequence
  document.getElementById('path-sequence').textContent =
    selectedNodes.length > 0
      ? selectedNodes.map(n => countryNodes.findIndex(c => c.name === n.name) + 1).join(' → ')
      : '0';

  // Stats
  document.getElementById('total-distance').textContent = `${Math.round(totalDistance)} km`;
  document.getElementById('energy-units').textContent = `${totalEnergy} units`;
  document.getElementById('countries-visited').textContent = selectedNodes.length;

  // If all nodes visited, allow closing the loop
  if (selectedNodes.length === countryNodes.length) {
    document.getElementById('complete-route').disabled = false;
  } else {
    document.getElementById('complete-route').disabled = true;
  }
}

// === 9. BUTTONS ===
function setupButtons() {
  // Auto Rotate
  document.getElementById('auto-rotate').onclick = () => {
    isAutoRotating = !isAutoRotating;
    globe.controls().autoRotate = isAutoRotating;
  };

  // Reset
  document.getElementById('reset').onclick = () => {
    selectedNodes = [];
    arcsData = [];
    totalDistance = 0;
    totalEnergy = 0;
    globe.arcsData([]);
    updateUI();
  };

  // Optimize (Nearest Neighbor TSP)
  document.getElementById('optimize').onclick = () => {
    // Simple nearest neighbor
    let unvisited = [...countryNodes];
    let route = [unvisited[0]];
    unvisited.splice(0, 1);
    let current = route[0];
    let dist = 0, energy = 0;
    let arcs = [];
    while (unvisited.length) {
      let nearestIdx = 0, minDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = turf.distance(
          turf.point([current.lng, current.lat]),
          turf.point([unvisited[i].lng, unvisited[i].lat]),
          { units: 'kilometers' }
        );
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }
      let next = unvisited[nearestIdx];
      arcs.push({
        startLat: current.lat, startLng: current.lng,
        endLat: next.lat, endLng: next.lng,
        color: '#00f3ff'
      });
      dist += minDist;
      energy += Math.round(minDist / 100);
      current = next;
      route.push(current);
      unvisited.splice(nearestIdx, 1);
    }
    // Close the loop
    arcs.push({
      startLat: current.lat, startLng: current.lng,
      endLat: route[0].lat, endLng: route[0].lng,
      color: '#00f3ff'
    });
    dist += turf.distance(
      turf.point([current.lng, current.lat]),
      turf.point([route[0].lng, route[0].lat]),
      { units: 'kilometers' }
    );
    energy += Math.round(dist / 100);

    selectedNodes = [...route];
    arcsData = arcs;
    totalDistance = dist;
    totalEnergy = energy;
    globe.arcsData([...arcsData]);
    updateUI();
  };

  // Complete Route
  document.getElementById('complete-route').onclick = () => {
    // Validation
    if (
      selectedNodes.length === countryNodes.length &&
      selectedNodes[0].name !== selectedNodes[selectedNodes.length - 1].name
    ) {
      // Animate closing arc
      animateArc(
        selectedNodes[selectedNodes.length - 1],
        selectedNodes[0],
        () => {
          updateScore(selectedNodes[selectedNodes.length - 1], selectedNodes[0]);
          selectedNodes.push(selectedNodes[0]);
          updateUI();
          showResultModal();
        }
      );
    } else if (
      selectedNodes.length === countryNodes.length + 1 &&
      selectedNodes[0].name === selectedNodes[selectedNodes.length - 1].name
    ) {
      showResultModal();
    }
  };

  // Design Thinking
  document.getElementById('design-thinking').onclick = () => {
    showModal(
      'Design Thinking',
      `<h3>About the Traveling Salesman Problem</h3>
      <p>The Traveling Salesman Problem (TSP) is a classic challenge: "Given a list of cities and the distances between each pair, what is the shortest possible route that visits each city exactly once and returns to the origin?"</p>
      <h3>How to Play</h3>
      <ul>
        <li>Click on glowing nodes to build your route.</li>
        <li>Visit all countries once and return to the start.</li>
        <li>Try to minimize your total distance and energy!</li>
      </ul>
      <h3>Optimization</h3>
      <p>The 'Optimize' button uses a nearest neighbor algorithm for a quick, though not always optimal, solution.</p>`
    );
  };
}

// === 10. MODAL ===
function showResultModal() {
  showModal(
    'Route Results',
    `<p>You visited all <b>${countryNodes.length}</b> countries!</p>
     <p><b>Total Distance:</b> ${Math.round(totalDistance)} km</p>
     <p><b>Energy Used:</b> ${totalEnergy} units</p>
     <p>Try to optimize your route for a better score!</p>`
  );
}
function showModal(title, html) {
  const modal = document.getElementById('result-modal');
  modal.querySelector('h2').innerHTML = title;
  modal.querySelector('#result-content').innerHTML = html;
  modal.style.display = 'block';
}
document.querySelector('.close').onclick = () => {
  document.getElementById('result-modal').style.display = 'none';
};
window.onclick = e => {
  if (e.target === document.getElementById('result-modal')) {
    document.getElementById('result-modal').style.display = 'none';
  }
};

// === 11. INIT ===
window.addEventListener('DOMContentLoaded', () => {
  initGlobe();
  setupButtons();
  updateUI();
}); 
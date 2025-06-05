// TSP Game - The Route Challenge
// Main JavaScript implementation

// Global variables
let globe;
let selectedCountries = [];
let totalDistance = 0;
let energyUnits = 0;
let isAutoRotating = true;
let arcsData = [];

// Country nodes data with additional information
const countryNodes = [
    { 
        name: "United States", 
        lat: 37.0902, 
        lng: -95.7129, 
        color: "#00f3ff",
        capital: "Washington, D.C.",
        population: "331 million"
    },
    { 
        name: "Brazil", 
        lat: -14.2350, 
        lng: -51.9253, 
        color: "#00f3ff",
        capital: "Brasília",
        population: "213 million"
    },
    { 
        name: "United Kingdom", 
        lat: 55.3781, 
        lng: -3.4360, 
        color: "#00f3ff",
        capital: "London",
        population: "67 million"
    },
    { 
        name: "Germany", 
        lat: 51.1657, 
        lng: 10.4515, 
        color: "#00f3ff",
        capital: "Berlin",
        population: "83 million"
    },
    { 
        name: "South Africa", 
        lat: -30.5595, 
        lng: 22.9375, 
        color: "#00f3ff",
        capital: "Pretoria",
        population: "60 million"
    },
    { 
        name: "Egypt", 
        lat: 26.8206, 
        lng: 30.8025, 
        color: "#00f3ff",
        capital: "Cairo",
        population: "102 million"
    },
    { 
        name: "Russia", 
        lat: 61.5240, 
        lng: 105.3188, 
        color: "#00f3ff",
        capital: "Moscow",
        population: "146 million"
    },
    { 
        name: "India", 
        lat: 20.5937, 
        lng: 78.9629, 
        color: "#00f3ff",
        capital: "New Delhi",
        population: "1.38 billion"
    },
    { 
        name: "China", 
        lat: 35.8617, 
        lng: 104.1954, 
        color: "#00f3ff",
        capital: "Beijing",
        population: "1.4 billion"
    },
    { 
        name: "Japan", 
        lat: 36.2048, 
        lng: 138.2529, 
        color: "#00f3ff",
        capital: "Tokyo",
        population: "126 million"
    },
    { 
        name: "Australia", 
        lat: -25.2744, 
        lng: 133.7751, 
        color: "#00f3ff",
        capital: "Canberra",
        population: "25 million"
    },
    { 
        name: "Indonesia", 
        lat: -0.7893, 
        lng: 113.9213, 
        color: "#00f3ff",
        capital: "Jakarta",
        population: "273 million"
    },
    { 
        name: "Saudi Arabia", 
        lat: 23.8859, 
        lng: 45.0792, 
        color: "#00f3ff",
        capital: "Riyadh",
        population: "35 million"
    },
    { 
        name: "Canada", 
        lat: 56.1304, 
        lng: -106.3468, 
        color: "#00f3ff",
        capital: "Ottawa",
        population: "38 million"
    },
    { 
        name: "Mexico", 
        lat: 23.6345, 
        lng: -102.5528, 
        color: "#00f3ff",
        capital: "Mexico City",
        population: "128 million"
    }
];

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGlobe();
    setupEventListeners();
    updateUI();
});

// Initialize the 3D globe
function initGlobe() {
    // Clear the container first
    document.getElementById('globe-container').innerHTML = '';
    
    globe = Globe()
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .pointsData(countryNodes)
        .pointAltitude(0.02)  // Slightly raised for better visibility
        .pointRadius(2.0)     // Much larger points for easier selection
        .pointResolution(32)  // Higher resolution for smoother circles
        .pointsMerge(false)   // Don't merge for better interaction
        .pointColor(point => {
            // Check if point is selected
            const isSelected = selectedCountries.some(c => c.name === point.name);
            return isSelected ? '#ff00ff' : '#00f3ff';
        })
        .pointLabel(point => point.name) // Show name on hover
        .pointsMerge(false)   // Ensure points aren't merged for interaction
        .arcsData(arcsData)
        .arcColor(() => '#00f3ff')
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(1500)
        .arcStroke(0.8)  // Thicker arcs
        .arcAltitude(0.4)  // Adjusted to be visible but not too far
        .arcCurveResolution(64)  // Smoother arc curves
        .onPointClick(handlePointClick)
        .onPointHover(handlePointHover)
        (document.getElementById('globe-container'));
        
    // Enhance raycasting sensitivity by adding invisible larger hitboxes
    setTimeout(() => {
        // Get the Three.js scene
        const threeScene = globe.scene();
        const pointsObj = threeScene.getObjectByName('points');
        
        if (pointsObj) {
            // Create a raycaster with significantly increased precision
            const raycaster = new THREE.Raycaster();
            raycaster.params.Points.threshold = 10; // Much larger threshold for very easy selection
            
            // Replace the default raycaster in the globe's controls
            if (globe.controls() && globe.controls().domElement) {
                // Store original raycaster functions
                const originalRaycast = globe.controls().domElement.addEventListener;
                
                // Override with our enhanced raycaster
                globe.controls().domElement.addEventListener = function(type, listener, options) {
                    if (type === 'click' || type === 'mousemove') {
                        const enhancedListener = function(event) {
                            // Use enhanced raycasting for better hit detection
                            const rect = this.getBoundingClientRect();
                            const mouse = new THREE.Vector2();
                            mouse.x = ((event.clientX - rect.left) / this.clientWidth) * 2 - 1;
                            mouse.y = -((event.clientY - rect.top) / this.clientHeight) * 2 + 1;
                            
                            raycaster.setFromCamera(mouse, globe.camera());
                            
                            // Call the original listener with enhanced detection
                            listener.call(this, event);
                        };
                        return originalRaycast.call(this, type, enhancedListener, options);
                    }
                    return originalRaycast.call(this, type, listener, options);
                };
            }
        }
    }, 200);
    
    // Set initial camera position and controls
    globe.pointOfView({ altitude: 2.0 }); // Closer view of the globe
    globe.controls().autoRotate = isAutoRotating;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = true;
    globe.controls().enablePan = true;
    globe.controls().minDistance = 200; // Prevent zooming in too close
    globe.controls().maxDistance = 500; // Prevent zooming out too far
    
    // Add enhanced glow effect to points with outer glow for better visibility
    setTimeout(() => {
        const pointsObj = globe.scene().getObjectByName('points');
        if (pointsObj && pointsObj.material) {
            // Make points larger and glowing
            pointsObj.material.size = 8; // Even larger for better visibility
            pointsObj.material.transparent = true;
            pointsObj.material.opacity = 0.9;
            
            // Add glow effect with a custom shader that includes outer glow
            const originalMaterial = pointsObj.material;
            const glowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color('#00f3ff') },
                    pointTexture: { value: originalMaterial.map },
                    time: { value: 0.0 },
                    selectedColor: { value: new THREE.Color('#ff00ff') },
                    hoverColor: { value: new THREE.Color('#00ffff') },
                    glowStrength: { value: 0.6 },
                    pulseSpeed: { value: 2.0 }
                },
                vertexShader: `
                    uniform float time;
                    uniform float pulseSpeed;
                    attribute float selected;
                    attribute float hovered;
                    varying vec3 vColor;
                    varying float vSelected;
                    varying float vHovered;
                    void main() {
                        vSelected = selected;
                        vHovered = hovered;
                        vColor = color;
                        
                        // Add pulsing effect based on time
                        float pulse = 1.0 + 0.3 * sin(time * pulseSpeed);
                        
                        // Make points even larger when selected or hovered
                        float sizeMultiplier = 1.0;
                        if (vSelected > 0.5) sizeMultiplier = 1.5;
                        else if (vHovered > 0.5) sizeMultiplier = 1.3;
                        
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * pulse * sizeMultiplier * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform vec3 selectedColor;
                    uniform vec3 hoverColor;
                    uniform sampler2D pointTexture;
                    uniform float glowStrength;
                    varying vec3 vColor;
                    varying float vSelected;
                    varying float vHovered;
                    void main() {
                        // Calculate distance from center for glow effect
                        vec2 center = vec2(0.5, 0.5);
                        float dist = distance(gl_PointCoord, center);
                        
                        // Choose color based on selected/hovered state
                        vec3 finalColor = color;
                        if (vSelected > 0.5) finalColor = selectedColor;
                        else if (vHovered > 0.5) finalColor = hoverColor;
                        
                        // Create soft circular point with outer glow
                        float alpha = smoothstep(0.5, 0.0, dist);
                        float glowAlpha = smoothstep(1.0, 0.5, dist) * glowStrength;
                        
                        // Combine core point with glow
                        gl_FragColor = vec4(finalColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
                        gl_FragColor.a = max(alpha, glowAlpha);
                        
                        // Add extra brightness to center
                        if (dist < 0.2) {
                            gl_FragColor.rgb += vec3(0.3, 0.3, 0.3);
                        }
                    }
                `,
                blending: THREE.AdditiveBlending,
                depthTest: true,
                transparent: true
            });
            
            // Create attributes for selected and hovered states
            const selectedAttr = new Float32Array(pointsObj.geometry.attributes.position.count);
            const hoveredAttr = new Float32Array(pointsObj.geometry.attributes.position.count);
            
            // Initialize all to not selected/hovered
            for (let i = 0; i < selectedAttr.length; i++) {
                selectedAttr[i] = 0.0;
                hoveredAttr[i] = 0.0;
            }
            
            // Add attributes to geometry
            pointsObj.geometry.setAttribute('selected', new THREE.BufferAttribute(selectedAttr, 1));
            pointsObj.geometry.setAttribute('hovered', new THREE.BufferAttribute(hoveredAttr, 1));
            
            // Store references for later updates
            window.pointsObj = pointsObj;
            
            // Apply the material properties
            pointsObj.material = glowMaterial;
        }
    }, 100);
    
    // Adjust globe size
    const globeContainer = document.getElementById('globe-container');
    globe
        .width(globeContainer.offsetWidth)
        .height(globeContainer.offsetHeight);
        
    // Handle window resize
    window.addEventListener('resize', () => {
        globe
            .width(globeContainer.offsetWidth)
            .height(globeContainer.offsetHeight);
    });
    
    // Enhanced animation loop for point pulsing and shader updates
    const animate = () => {
        const pointsObj = window.pointsObj;
        if (pointsObj && pointsObj.material && pointsObj.material.uniforms) {
            // Update time uniform for pulsing effect
            const time = Date.now() * 0.001;
            pointsObj.material.uniforms.time.value = time;
            
            // Update selected and hovered attributes based on current state
            if (pointsObj.geometry.attributes.selected && pointsObj.geometry.attributes.hovered) {
                const selectedAttr = pointsObj.geometry.attributes.selected;
                const hoveredAttr = pointsObj.geometry.attributes.hovered;
                
                // Reset all to not selected/hovered
                for (let i = 0; i < selectedAttr.count; i++) {
                    selectedAttr.array[i] = 0.0;
                    hoveredAttr.array[i] = 0.0;
                }
                
                // Mark selected points
                countryNodes.forEach((node, index) => {
                    if (selectedCountries.some(c => c.name === node.name)) {
                        selectedAttr.array[index] = 1.0;
                    }
                    
                    // Mark hovered point
                    if (window.hoveredPoint && window.hoveredPoint.name === node.name) {
                        hoveredAttr.array[index] = 1.0;
                    }
                });
                
                // Update the attributes
                selectedAttr.needsUpdate = true;
                hoveredAttr.needsUpdate = true;
            }
        }
        requestAnimationFrame(animate);
    };
    animate();
}

// Handle point click event with visual feedback and auto-zoom
function handlePointClick(point) {
    // Play a subtle click sound (optional)
    playClickSound();
    
    // Prevent double-clicking issues with a short debounce
    if (window.lastClickTime && (Date.now() - window.lastClickTime < 300)) {
        return; // Ignore clicks that happen too quickly
    }
    window.lastClickTime = Date.now();
    
    // If this is the first point or if the point is not already selected
    if (selectedCountries.length === 0 || !selectedCountries.some(c => c.name === point.name)) {
        // Add visual feedback - flash effect
        if (window.pointsObj && window.pointsObj.material && window.pointsObj.material.uniforms) {
            // Flash effect using shader uniforms
            const originalGlowStrength = window.pointsObj.material.uniforms.glowStrength.value;
            window.pointsObj.material.uniforms.glowStrength.value = 1.0; // Increase glow
            
            // Return to normal glow after a short delay
            setTimeout(() => {
                window.pointsObj.material.uniforms.glowStrength.value = originalGlowStrength;
            }, 300);
        }
        
        // Add to selected countries
        selectedCountries.push(point);
        
        // Visual feedback only - no auto-zoom
        
        // Show a subtle notification that the point was selected
        showNotification(`Selected: ${point.name}`, 'success');
        
        // If we have more than one point, create an arc between the last two points
        if (selectedCountries.length > 1) {
            const startPoint = selectedCountries[selectedCountries.length - 2];
            const endPoint = selectedCountries[selectedCountries.length - 1];
            
            // Calculate distance between points
            const distance = calculateDistance(startPoint, endPoint);
            totalDistance += distance;
            
            // Calculate energy units (simplified as distance / 100)
            const energy = Math.round(distance / 100);
            energyUnits += energy;
            
            // Add arc data with animation
            const newArc = {
                startLat: startPoint.lat,
                startLng: startPoint.lng,
                endLat: endPoint.lat,
                endLng: endPoint.lng,
                color: '#00f3ff',
                stroke: 1.8, // Slightly thicker for better visibility
                altitude: 0.4, // Match the altitude set in initGlobe
                animationDuration: 1000 + (distance * 2) // Longer distance = longer animation
            };
            
            arcsData.push(newArc);
            
            // Update the globe with new arcs
            globe.arcsData([...arcsData]);
            
            // Add a pulsing effect to the new arc
            setTimeout(() => {
                const arcIndex = arcsData.findIndex(arc => 
                    arc.startLat === newArc.startLat && 
                    arc.startLng === newArc.startLng &&
                    arc.endLat === newArc.endLat &&
                    arc.endLng === newArc.endLng
                );
                
                if (arcIndex !== -1) {
                    arcsData[arcIndex].stroke = 1.5;
                    globe.arcsData([...arcsData]);
                }
            }, newArc.animationDuration);
        }
        
        // Update UI with animation
        updateUI();
        
        // If all countries are selected, complete the route
        if (selectedCountries.length === countryNodes.length) {
            setTimeout(() => {
                validateAndCompleteRoute();
            }, 500);
        }
    }
}

// Play a subtle click sound (optional)
function playClickSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
            Array(1000).join('123'));
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
        console.log('Audio error:', e);
    }
}

// Show notification for user feedback
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '2000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    
    // Set color based on type
    if (type === 'success') {
        notification.style.backgroundColor = 'rgba(0, 255, 128, 0.9)';
        notification.style.color = '#000';
        notification.style.boxShadow = '0 0 15px rgba(0, 255, 128, 0.7)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
        notification.style.color = '#fff';
        notification.style.boxShadow = '0 0 15px rgba(255, 50, 50, 0.7)';
    } else {
        notification.style.backgroundColor = 'rgba(0, 243, 255, 0.9)';
        notification.style.color = '#000';
        notification.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.7)';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);
    
    // Fade out and remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Handle point hover event with enhanced tooltip and auto-zoom hint
function handlePointHover(point) {
    // Track the currently hovered point for animation purposes
    window.hoveredPoint = point;
    
    // Remove any existing tooltip
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip && existingTooltip._moveHandler) {
        document.removeEventListener('mousemove', existingTooltip._moveHandler);
        existingTooltip.remove();
    }

    if (point) {
        
        // Create enhanced tooltip with more visual appeal
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Format population number with commas
        const formattedPopulation = point.population ? 
            point.population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N/A';
        
        // Add more detailed country info with better formatting
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${point.name}</strong>
            </div>
            <div class="tooltip-body">
                <div><span class="tooltip-label">Capital:</span> ${point.capital || 'N/A'}</div>
                <div><span class="tooltip-label">Population:</span> ${formattedPopulation}</div>
                ${point.continent ? `<div><span class="tooltip-label">Continent:</span> ${point.continent}</div>` : ''}
                <div class="tooltip-hint">Click to select</div>
            </div>
        `;
        
        // Apply styled tooltip
        tooltip.style.position = 'absolute';
        tooltip.style.top = '-1000px';
        tooltip.style.left = '-1000px';
        tooltip.style.backgroundColor = 'rgba(0, 15, 30, 0.85)';
        tooltip.style.color = '#00f3ff';
        tooltip.style.padding = '12px 16px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        tooltip.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.5)';
        tooltip.style.border = '2px solid rgba(0, 243, 255, 0.7)';
        tooltip.style.minWidth = '200px';
        tooltip.style.backdropFilter = 'blur(5px)';
        tooltip.style.transition = 'opacity 0.2s ease';
        
        // Style the header and labels
        const header = tooltip.querySelector('.tooltip-header');
        if (header) {
            header.style.borderBottom = '1px solid rgba(0, 243, 255, 0.3)';
            header.style.marginBottom = '8px';
            header.style.paddingBottom = '8px';
            header.style.fontSize = '16px';
            header.style.textAlign = 'center';
        }
        
        const labels = tooltip.querySelectorAll('.tooltip-label');
        labels.forEach(label => {
            label.style.color = '#00f3ff';
            label.style.fontWeight = 'bold';
            label.style.marginRight = '5px';
        });
        
        // Style the hint
        const hint = tooltip.querySelector('.tooltip-hint');
        if (hint) {
            hint.style.marginTop = '8px';
            hint.style.fontSize = '14px';
            hint.style.color = '#ff00ff';
            hint.style.textAlign = 'center';
            hint.style.fontStyle = 'italic';
        }
        
        document.body.appendChild(tooltip);
        
        // Add mousemove event to update tooltip position with smooth animation
        const moveTooltip = (e) => {
            // Position tooltip near cursor but with some offset
            const x = e.clientX + 20;
            const y = e.clientY + 20;
            
            // Check if tooltip would go off-screen and adjust if needed
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const finalX = x + tooltipRect.width > viewportWidth ? 
                viewportWidth - tooltipRect.width - 10 : x;
            
            const finalY = y + tooltipRect.height > viewportHeight ? 
                viewportHeight - tooltipRect.height - 10 : y;
            
            tooltip.style.top = `${finalY}px`;
            tooltip.style.left = `${finalX}px`;
        };
        
        // Store the event handler for later removal
        tooltip._moveHandler = moveTooltip;
        document.addEventListener('mousemove', moveTooltip);
        
        // Set initial position based on current mouse position
        if (window.event) {
            moveTooltip(window.event);
        }
        
        // Update cursor
        document.body.style.cursor = 'pointer';
    } else {
        // Reset cursor when not hovering over a point
        document.body.style.cursor = 'default';
    }
}

// Calculate distance between two points on Earth (using Haversine formula)
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
}

// Update UI elements with animations
function updateUI() {
    // Update path sequence with animation
    const pathSequence = document.getElementById('path-sequence');
    const newSequence = selectedCountries.length > 0 ? 
        selectedCountries.map((_, index) => `<span class="path-step">${index}</span>`).join(' → ') : '0';
    
    if (pathSequence.innerHTML !== newSequence) {
        pathSequence.style.opacity = '0';
        setTimeout(() => {
            pathSequence.innerHTML = newSequence;
            pathSequence.style.opacity = '1';
        }, 200);
    }
    
    // Update distance with counting animation
    const distanceElement = document.getElementById('total-distance');
    const targetDistance = totalDistance;
    animateValue(distanceElement, parseInt(distanceElement.textContent) || 0, targetDistance, 500);
    
    // Update energy with counting animation
    const energyElement = document.getElementById('energy-units');
    const targetEnergy = energyUnits;
    animateValue(energyElement, parseInt(energyElement.textContent) || 0, targetEnergy, 500);
    
    // Update countries visited with animation
    const countriesElement = document.getElementById('countries-visited');
    const targetCount = selectedCountries.length;
    animateValue(countriesElement, parseInt(countriesElement.textContent) || 0, targetCount, 500);
    
    // Update progress indicator
    updateProgressIndicator();
}

// Animate numeric value changes
function animateValue(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();
    
    function updateValue(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (range * progress));
        
        if (element.id === 'total-distance') {
            element.textContent = `${current.toLocaleString()} km`;
        } else if (element.id === 'energy-units') {
            element.textContent = `${current.toLocaleString()} units`;
        } else {
            element.textContent = current;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Update progress indicator
function updateProgressIndicator() {
    const progress = (selectedCountries.length / countryNodes.length) * 100;
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
    }
}

// Setup event listeners for buttons
function setupEventListeners() {
    // Auto rotate button
    document.getElementById('auto-rotate').addEventListener('click', () => {
        isAutoRotating = !isAutoRotating;
        globe.controls().autoRotate = isAutoRotating;
        document.getElementById('auto-rotate').textContent = isAutoRotating ? 'AUTO ROTATE' : 'AUTO ROTATE';
    });
    
    // New Game button - completely resets the game state
    document.getElementById('new-game').addEventListener('click', () => {
        // Show notification
        showNotification('Starting New Game', 'info');
        
        // Reset game state variables
        selectedCountries = [];
        totalDistance = 0;
        energyUnits = 0;
        arcsData = [];
        
        // Clear all visual elements
        globe.arcsData([]);
        
        // Reset the globe to default rotation and zoom level
        globe.pointOfView({ altitude: 2.0, lat: 0, lng: 0 });
        
        // Reset any custom point colors or states
        if (window.pointsObj && window.pointsObj.geometry) {
            const selectedAttr = window.pointsObj.geometry.attributes.selected;
            const hoveredAttr = window.pointsObj.geometry.attributes.hovered;
            
            if (selectedAttr && hoveredAttr) {
                // Reset all to not selected/hovered
                for (let i = 0; i < selectedAttr.count; i++) {
                    selectedAttr.array[i] = 0.0;
                    hoveredAttr.array[i] = 0.0;
                }
                
                // Update the attributes
                selectedAttr.needsUpdate = true;
                hoveredAttr.needsUpdate = true;
            }
        }
        
        // Update UI elements
        updateUI();
        
        // Clear any tooltips or notifications
        const existingTooltip = document.querySelector('.tooltip');
        if (existingTooltip && existingTooltip._moveHandler) {
            document.removeEventListener('mousemove', existingTooltip._moveHandler);
            existingTooltip.remove();
        }
    });
    
    // Optimize button (simplified TSP solution using nearest neighbor)
    document.getElementById('optimize').addEventListener('click', () => {
        optimizeRoute();
    });
    
    // Complete route button
    document.getElementById('complete-route').addEventListener('click', () => {
        validateAndCompleteRoute();
    });
    
    // Design thinking button - opens Google Docs file in a new tab
    document.getElementById('design-thinking').addEventListener('click', () => {
        window.open('https://docs.google.com/document/d/1YdGcXAO-q6Au8QCcoexwh6XVp1JU8MoqBl6L6Ef-GfA/edit?tab=t.0#heading=h.qh8b587pmeyj', '_blank');
    });
    
    // Modal close button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('result-modal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('result-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Optimize route using nearest neighbor algorithm
function optimizeRoute() {
    if (countryNodes.length === 0) return;
    
    // Reset current selections
    selectedCountries = [];
    totalDistance = 0;
    energyUnits = 0;
    arcsData = [];
    
    // Start with the first country
    let current = countryNodes[0];
    selectedCountries.push(current);
    
    // Create a copy of unvisited nodes
    let unvisited = [...countryNodes];
    unvisited.splice(0, 1); // Remove the starting node
    
    // Find nearest neighbor for each step
    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let minDistance = Infinity;
        
        // Find the nearest unvisited node
        for (let i = 0; i < unvisited.length; i++) {
            const distance = calculateDistance(current, unvisited[i]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }
        
        // Move to the nearest node
        current = unvisited[nearestIndex];
        selectedCountries.push(current);
        
        // Add arc
        if (selectedCountries.length > 1) {
            const startPoint = selectedCountries[selectedCountries.length - 2];
            const endPoint = selectedCountries[selectedCountries.length - 1];
            
            // Calculate distance and energy
            const distance = calculateDistance(startPoint, endPoint);
            totalDistance += distance;
            const energy = Math.round(distance / 100);
            energyUnits += energy;
            
            // Add arc data
            arcsData.push({
                startLat: startPoint.lat,
                startLng: startPoint.lng,
                endLat: endPoint.lat,
                endLng: endPoint.lng,
                color: '#00f3ff',
                altitude: 0.6  // Ensure consistent altitude with globe settings
            });
        }
        
        // Remove the visited node
        unvisited.splice(nearestIndex, 1);
    }
    
    // Complete the loop back to the start
    const startPoint = selectedCountries[selectedCountries.length - 1];
    const endPoint = selectedCountries[0];
    
    // Calculate final leg distance and energy
    const distance = calculateDistance(startPoint, endPoint);
    totalDistance += distance;
    energyUnits += Math.round(distance / 100);
    
    // Add final arc data
    arcsData.push({
        startLat: startPoint.lat,
        startLng: startPoint.lng,
        endLat: endPoint.lat,
        endLng: endPoint.lng,
        color: '#00f3ff'
    });
    
    // Update globe and UI
    globe.arcsData(arcsData);
    updateUI();
}

// Validate and complete the route
function validateAndCompleteRoute() {
    // Check if all nodes are visited
    if (selectedCountries.length < countryNodes.length) {
        showResult("Incomplete Route", "You need to visit all countries before completing the route.");
        return;
    }
    
    // Check if route returns to start
    if (selectedCountries.length > 1) {
        // Add the final leg back to the start
        const startPoint = selectedCountries[selectedCountries.length - 1];
        const endPoint = selectedCountries[0];
        
        // Calculate final leg distance and energy
        const distance = calculateDistance(startPoint, endPoint);
        totalDistance += distance;
        energyUnits += Math.round(distance / 100);
        
        // Add final arc data
        arcsData.push({
            startLat: startPoint.lat,
            startLng: startPoint.lng,
            endLat: endPoint.lat,
            endLng: endPoint.lng,
            color: '#00f3ff'
        });
        
        // Update globe and UI
        globe.arcsData(arcsData);
        updateUI();
        
        // Show results
        showResult("Route Complete!", `
            <p>You have successfully visited all ${countryNodes.length} countries!</p>
            <p>Total Distance: ${totalDistance} km</p>
            <p>Energy Units Used: ${energyUnits}</p>
            <p>Your route efficiency: ${calculateEfficiency()}%</p>
        `);
    }
}

// Calculate route efficiency (compared to optimal solution)
function calculateEfficiency() {
    // This is a simplified calculation - in a real app, you'd compare to a known optimal solution
    // Here we'll just use a theoretical minimum as a benchmark
    const theoreticalMinimum = 35000; // Example value
    const efficiency = Math.max(0, Math.min(100, Math.round((theoreticalMinimum / totalDistance) * 100)));
    return efficiency;
}

// Show result in modal
function showResult(title, content) {
    const modal = document.getElementById('result-modal');
    const resultContent = document.getElementById('result-content');
    
    // Set modal content
    document.querySelector('.modal-content h2').textContent = title;
    resultContent.innerHTML = content;
    
    // Show modal
    modal.style.display = 'block';
}

// Show design thinking information
function showDesignThinking() {
    showResult("Design Thinking", `
        <h3>About the Traveling Salesman Problem</h3>
        <p>The Traveling Salesman Problem (TSP) is a classic algorithmic problem in computer science:</p>
        <p>"Given a list of cities and the distances between each pair of cities, what is the shortest possible route that visits each city exactly once and returns to the origin city?"</p>
        
        <h3>Game Implementation</h3>
        <p>This game visualizes the TSP on a 3D globe, allowing players to:</p>
        <ul>
            <li>Manually create routes by selecting countries</li>
            <li>See the distance and energy cost of their route</li>
            <li>Try to find the optimal solution</li>
            <li>Use the "Optimize" feature to see a computer-generated solution</li>
        </ul>
        
        <h3>Algorithms</h3>
        <p>The "Optimize" button uses a nearest neighbor algorithm, which is a greedy approach to solving TSP. While not guaranteed to find the optimal solution, it's computationally efficient and produces reasonably good routes.</p>
    `);
}

// Add a listener to clean up tooltips when mouse leaves the globe container
document.getElementById('globe-container').addEventListener('mouseleave', () => {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        if (tooltip._moveHandler) {
            document.removeEventListener('mousemove', tooltip._moveHandler);
        }
        tooltip.remove();
    }
});

// Clean up tooltips when mouse moves outside points
document.addEventListener('mousemove', (e) => {
    if (!e.target.closest('#globe-container canvas')) {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip && tooltip._moveHandler) {
            document.removeEventListener('mousemove', tooltip._moveHandler);
            tooltip.remove();
        }
    }
});

// Initialize event listeners
setupEventListeners();

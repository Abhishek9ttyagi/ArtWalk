// --- Application State ---
const state = {
    tours: [],
    currentTour: null,
    currentArtwork: null,
    userLocation: { lat: 37.7749, lon: -122.4194 }, // Default start location
    locationWatcher: null,
};

// --- DOM Elements ---
const views = {
    welcome: document.getElementById('welcome-screen'),
    tour: document.getElementById('tour-screen'),
};
const toursList = document.getElementById('tours-list');
const userDot = document.getElementById('user-dot');
const artTray = document.getElementById('art-tray');
const trayContent = document.getElementById('tray-content');
const detailModal = document.getElementById('detail-modal');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/tours'); // Use relative path only
        const tours = await response.json();
        renderTours(tours);
        await fetchTours(); // Fetch tours before displaying
        displayTours();
        startWatchingLocation(); // Start watching location after tours are loaded
    } catch (error) {
        document.getElementById('tours-list').innerHTML = '<p>Could not load tours.</p>';
    }
});

function renderTours(tours) {
    const toursList = document.getElementById('tours-list');
    toursList.innerHTML = '';
    tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card';
        card.innerHTML = `
            <h2>${tour.title}</h2>
            <p>${tour.description}</p>
            <button onclick="startTour('${tour.id}')">Start Tour &gt;</button>
        `;
        toursList.appendChild(card);
    });
}

// --- View Management ---
function showView(viewName) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[viewName].classList.add('active');
}

// --- Data Fetching ---
async function fetchTours() {
    try {
        // Use relative path for Vercel serverless function
        const response = await fetch('/api/tours');
        if (!response.ok) throw new Error('Network response was not ok');
        state.tours = await response.json();
    } catch (error) {
        console.error("Failed to fetch tours:", error);
        toursList.innerHTML = "<p>Could not load tours. Is the backend serverless function deployed?</p>";
    }
}

// --- Welcome Screen Logic ---
function displayTours() {
    toursList.innerHTML = '';
    state.tours.forEach(tour => {
        const card = document.createElement('div');
        card.className = 'tour-card';
        
        let networkWarning = '';
        // NETWORK INFORMATION API USAGE
        if (navigator.connection && (navigator.connection.saveData || ['slow-2g', '2g'].includes(navigator.connection.effectiveType))) {
            networkWarning = `<span class="network-warning">Slow network detected. Download may be slow.</span>`;
        }

        card.innerHTML = `
            <h2>${tour.title}</h2>
            <p>${tour.description}</p>
            ${networkWarning}
            <button onclick="startTour('${tour.id}')">Start Tour</button>
        `;
        toursList.appendChild(card);
    });
}

// --- Tour Logic ---
function startTour(tourId) {
    console.log('Start Tour clicked:', tourId); // Debug log
    state.currentTour = state.tours.find(t => t.id === tourId);
    if (!state.currentTour) {
        console.warn('Tour not found:', tourId);
        return;
    }

    // Hide welcome, show tour screen
    document.getElementById('welcome-screen').classList.remove('active');
    document.getElementById('tour-screen').classList.add('active');

    setupMap();
    showView('tour');
}

// Assign to window immediately after definition
window.startTour = startTour;

function setupMap() {
    // Use Leaflet.js instead of Google Maps
    const mapContainer = document.querySelector('.map-container');
    mapContainer.innerHTML = '<div id="leaflet-map" style="width:100%;height:100%;"></div>';

    // Center map on first artwork or default location
    const center = state.currentTour.artworks.length
        ? [state.currentTour.artworks[0].lat, state.currentTour.artworks[0].lon]
        : [state.userLocation.lat, state.userLocation.lon];

    renderLeafletMap(center);
}

let leafletMap = null;
let userMarker = null;
let artworkMarkers = [];

function renderLeafletMap(center) {
    // Remove previous map if exists
    if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
        artworkMarkers = [];
        userMarker = null;
    }

    leafletMap = L.map('leaflet-map').setView(center, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    // User marker
    userMarker = L.marker([state.userLocation.lat, state.userLocation.lon], {
        icon: L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        })
    }).addTo(leafletMap).bindPopup("You are here");

    // Artwork pins
    state.currentTour.artworks.forEach((art, index) => {
        const marker = L.marker([art.lat, art.lon], {
            icon: L.divIcon({
                className: 'artwork-pin',
                html: `<div style="background:#6a11cb;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;">${index + 1}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            })
        }).addTo(leafletMap)
        .on('click', () => {
            triggerArtwork(art);
            showDetailModal();
        });
        artworkMarkers.push(marker);
    });
}

// Update user marker position on map when location changes
function updateUserDotPosition() {
    if (userMarker && leafletMap) {
        userMarker.setLatLng([state.userLocation.lat, state.userLocation.lon]);
        leafletMap.panTo([state.userLocation.lat, state.userLocation.lon]);
    }
}

// --- Geolocation API ---
function startWatchingLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    // GEOLOCATION API USAGE
    state.locationWatcher = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        options
    );
}

function handleLocationUpdate(position) {
    // Use real GPS data
    // state.userLocation.lat = 37.7749;
    // state.userLocation.lon =  -122.4194;
    state.userLocation.lat = position.coords.latitude;
    state.userLocation.lon = position.coords.longitude;

    console.log(`Location Updated: Lat: ${state.userLocation.lat}, Lon: ${state.userLocation.lon}`);
    updateUserDotPosition();
    checkProximityToArtworks();
}

function handleLocationError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

function updateUserDotPosition() {
    // Normalize user location to map area
    userDot.style.left = `${normalizeLon(state.userLocation.lon)}%`;
    userDot.style.top = `${normalizeLat(state.userLocation.lat)}%`;
}

// --- Proximity & Interaction Logic ---
function checkProximityToArtworks() {
    if (!state.currentTour) return;

    let closestArt = null;
    let minDistance = Infinity;

    state.currentTour.artworks.forEach(art => {
        const distance = getDistanceMeters(
            state.userLocation.lat,
            state.userLocation.lon,
            art.lat,
            art.lon
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestArt = art;
        }
    });

    // TRIGGER THRESHOLD (meters)
    const triggerDistance = 30;

    if (closestArt && minDistance < triggerDistance) {
        if (state.currentArtwork?.id !== closestArt.id) {
            triggerArtwork(closestArt);
            // If it's the first artwork, show detail modal automatically
            if (closestArt.id === state.currentTour.artworks[0].id) {
                showDetailModal();
            }
        }
    }
}

function triggerArtwork(artwork) {
    state.currentArtwork = artwork;

    // Highlight the pin
    document.querySelectorAll('.artwork-pin').forEach(p => p.classList.remove('active'));
    // Remove this line if using Leaflet markers only:
    // document.getElementById(`pin-${artwork.id}`).classList.add('active');

    // Fix image path for frontend
    let imgSrc = artwork.image;
    if (imgSrc.startsWith('/assets/')) {
        imgSrc = 'assets/' + imgSrc.split('/assets/')[1];
    }

    // Populate and show the tray
    trayContent.innerHTML = `
        <div class="triggered-card" onclick="showDetailModal()">
            <img src="${imgSrc}" alt="${artwork.title}">
            <h3>${artwork.title}</h3>
            <p>${artwork.artist}</p>
        </div>
    `;
    // Automatically expand the tray to 40% of the screen
    artTray.classList.remove('tray-collapsed');
    artTray.classList.add('tray-expanded');
    artTray.style.height = '40vh';
    document.getElementById('tray-arrow').style.transform = 'rotate(180deg)';
}

function clearTriggeredArtwork() {
    state.currentArtwork = null;
    document.querySelectorAll('.artwork-pin').forEach(p => p.classList.remove('active'));
    artTray.classList.add('tray-collapsed');
    artTray.classList.remove('tray-expanded');
    artTray.style.height = ''; // Reset to default
    trayContent.innerHTML = '';
}

function toggleTray() {
    artTray.classList.toggle('tray-expanded');
    artTray.classList.toggle('tray-collapsed');
    if (artTray.classList.contains('tray-expanded')) {
        artTray.style.height = '40vh';
        document.getElementById('tray-arrow').style.transform = 'rotate(180deg)';
    } else {
        artTray.style.height = '';
        document.getElementById('tray-arrow').style.transform = 'rotate(0deg)';
    }
}

// --- Detail Modal ---
function showDetailModal() {
    if (!state.currentArtwork) return;
    const art = state.currentArtwork;
    let imgSrc = art.image;
    if (imgSrc.startsWith('/assets/')) {
        imgSrc = 'assets/' + imgSrc.split('/assets/')[1];
    }
    document.getElementById('detail-img').src = imgSrc;
    document.getElementById('detail-title').textContent = art.title;
    document.getElementById('detail-artist').textContent = `${art.artist} (${art.year})`;
    document.getElementById('detail-story').textContent = art.story;
    detailModal.className = 'modal-visible';
}

function closeDetailModal() {
    detailModal.className = 'modal-hidden';
}

// --- Utility Functions ---

// Haversine formula for distance (for real lat/lon)
// function getDistance(pos1, pos2) { ... }
// For this prototype, we use a simpler Euclidean distance on our fake map
function getDistance(user, art) {
    const pin = document.getElementById(`pin-${art.id}`);
    const pinX = parseFloat(pin.style.left);
    const pinY = parseFloat(pin.style.top);
    return Math.sqrt(Math.pow(user.lon - pinX, 2) + Math.pow(user.lat - pinY, 2));
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371000; // meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Call this function whenever the user's location updates
function checkProximityAndTrigger() {
    if (!state.userLocation || !state.currentTour) return;
    for (const art of state.currentTour.artworks) {
        const dist = getDistanceMeters(
            state.userLocation.lat,
            state.userLocation.lon,
            art.lat,
            art.lon
        );
        if (dist < 30) { // 30 meters threshold
            triggerArtwork(art);
            return;
        }
    }
    clearTriggeredArtwork();
}

// On page load, fetch tours and render
function normalizeLat(lat) {
    if (!state.currentTour || !state.currentTour.artworks.length) return 50;
    const lats = state.currentTour.artworks.map(a => a.lat);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    if (maxLat === minLat) return 50;
    // Map lat to 10% - 90% for display
    return ((lat - minLat) / (maxLat - minLat)) * 80 + 10;
}

function normalizeLon(lon) {
    if (!state.currentTour || !state.currentTour.artworks.length) return 50;
    const lons = state.currentTour.artworks.map(a => a.lon);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    if (maxLon === minLon) return 50;
    // Map lon to 10% - 90% for display
    return ((lon - minLon) / (maxLon - minLon)) * 80 + 10;
}
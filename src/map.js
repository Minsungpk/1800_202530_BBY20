const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/019a5278-dbf9-77ba-8b85-d04e6ac21b57/style.json?key=tdthCswjV8GNYleNLj1C',
  center: [-123.0016, 49.2532],
  zoom: 13,
  pitch: 0,
  bearing: 0
});

// Enable rotation + pitch gestures
map.dragRotate.enable();
map.touchZoomRotate.enableRotation();

// Add navigation control with pitch indicator
map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
    showCompass: true,
    showZoom: true
  })
);

// Geolocate control
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
});
map.addControl(geolocate);
map.on('load', () => geolocate.trigger());

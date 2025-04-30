mapboxgl.accessToken = 'pk.eyJ1Ijoieml3ZWkwMjMiLCJhIjoiY204dnc5dXpoMTIwdTJrcTFvdG9xcWcycCJ9.gn8PHOvdBmJ6_U_O1zlvqA';

// Initialize Map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-74.0060, 40.7128], // New York City Coordinates
    zoom: 10
});


map.on('load', function () {
    map.addSource('stations_buffers', {
        type: 'geojson',
        data: './stations_buffer.geojson'
    });

    map.addSource('stations', {
        type: 'geojson',
        data: './stations_count.geojson'
    });

    map.addSource('restrooms', {
        type: 'geojson',
        data: './restrooms.geojson'
    });



    // Add station buffer points
    map.addLayer({
        id: 'station-buffers',
        type: 'fill',
        source: 'stations_buffers',
        paint: {
            'fill-color': '#f5f542',
            'fill-opacity': 0.2
        }
    });

    map.addLayer({
        id: 'station-points',
        type: 'circle',
        source: 'stations',
        paint: {
            'circle-radius': 2.5,
            'circle-color': '#FF0000'
        }
    });

    map.addLayer({
        id: 'restroom-points',
        type: 'circle',
        source: 'restrooms',
        paint: {
            'circle-radius': 2.5,
            'circle-color': '#00FF00'
        }
    });

    // Create a shared popup instance, hidden by default
    const hoverPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    // select filter checkbox inputs
    const inputs = document.querySelectorAll('#access-filter input[type="checkbox"]');

    // Hover popup for restrooms
    map.on('mouseenter', 'restroom-points', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const coords = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const html = `<strong>${props['Facility Name']}</strong><br>Accessibility: ${props['Accessibility']}`;
      hoverPopup.setLngLat(coords).setHTML(html).addTo(map);
    });
    map.on('mouseleave', 'restroom-points', () => {
      map.getCanvas().style.cursor = '';
      hoverPopup.remove();
    });

    // Hover popup for stations
    map.on('mouseenter', 'station-points', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const coords = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;
      const html = `<strong>${props['Stop Name']}</strong><br>ADA Access: ${props['ADA']}`;
      hoverPopup.setLngLat(coords).setHTML(html).addTo(map);
    });
    map.on('mouseleave', 'station-points', () => {
      map.getCanvas().style.cursor = '';
      hoverPopup.remove();
    });

    function updateRestroomFilter() {
        // figure out which boxes are checked
        const selected = Array.from(inputs)
            .filter(i => i.checked)
            .map(i => i.value);

        if (selected.length === 0) {
            // Hide the restroom layer entirely when nothing is selected
            map.setLayoutProperty('restroom-points', 'visibility', 'none');
            return;
        }
        // Otherwise, ensure the layer is visible
        map.setLayoutProperty('restroom-points', 'visibility', 'visible');

        // Always match filter for selected values
        const filterExpr = ['match', ['get', 'Accessibility'], selected, true, false];
        map.setFilter('restroom-points', filterExpr);

        // 5) once Mapbox is idle, let’s log how many rendered features survived
        map.once('idle', () => {
            const count = map.queryRenderedFeatures({ layers: ['restroom-points'] }).length;
            console.log(`Filter “[${selected.join(', ')}]” → ${count} restrooms visible`);
        });
    }

    inputs.forEach(i => i.addEventListener('change', updateRestroomFilter));

    // apply once at startup
    updateRestroomFilter();
    
})
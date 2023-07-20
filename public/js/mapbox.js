

export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoid2hpN2VzdHJpcGUiLCJhIjoiY2xqZTluNjQzMGJwMzNxbHNndmYyc3JhaiJ9._Ibo9TgH0zfJjhhNs9x5Mw';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/whi7estripe/cljedmzbj005f01pe6pdh5gi7',
    scrollZoom: false
    // center: [14.2681, 40.8518],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
    .setLngLat(loc.coordinates)
    .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);
    // Extend map bounds to include current location
    bounds.extend(loc.coordinates)
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};


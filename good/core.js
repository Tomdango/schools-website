function sanitisePostcode(postcode) {
  return postcode
    .toUpperCase()
    .replace(' ', '')
    .split('')
    .reduce((prev, val) => {
      var number = parseInt(val, 10);
      return Number.isInteger(number) ? [...prev, number] : [...prev, val];
    }, []);
}

const map = new OpenLayers.Map('mapdiv');
const vectorLayer = new OpenLayers.Layer.Vector('Vector Layer', {
  projection: 'EPSG:4326'
});
const selectMarkerControl = new OpenLayers.Control.SelectFeature(vectorLayer, {
  onSelect: onFeatureSelect,
  onUnselect: onFeatureUnselect
});
map.addControl(selectMarkerControl);
selectMarkerControl.activate();
map.addLayer(vectorLayer);

function onFeatureSelect(feature) {
  selectedFeature = feature;
  popup = new OpenLayers.Popup.FramedCloud(
    'tempId',
    feature.geometry.getBounds().getCenterLonLat(),
    null,
    selectedFeature.attributes.salutation +
      ' from Lat:' +
      selectedFeature.attributes.Lat +
      ' Lon:' +
      selectedFeature.attributes.Lon,
    null,
    true
  );
  feature.popup = popup;
  map.addPopup(popup);
}

function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}

function placeRandomMarker(lat, long) {
  const randomLat = lat + (Math.random() - 0.5) / 30;
  const randomLong = long + (Math.random() - 0.5) / 20;
  const markers = new OpenLayers.Layer.Markers('Treatment Centre');
  const lonLat = new OpenLayers.LonLat(randomLong, randomLat).transform(
    new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  markers.addMarker(new OpenLayers.Marker(lonLat));
  map.addLayer(markers);
}

function processPostcode(postcode) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://api.postcodes.io/postcodes/' + postcode);
  xhr.onload = function() {
    const response = JSON.parse(this.responseText);
    const data = response.result;
    const lat = data.latitude;
    const long = data.longitude;
    map.addLayer(new OpenLayers.Layer.OSM());
    const lonLat = new OpenLayers.LonLat(long, lat).transform(
      new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
      map.getProjectionObject() // to Spherical Mercator Projection
    );
    const zoom = 17;
    map.setCenter(lonLat, zoom);
    for (let i = 0; i < 50; i++) {
      placeRandomMarker(lat, long);
    }
  };
  xhr.send();
}

document
  .getElementById('postcode-form')
  .addEventListener('submit', function(event) {
    event.preventDefault();
    const postcodeValue = event.target[0].value;
    const isValid = validatePostcode(postcodeValue);
    if (isValid === true) {
      processPostcode(postcodeValue);
    }
  });

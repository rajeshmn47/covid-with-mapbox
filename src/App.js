
import './App.css';
import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import useSWR from 'swr';
import lookup from 'country-code-lookup';
import 'mapbox-gl/dist/mapbox-gl.css';


  mapboxgl.accessToken = 'pk.eyJ1IjoicmFqZXNobW40NyIsImEiOiJja3p5Y3BpYWswNGsyMm5wY25panAzYWp4In0.c9qSA5OqiBYo6sKGWHlxgw'
  
function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  const fetcher = (url) =>
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        data.map((point, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.coordinates.longitude,point.coordinates.latitude]
          },
          properties: {
            id: index, // unique identifier in this case the index
            country: point.country,
            province: point.province,
            cases: point.stats.confirmed,
            deaths: point.stats.deaths
          }
        }))
      );

  // Fetching our data with swr package
  const { data } = useSWR('https://corona.lmao.ninja/v2/jhucsse', fetcher);
console.log(data)
  useEffect(() => {
    if (data) {
      const map = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: 'mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k',
        center: [-98, 37], // initial geo location
        zoom: 3 // initial zoom
      });
      map.addControl(new mapboxgl.NavigationControl());

      // Add navigation control to center your map on your location
      map.addControl(
        new mapboxgl.GeolocateControl({
          fitBoundsOptions: { maxZoom: 6 }
        })
      );
      // Call this method when the map is loaded
      map.once('load', function () {
        // Add our SOURCE
        // with id "points"
        map.addSource('points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: data
          }
        });

        // Add our layer
        map.addLayer({
          id: 'circles',
          source: 'points', // this should be the id of the source
          type: 'circle',
          // paint properties
          paint: {
            'circle-opacity': 0.75,
            'circle-stroke-width': ['interpolate', ['linear'], ['get', 'cases'], 1, 1, max, 1.75],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'cases'],
              1,
              min,
              1000,
              8,
              average / 4,
              10,
              average / 2,
              14,
              average,
              18,
              max,
              50
            ],
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'cases'],
              min,
              '#ffffb2',
              max / 32,
              '#fed976',
              max / 16,
              '#feb24c',
              max / 8,
              '#fd8d3c',
              max / 4,
              '#fc4e2a',
              max / 2,
              '#e31a1c',
              max,
              '#b10026'
            ]
          }
          
        });
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });
        
        // Variable to hold the active country/province on hover
        let lastId;
        
        // Mouse move event
        map.on('mousemove', 'circles', (e) => {
          // Get the id from the properties
          const id = e.features[0].properties.id;
        
          // Only if the id are different we process the tooltip
          if (id !== lastId) {
            lastId = id;
        
            // Change the pointer type on move move
            map.getCanvas().style.cursor = 'pointer';
        
            const { cases, deaths, country, province } = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();
        
            // Get all data for the tooltip
            const countryISO = lookup.byCountry(country)?.iso2 || lookup.byInternet(country)?.iso2;
        
            const provinceHTML = province !== 'null' ? `<p>Province: <b>${province}</b></p>` : '';
        
            const mortalityRate = ((deaths / cases) * 100).toFixed(2);
        
            const countryFlagHTML = Boolean(countryISO)
              ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
              : '';
        
            const HTML = `<p>Country: <b>${country}</b></p>
                      ${provinceHTML}
                      <p>Cases: <b>${cases}</b></p>
                      <p>Deaths: <b>${deaths}</b></p>
                      <p>Mortality Rate: <b>${mortalityRate}%</b></p>
                      ${countryFlagHTML}`;
        
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
        
            popup.setLngLat(coordinates).setHTML(HTML).addTo(map);
          }
        });
        
        // Mouse leave event
        map.on('mouseleave', 'circles', function () {
          // Reset the last Id
          lastId = undefined;
          map.getCanvas().style.cursor = '';
          popup.remove();
        })
      });
    }
  }, [data]);

  

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Assigned Mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
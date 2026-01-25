"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData } from "../components/eventCreation/types";
import styles from "../styles/Home.module.css";

interface MapboxMapWithSearchProps {
  width?: string;
  height?: string;
  zoom?: number;
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  place_type: string[];
}

const MapboxMapWithSearch: React.FC<MapboxMapWithSearchProps> = ({
  width = "100%",
  height = "400px",
  zoom = 14,
  eventData,
  setEventData,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [lng, setLng] = useState(85.31184012689732);
  const [lat, setLat] = useState(27.672932021393862);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateMapLocation = (newLng: number, newLat: number) => {
    setLng(newLng);
    setLat(newLat);

    // Update marker position
    marker.current?.setLngLat([newLng, newLat]);

    // Update map center
    map.current?.flyTo({ center: [newLng, newLat], zoom });

    // Update circles
    if (map.current?.getSource("circles")) {
      (map.current.getSource("circles") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { radius: 1000, color: "green" },
            geometry: {
              type: "Point",
              coordinates: [newLng, newLat],
            },
          },
          {
            type: "Feature",
            properties: { radius: 2500, color: "red" },
            geometry: {
              type: "Point",
              coordinates: [newLng, newLat],
            },
          },
        ],
      });
    }
  };

  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!accessToken) {
      console.error("Mapbox token is missing");
      return;
    }
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query,
    )}.json?access_token=${accessToken}&autocomplete=true&limit=5`;

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setEventData({ ...eventData, eventLocation: value });
    searchAddress(value);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const [newLng, newLat] = suggestion.center;
    setSearchValue(suggestion.place_name);
    setEventData({ ...eventData, eventLocation: suggestion.place_name });
    setShowSuggestions(false);
    setSuggestions([]);
    updateMapLocation(newLng, newLat);
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get token from environment variable
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      console.error(
        "Mapbox token is missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file",
      );
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    marker.current = new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map.current);

    map.current.on("load", () => {
      if (!map.current) return;

      map.current.addSource("circles", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { radius: 1000, color: "green" },
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
            },
            {
              type: "Feature",
              properties: { radius: 2500, color: "red" },
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
            },
          ],
        },
      });

      map.current.addLayer({
        id: "circle-1000",
        type: "circle",
        source: "circles",
        filter: ["==", ["get", "radius"], 1000],
        paint: {
          "circle-radius": {
            stops: [
              [0, 0],
              [20, metersToPixelsAtMaxZoom(1000, lat)],
            ],
            base: 2,
          },
          "circle-color": "green",
          "circle-opacity": 0.3,
          "circle-stroke-width": 2,
          "circle-stroke-color": "green",
          "circle-stroke-opacity": 0.8,
        },
      });

      map.current.addLayer({
        id: "circle-2500",
        type: "circle",
        source: "circles",
        filter: ["==", ["get", "radius"], 2500],
        paint: {
          "circle-radius": {
            stops: [
              [0, 0],
              [20, metersToPixelsAtMaxZoom(2500, lat)],
            ],
            base: 2,
          },
          "circle-color": "red",
          "circle-opacity": 0.3,
          "circle-stroke-width": 2,
          "circle-stroke-color": "red",
          "circle-stroke-opacity": 0.8,
        },
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  function metersToPixelsAtMaxZoom(meters: number, latitude: number) {
    return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
  }

  return (
    <div className={styles.homeWrapper}>
      <div className={styles.sidebar}>
        <div className={styles.autocompleteWrapper}>
          <input
            className={styles.autocompleteInput}
            value={searchValue || eventData.eventLocation || ""}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Enter an address"
            name="eventLocation"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className={styles.suggestionWrapper}>
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <strong>{suggestion.text}</strong>{" "}
                  <small>
                    {suggestion.place_name.replace(suggestion.text + ", ", "")}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div
        ref={mapContainer}
        style={{ width, height }}
        className={styles.mapContainer}
      />
    </div>
  );
};

export default MapboxMapWithSearch;

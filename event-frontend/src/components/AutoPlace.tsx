"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData } from "../components/eventCreation/types";

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
  height = "340px",
  zoom = 14,
  eventData,
  setEventData,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [lng, setLng] = useState(3.3792); // Lagos default
  const [lat, setLat] = useState(6.5244);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const updateMapLocation = (newLng: number, newLat: number) => {
    setLng(newLng);
    setLat(newLat);
    marker.current?.setLngLat([newLng, newLat]);
    map.current?.flyTo({ center: [newLng, newLat], zoom, duration: 1200 });

    if (map.current?.getSource("circles")) {
      (map.current.getSource("circles") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { radius: 800 },
            geometry: { type: "Point", coordinates: [newLng, newLat] },
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
    if (!accessToken) return;

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${accessToken}&autocomplete=true&limit=5`,
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setEventData({ ...eventData, eventLocation: value });
    searchAddress(value);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    const [newLng, newLat] = s.center;
    setSearchValue(s.place_name);
    setEventData({ ...eventData, eventLocation: s.place_name });
    setShowSuggestions(false);
    setSuggestions([]);
    updateMapLocation(newLng, newLat);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11", // ← dark map to match theme
      center: [lng, lat],
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Custom emerald marker
    const el = document.createElement("div");
    el.style.cssText = `
      width: 22px; height: 22px; border-radius: 50%;
      background: #35D07F;
      border: 3px solid #020617;
      box-shadow: 0 0 0 3px rgba(53,208,127,0.35), 0 4px 16px rgba(53,208,127,0.4);
    `;
    marker.current = new mapboxgl.Marker({ element: el })
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
              properties: { radius: 800 },
              geometry: { type: "Point", coordinates: [lng, lat] },
            },
          ],
        },
      });
      map.current.addLayer({
        id: "ec-radius",
        type: "circle",
        source: "circles",
        paint: {
          "circle-radius": {
            stops: [
              [0, 0],
              [20, metersToPixels(800, lat)],
            ],
            base: 2,
          },
          "circle-color": "#35D07F",
          "circle-opacity": 0.08,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#35D07F",
          "circle-stroke-opacity": 0.35,
        },
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  function metersToPixels(meters: number, latitude: number) {
    return meters / 0.075 / Math.cos((latitude * Math.PI) / 180);
  }

  return (
    <div className="ec-map-wrap">
      <style>{`
        .ec-map-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* ── Search input ── */
        .ec-map-search {
          position: relative;
          width: 100%;
        }

        .ec-map-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ec-map-pin-icon {
          position: absolute;
          left: 13px;
          width: 16px; height: 16px;
          stroke: rgba(53, 208, 127, 0.6);
          fill: none;
          pointer-events: none;
          flex-shrink: 0;
        }

        .ec-map-input {
          width: 100%;
          padding: 11px 14px 11px 38px !important;
          background: #132035 !important;
          border: 1px solid rgba(53, 208, 127, 0.13) !important;
          border-radius: 12px !important;
          font-family: var(--ec-font-body, 'DM Sans', sans-serif) !important;
          font-size: 14px !important;
          color: #F8FAFC !important;
          outline: none !important;
          transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
        }
        .ec-map-input::placeholder { color: rgba(248, 250, 252, 0.25) !important; }
        .ec-map-input:focus {
          border-color: rgba(53, 208, 127, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(53, 208, 127, 0.09) !important;
          background: #192840 !important;
        }

        /* ── Suggestions dropdown ── */
        .ec-map-suggestions {
          position: absolute;
          top: calc(100% + 6px);
          left: 0; right: 0;
          background: #1A2B44;
          border: 1px solid rgba(53, 208, 127, 0.18);
          border-radius: 12px;
          overflow: hidden;
          z-index: 50;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          animation: ec-dropdown 0.15s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes ec-dropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ec-map-suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 14px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(248, 250, 252, 0.05);
        }
        .ec-map-suggestion-item:last-child { border-bottom: none; }
        .ec-map-suggestion-item:hover { background: rgba(53, 208, 127, 0.07); }

        .ec-map-sug-icon {
          width: 14px; height: 14px;
          stroke: rgba(34, 211, 238, 0.7);
          fill: none;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .ec-map-sug-main {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 13px; font-weight: 500;
          color: #F8FAFC;
          line-height: 1.3;
        }
        .ec-map-sug-sub {
          font-size: 11px;
          color: rgba(248, 250, 252, 0.40);
          margin-top: 1px;
        }

        /* ── Map container ── */
        .ec-map-container {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(53, 208, 127, 0.13);
          box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        }

        /* Mapbox nav controls — dark override */
        .ec-map-container .mapboxgl-ctrl-group {
          background: #0C1A2E !important;
          border: 1px solid rgba(53,208,127,0.15) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
        .ec-map-container .mapboxgl-ctrl-group button {
          background: transparent !important;
          color: rgba(248,250,252,0.6) !important;
          border-bottom: 1px solid rgba(53,208,127,0.1) !important;
        }
        .ec-map-container .mapboxgl-ctrl-group button:last-child { border-bottom: none !important; }
        .ec-map-container .mapboxgl-ctrl-group button:hover { background: rgba(53,208,127,0.08) !important; }
        .ec-map-container .mapboxgl-ctrl-icon { filter: invert(0.7) sepia(0.5) saturate(2) hue-rotate(100deg); }
      `}</style>

      {/* Search */}
      <div className="ec-map-search">
        <div className="ec-map-input-wrap">
          <svg className="ec-map-pin-icon" viewBox="0 0 24 24" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <input
            className="ec-map-input"
            value={searchValue || eventData.eventLocation || ""}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              suggestions.length > 0 && setShowSuggestions(true);
            }}
            onBlur={() =>
              setTimeout(() => {
                setShowSuggestions(false);
                setIsFocused(false);
              }, 150)
            }
            placeholder="Search for a venue or address…"
            name="eventLocation"
            autoComplete="off"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="ec-map-suggestions">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="ec-map-suggestion-item"
                onMouseDown={() => handleSuggestionClick(s)}
              >
                <svg
                  className="ec-map-sug-icon"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <div className="ec-map-sug-main">{s.text}</div>
                  <div className="ec-map-sug-sub">
                    {s.place_name.replace(s.text + ", ", "")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="ec-map-container">
        <div ref={mapContainer} style={{ width, height }} />
      </div>
    </div>
  );
};

export default MapboxMapWithSearch;

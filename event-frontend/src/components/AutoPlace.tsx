import {
  useLoadScript,
  GoogleMap,
  MarkerF,
  CircleF,
} from "@react-google-maps/api";
import { useMemo, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { EventData } from "../components/eventCreation/types";
import styles from "../styles/Home.module.css";

interface GoogleMapWithSearchProps {
  width?: string;
  height?: string;
  zoom?: number;
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

const GoogleMapWithSearch: React.FC<GoogleMapWithSearchProps> = ({
  width = "100%",
  height = "800px",
  zoom = 14,
  eventData,
  setEventData,
}) => {
  const [lat, setLat] = useState(27.672932021393862);
  const [lng, setLng] = useState(85.31184012689732);

  const libraries = useMemo(() => ["places"], []);
  const mapCenter = useMemo(() => ({ lat, lng }), [lat, lng]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: true,
      scrollwheel: false,
    }),
    []
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string,
    libraries: libraries as any,
  });

  if (!isLoaded) return <p>Loading...</p>;

  return (
    <div className={styles.homeWrapper}>
      <div className={styles.sidebar}>
        <PlacesAutocomplete
          eventData={eventData}
          setEventData={setEventData}
          onAddressSelect={(address) => {
            getGeocode({ address }).then((results) => {
              const { lat, lng } = getLatLng(results[0]);
              setLat(lat);
              setLng(lng);
              setEventData({ ...eventData, eventLocation: address });
            });
          }}
        />
      </div>

      <GoogleMap
        options={mapOptions}
        zoom={zoom}
        center={mapCenter}
        mapTypeId={google.maps.MapTypeId.ROADMAP}
        mapContainerStyle={{ width, height }}
      >
        {/* Marker */}
        <MarkerF position={mapCenter} />

        {/* Circles */}
        {[1000, 2500].map((radius, idx) => (
          <CircleF
            key={idx}
            center={mapCenter}
            radius={radius}
            options={{
              fillColor: radius > 1000 ? "red" : "green",
              strokeColor: radius > 1000 ? "red" : "green",
              strokeOpacity: 0.8,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

interface PlacesAutocompleteProps {
  onAddressSelect?: (address: string) => void;
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onAddressSelect,
  eventData,
  setEventData,
}) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    cache: 86400,
  });

  const renderSuggestions = () =>
    data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
        description,
      } = suggestion;

      return (
        <li
          key={place_id}
          onClick={() => {
            setValue(description, false);
            clearSuggestions();
            onAddressSelect?.(description);
          }}
        >
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });

  return (
    <div className={styles.autocompleteWrapper}>
      <input
        className={styles.autocompleteInput}
        disabled={!ready}
        value={eventData.eventLocation || value}
        onChange={(e) => {
          setValue(e.target.value);
          setEventData({ ...eventData, eventLocation: e.target.value });
        }}
        placeholder="Enter an address"
        name="eventLocation"
      />

      {status === "OK" && (
        <ul className={styles.suggestionWrapper}>{renderSuggestions()}</ul>
      )}
    </div>
  );
};

export default GoogleMapWithSearch;

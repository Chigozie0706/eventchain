import "../styles/AutoCompleteInput.scss";
import { useState } from "react";
import getPlaces from "@/app/api/getAddress";

interface Address {
  streetAndNumber: string;
  place: string;
  region: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Suggestion {
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  context: Array<{
    id: string;
    text: string;
  }>;
}

interface AutoCompleteInputProps {
  handleManualInputChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => void;
  setAddress: (address: Address) => void;
  streetAndNumber: string;
}

export default function AutoCompleteInput({
  handleManualInputChange,
  setAddress,
  streetAndNumber,
}: AutoCompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleManualInputChange(event, "streetAndNumber");
    handleInputChange(event.target.value);
  };

  const handleInputChange = async (query: string) => {
    const suggestions = await getPlaces(query);
    setSuggestions(suggestions);
  };

  type AddressContextFields = Omit<
    Address,
    "streetAndNumber" | "latitude" | "longitude"
  >;

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const streetAndNumber = suggestion.place_name.split(",")[0];
    const latitude = suggestion.center[1];
    const longitude = suggestion.center[0];

    const address: Address = {
      streetAndNumber,
      place: "",
      region: "",
      postcode: "",
      country: "",
      latitude,
      longitude,
    };

    suggestion.context.forEach((element) => {
      const identifier = element.id.split(".")[0] as keyof AddressContextFields;
      if (identifier in address) {
        address[identifier] = element.text;
      }
    });

    console.log(address.longitude, address.latitude);

    setAddress(address);
    setSuggestions([]);
  };

  return (
    <div>
      <div className="autoCompleteInputContainer">
        <input
          id="address"
          type="text"
          placeholder="Address"
          value={streetAndNumber}
          onChange={handleChange}
        />
        <ul className="addressSuggestions">
          {suggestions?.map((suggestion, index) => (
            <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

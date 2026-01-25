"use client";

import GoogleMapWithSearch from "@/components/AutoPlace";
import { EventData } from "../types";
import { FormInput } from "@/components/FormInput";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function Location({ eventData, setEventData }: Props) {
  return (
    <>
      <FormInput label="Location" required>
        <GoogleMapWithSearch
          eventData={eventData}
          setEventData={setEventData}
        />
      </FormInput>
    </>
  );
}

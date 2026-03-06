"use client";

import MapboxMapWithSearch from "@/components/AutoPlace";
import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function Location({ eventData, setEventData }: Props) {
  return (
    <MapboxMapWithSearch eventData={eventData} setEventData={setEventData} />
  );
}

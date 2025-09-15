import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function Location({ eventData, setEventData }: Props) {
  return (
    <div>
      <label>Event Title *</label>
      <input
        type="text"
        name="eventName"
        value={eventData.eventName}
        onChange={(e) =>
          setEventData({ ...eventData, eventName: e.target.value })
        }
        className="border p-2 w-full mb-4"
      />

      <label>Event Image *</label>
    </div>
  );
}

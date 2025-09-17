import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function Location({ eventData, setEventData }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 font-medium mb-2 text-sm">
        Location *
      </label>
      <input
        type="text"
        name="eventLocation"
        value={eventData.eventLocation}
        onChange={(e) =>
          setEventData({ ...eventData, eventLocation: e.target.value })
        }
        placeholder="Enter event location"
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
      />
    </div>
  );
}

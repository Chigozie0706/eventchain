import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function DateTime({ eventData, setEventData }: Props) {
  return (
    <div>
      {/* Start Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Start Date *
        </label>
        <input
          type="date"
          name="startDate"
          value={eventData.startDate}
          onChange={(e) =>
            setEventData({ ...eventData, startDate: e.target.value })
          }
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* End Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          End Date *
        </label>
        <input
          type="date"
          name="endDate"
          value={eventData.endDate}
          onChange={(e) =>
            setEventData({ ...eventData, endDate: e.target.value })
          }
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Start & End Time */}

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Start Time *
        </label>
        <input
          type="time"
          name="startTime"
          value={eventData.startTime}
          onChange={(e) =>
            setEventData({ ...eventData, startTime: e.target.value })
          }
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          End Time *
        </label>
        <input
          type="time"
          name="endTime"
          value={eventData.endTime}
          onChange={(e) =>
            setEventData({ ...eventData, endTime: e.target.value })
          }
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>
    </div>
  );
}

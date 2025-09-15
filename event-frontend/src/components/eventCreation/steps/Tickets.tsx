import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function Tickets({ eventData, setEventData }: Props) {
  return (
    <div>
      <label className="block mb-1">Ticket Price *</label>
      <input
        type="number"
        value={eventData.eventPrice}
        onChange={(e) =>
          setEventData({ ...eventData, eventPrice: e.target.value })
        }
        className="border p-2 w-full mb-4"
      />

      <label className="block mb-1">Minimum Age</label>
      <input
        type="number"
        value={eventData.minimumAge}
        onChange={(e) =>
          setEventData({ ...eventData, minimumAge: e.target.value })
        }
        className="border p-2 w-full mb-4"
      />

      <label className="block mb-1">Payment Token *</label>
      <select
        value={eventData.paymentToken}
        onChange={(e) =>
          setEventData({ ...eventData, paymentToken: e.target.value })
        }
        className="border p-2 w-full mb-4"
      >
        <option value="">-- Select Token --</option>
        <option value="cUSD">cUSD</option>
        <option value="CELO">CELO</option>
        <option value="USDT">USDT</option>
      </select>
    </div>
  );
}

import { EventData } from "../types";

export type Token = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
  handleTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tokenOptions: Token[];
}

export default function Tickets({
  eventData,
  setEventData,
  handleTokenChange,
  tokenOptions,
}: Props) {
  return (
    <>
      {/* Minimum Age */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Minimum Age Requirement *
        </label>
        <input
          type="number"
          name="minimumAge"
          value={eventData.minimumAge}
          onChange={(e) =>
            setEventData({ ...eventData, minimumAge: e.target.value })
          }
          placeholder="Enter minimum age (0 for no restriction)"
          min="0"
          max="120"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Select Payment Token */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Payment Token (cUSD, cEUR, cREAL, USDT)*
        </label>
        <select
          name="paymentToken"
          value={eventData.paymentToken}
          onChange={handleTokenChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        >
          <option value="" disabled>
            Select a payment token
          </option>
          {tokenOptions.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Event Price */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Ticket Price *
        </label>
        <input
          type="number"
          name="eventPrice"
          value={eventData.eventPrice}
          onChange={(e) =>
            setEventData({ ...eventData, eventPrice: e.target.value })
          }
          placeholder="Enter ticket price"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>
    </>
  );
}

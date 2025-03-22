import { Trash2 } from "lucide-react";

interface CreatorEventCardProps {
  event: {
    index: number;
    owner: string;
    eventName: string;
    eventCardImgUrl: string;
    eventDetails: string;
    eventDate: number;
    startTime: number;
    endTime: number;
    eventLocation: string;
    isActive: string;
    ticketPrice: number;
    paymentToken: string;
  };
  onDelete: (eventId: number) => void;
  loading: boolean;
}

const mentoTokens: Record<string, string> = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cCOP",
};

// Find the token name using the event's paymentToken address
// const tokenName = mentoTokens[event.paymentToken] || event.paymentToken;

const CreatorEventCard: React.FC<CreatorEventCardProps> = ({
  event,
  onDelete,
  loading,
}) => {
  return (
    <div className="relative flex flex-col w-full max-w-sm p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      {/* Delete Button (Top Left) */}
      <button
        onClick={() => onDelete(event.index)}
        disabled={loading}
        className="absolute top-3 left-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
      >
        <Trash2 size={16} />
      </button>

      {/* Event Image */}
      <div className="w-full">
        <img
          src={event.eventCardImgUrl || "/default-event.jpg"}
          alt={event.eventName}
          className="w-full h-36 rounded-lg object-cover"
        />
      </div>

      {/* Event Details */}
      <div className="mt-3 flex flex-col text-center">
        <h2 className="text-lg font-semibold">{event.eventName}</h2>
        <p className="text-sm text-gray-500">
          {new Date(event.eventDate * 1000).toLocaleDateString()} <br />
          {new Date(event.startTime * 1000).toLocaleTimeString()}
        </p>
        <p className="text-sm text-gray-500">{event.eventLocation}</p>
        <p className="text-sm font-medium mt-2">
          {(event.ticketPrice / 1e18).toFixed(2)}{" "}
          {mentoTokens[event.paymentToken] || event.paymentToken}
        </p>
      </div>
    </div>
  );
};

export default CreatorEventCard;

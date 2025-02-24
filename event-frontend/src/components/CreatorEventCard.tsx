import { Trash2 } from "lucide-react";
import Image from "next/image";

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
  };
  onDelete: (eventId: number) => void;
  loading: boolean;
}

const CreatorEventCard: React.FC<CreatorEventCardProps> = ({
  event,
  onDelete,
  loading,
}) => {
  return (
    <div className="relative flex w-full max-w-lg p-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      {/* Delete Button (Top Left) */}
      <button
        onClick={() => onDelete(event.index)}
        disabled={loading}
        className="absolute top-3 left-3 bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
      >
        <Trash2 size={16} />
      </button>

      {/* Event Image */}
      <div className="w-1/3">
        <img
          src={event.eventCardImgUrl || "/default-event.jpg"}
          alt={event.eventName}
          width={150}
          height={100}
          className="rounded-lg object-cover"
        />
      </div>

      {/* Event Details */}
      <div className="ml-4 flex flex-col justify-between w-2/3">
        <h2 className="text-lg font-semibold">{event.eventName}</h2>

        <p className="text-sm text-gray-500">
          {new Date(event.eventDate * 1000).toLocaleDateString()}
          {new Date(event.startTime * 1000).toLocaleTimeString()}
        </p>
        <p className="text-sm text-gray-500 mb-2">{event.eventLocation}</p>
        <p className="text-sm ">{(event.ticketPrice / 1e18).toFixed(2)} cUSD</p>
      </div>
    </div>
  );
};

export default CreatorEventCard;

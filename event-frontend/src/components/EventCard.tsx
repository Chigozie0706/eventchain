import Image from "next/image";
import Link from "next/link";

interface Event {
  index: number;
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  eventDate: number; // uint64 maps to `number` in TypeScript
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
}

export default function EventCard({ event }: { event: Event }) {
  const formattedDate = new Date(event.eventDate * 1000).toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const shortAddress = `${event.owner.slice(0, 6)}...${event.owner.slice(-4)}`;

  return (
    <div className="max-w-xs rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-200  my-5">
      <img
        src={event.eventCardImgUrl}
        width={500}
        height={300}
        alt="Event Banner"
      />

      <div className="p-4">
        <span className="bg-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-full w-50">
          {shortAddress}
        </span>
        <h2 className="text-sm font-semibold mt-2">{event.eventName}</h2>
        <p className="text-gray-600 text-xs mt-1">
          <span className="font-semibold">Date:</span> {formattedDate}
        </p>
        {/* <p className="text-gray-500 text-xs mt-1">*Online Only*</p> */}
        <p className=" text-orange-600 text-sm font-semibold mt-5 ">
          <Link href={`/view_event_details/${event.index}`}>View Details</Link>
        </p>
      </div>
    </div>
  );
}

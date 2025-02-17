import Image from "next/image";

// interfaces.ts
export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  eventDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  createdEvents: Event[];
}

export default function EventPage({
  event,
  attendees,
  createdEvents,
}: EventPageProps) {
  return (
    <div className="container m-auto">
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>

        {/* Banner Image */}
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={event.eventCardImgUrl}
            alt="Event Banner"
            width={1200} // Adjust as needed
            height={500} // Adjust as needed
            // layout="responsive"
            className="rounded-2xl"
          />
        </div>
      </div>

      <div className="max-w-4xl p-6">
        <h2 className="text-4xl font-bold text-gray-900">{event.eventName}</h2>
        <p className="text-gray-600 mt-2">{event.eventDetails}</p>

        <div className="mt-6">
          <h3 className="text-xl font-semibold">Date and Time</h3>
          <p className="flex items-center space-x-2 text-gray-700">
            <span className="w-5 h-5 inline-block bg-gray-300 rounded-full"></span>
            <span>Saturday, April 5 · 10am - 7pm WAT</span>
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold">Location</h3>
          <p className="flex items-center space-x-2 text-gray-700">
            <span className="w-5 h-5 inline-block bg-gray-300 rounded-full"></span>
            <span>Lagos Continental Hotel</span>
          </p>
          <p className="text-gray-500">
            52a Kofo Abayomi Street, Lagos, LA 101241
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold">Refund Policy</h3>
          <p className="text-gray-700">
            Contact the organizer to request a refund.
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold">About this event</h3>
          <p className="text-gray-700">Event lasts 9 hours</p>
        </div>

        <div className="mt-8 text-center">
          <button className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-semibold">
            Select Tickets
          </button>
        </div>
      </div>
    </div>
  );
}

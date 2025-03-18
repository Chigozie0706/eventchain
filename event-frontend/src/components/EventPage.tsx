"use client";
import AttendeeList from "./AttendeeList";

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
  ticketPrice: number;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  createdEvents: Event[];
  buyTicket: () => Promise<void>;
  requestRefund: () => Promise<void>;
  loading: boolean;
}

export default function EventPage({
  event,
  attendees,
  createdEvents,
  buyTicket,
  requestRefund,
  loading,
}: EventPageProps) {
  const formattedDate = new Date(event.eventDate * 1000).toLocaleDateString(
    undefined, // Uses the user's locale
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const formattedStartTime = new Date(
    event.startTime * 1000
  ).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const formattedEndTime = new Date(event.endTime * 1000).toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }
  );

  // return (
  //   <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
  //     {/* Banner Section */}
  //     <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
  //       {/* Background Blur Effect */}
  //       <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>

  //       {/* Banner Image */}
  //       <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
  //         <img
  //           src={event.eventCardImgUrl}
  //           alt="Event Banner"
  //           width={1200}
  //           height={500}
  //           className="rounded-2xl"
  //         />
  //       </div>
  //     </div>

  //     {/* Event Details Section */}
  //     <div className="flex flex-col md:flex-row md:justify-between md:space-x-8 mt-10">
  //       {/* Left Side (Event Info) */}
  //       <div className="max-w-4xl bg-white p-6 md:p-8">
  //         <h2 className="text-2xl font-bold text-gray-900">
  //           {event.eventName}
  //         </h2>
  //         <p className="text-gray-600 mt-2 text-sm">{event.eventDetails}</p>

  //         {/* Date and Time */}
  //         <div className="mt-6">
  //           <h3 className="text-xl font-semibold">Date and Time</h3>
  //           <p className="flex items-center space-x-2 text-gray-700">
  //             <span className="w-2 h-2 inline-block bg-gray-300 rounded-full"></span>
  //             <span className="text-sm">
  //               {formattedDate} · {formattedStartTime} - {formattedEndTime}
  //             </span>
  //           </p>
  //         </div>

  //         {/* Location */}
  //         <div className="mt-6">
  //           <h3 className="text-xl font-semibold">Location</h3>
  //           <p className="flex items-center space-x-2 text-gray-700">
  //             <span className="w-2 h-2 inline-block bg-gray-300 rounded-full"></span>
  //             <span className="text-sm">{event.eventLocation}</span>
  //           </p>
  //         </div>

  //         {/* Ticket Price */}
  //         <div className="mt-6">
  //           <h3 className="text-xl font-semibold">Ticket Price</h3>
  //           <p className="flex items-center space-x-2 text-gray-700">
  //             <span className="w-2 h-2 inline-block bg-gray-300 rounded-full"></span>
  //             <span className="text-sm">
  //               {(event.ticketPrice / 1e18).toFixed(2)} cUSD
  //             </span>
  //           </p>
  //         </div>

  //         {/* Refund Policy */}
  //         <div className="mt-6">
  //           <h3 className="text-xl font-semibold">Refund Policy</h3>
  //           <p className="text-gray-700 text-sm">
  //             Contact the organizer to request a refund.
  //           </p>
  //         </div>

  //         <div className="mt-6">
  //           <h3 className="text-xl font-semibold mb-4">AttendeeList </h3>
  //           <AttendeeList attendees={attendees} />
  //         </div>
  //       </div>

  //       {/* Right Side (Ticket Selection) */}
  //       <div className="p-6 md:p-8 w-full md:w-1/4">
  //         <div className="border p-4 rounded-lg flex justify-between items-center">
  //           <div>
  //             <p className="font-semibold text-sm mb-2">Reserve a spot</p>
  //             <p className="text-gray-500 text-sm">
  //               Price: {(event.ticketPrice / 1e18).toFixed(2)} cUSD
  //             </p>
  //           </div>
  //         </div>
  //         <button
  //           className="w-full bg-orange-700 text-white mt-4 py-2 rounded-lg text-sm font-semibold"
  //           onClick={buyTicket}
  //           disabled={loading}
  //         >
  //           {loading ? "Processing..." : "Register"}
  //         </button>

  //         <button
  //           onClick={requestRefund}
  //           className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
  //           disabled={loading}
  //         >
  //           {loading ? "Processing..." : "Request Refund"}
  //         </button>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Banner Section */}
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>

        {/* Banner Image */}
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={event.eventCardImgUrl}
            alt="Event Banner"
            width={1200}
            height={500}
            className="rounded-2xl"
          />
        </div>
      </div>

      {/* Event Details Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:space-x-8 mt-10">
        {/* Left Side */}
        <div className="max-w-4xl bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900">
            {event.eventName}
          </h2>
          <p className="text-gray-600 mt-3 text-base">{event.eventDetails}</p>

          {/* Date and Time */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">📅 Date & Time</h3>
            <p className="text-gray-700 text-base">
              {formattedDate} · {formattedStartTime} - {formattedEndTime}
            </p>
          </div>

          {/* Location */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">📍 Location</h3>
            <p className="text-gray-700 text-base">{event.eventLocation}</p>
          </div>

          {/* Ticket Price */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">💰 Ticket Price</h3>
            <p className="text-green-600 text-lg font-bold">
              {(event.ticketPrice / 1e18).toFixed(2)} cUSD
            </p>
          </div>

          {/* Refund Policy */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">🔄 Refund Policy</h3>
            <p className="text-gray-700 text-sm">
              Contact the organizer to request a refund.
            </p>
          </div>

          {/* Attendee List */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">👥 Attendees</h3>
            <AttendeeList attendees={attendees} />
          </div>
        </div>

        {/* Right Side (Ticket Selection) */}
        <div className="p-6 md:p-8 w-full md:w-1/3">
          <div className="border p-6 rounded-lg flex flex-col items-center bg-gray-100 shadow-md">
            <p className="font-semibold text-lg text-gray-900">
              Reserve a Spot
            </p>
            <p className="text-gray-600 text-base mt-2">
              Price:{" "}
              <span className="font-semibold">
                {(event.ticketPrice / 1e18).toFixed(2)} cUSD
              </span>
            </p>
          </div>

          <button
            className="w-full bg-orange-600 text-white mt-4 py-3 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
            onClick={buyTicket}
            disabled={loading}
          >
            {loading ? "Processing..." : "Register"}
          </button>

          <button
            onClick={requestRefund}
            className="w-full bg-red-500 text-white mt-4 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
            disabled={loading}
          >
            {loading ? "Processing..." : "Request Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

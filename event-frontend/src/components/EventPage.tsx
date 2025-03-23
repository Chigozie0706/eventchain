"use client";
import AttendeeList from "./AttendeeList";
import { MapPin } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Ticket } from "lucide-react";
import { Handshake } from "lucide-react";
import { UsersRound } from "lucide-react";
import { useContract } from "../context/ContractContext";

// interfaces.ts
export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: number;
  paymentToken: string;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  createdEvents: Event[];
  buyTicket: () => Promise<void>;
  requestRefund: () => Promise<void>;
  loading: boolean;
  registering: boolean;
  refunding: boolean;
}

export default function EventPage({
  event,
  attendees,
  createdEvents,
  buyTicket,
  requestRefund,
  loading,
  registering,
  refunding,
}: EventPageProps) {
  // const { mentoTokens } = useContract();
  const formattedStartDate = new Date(
    event.startDate * 1000
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedEndDate = new Date(event.endDate * 1000).toLocaleDateString(
    undefined,
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

  const mentoTokens: Record<string, string> = {
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
    "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
    "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
  };

  // Find the token name using the event's paymentToken address
  const tokenName = mentoTokens[event.paymentToken] || event.paymentToken;

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

        <div className="max-w-4xl bg-white p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {event.eventName}
          </h2>
          <p className="text-gray-600 mt-3 text-base">{event.eventDetails}</p>

          {/* Date and Time */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <span>Date & Time</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              {formattedStartDate} - {formattedEndDate}
            </p>

            <p className="text-gray-700 text-sm">
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>

          {/* Location */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span>Location</span>
            </h3>
            <p className="text-gray-700 text-sm">{event.eventLocation}</p>
          </div>

          {/* Ticket Price */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Ticket className="w-5 h-5 text-gray-600" />
              <span>Ticket Price</span>
            </h3>
            <p className="text-green-600 text-sm font-bold">
              {(event.ticketPrice / 1e18).toFixed(2)} {tokenName}
            </p>
          </div>

          {/* Attendee List */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-4 flex items-center space-x-2 text-gray-800">
              <UsersRound className="w-5 h-5 text-gray-600" />
              <span>Attendees</span>
            </h3>
            <AttendeeList attendees={attendees} />
          </div>

          {/* Refund Policy */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Handshake className="w-5 h-5 text-gray-600" />
              <span>Refund Policy</span>
            </h3>
            <p className="text-gray-700 text-sm text-justify">
              Refunds are available if the event is canceled or if requested at
              least 5 hours before the event starts, provided funds are still in
              escrow. Refunds are issued in the same token used for payment and
              processed automatically. No refunds are available once the event
              has started, if funds have been released to the organizer, or if
              the request is made too late.
              <br />
              To request a refund, use the "Request Refund" button on the event
              page. If you experience issues, contact the organizer.
            </p>
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
                {(event.ticketPrice / 1e18).toFixed(2)} {tokenName}
              </span>
            </p>
          </div>

          <button
            className="w-full bg-orange-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
            onClick={buyTicket}
            disabled={loading}
          >
            {registering ? "Processing..." : "Register"}
          </button>

          <button
            onClick={requestRefund}
            className="w-full bg-red-500 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
            disabled={loading}
          >
            {refunding ? "Processing..." : "Request Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}

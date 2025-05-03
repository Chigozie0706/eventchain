"use client";
import AttendeeList from "./AttendeeList";
import {
  MapPin,
  CalendarDays,
  Ticket,
  Handshake,
  UsersRound,
  Check,
  Wallet,
} from "lucide-react";
import { formatEventDate, formatEventTime, formatPrice } from "@/utils/format";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

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
  ticketPrice: bigint;
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
  isMiniPay: boolean;
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
  isMiniPay,
}: EventPageProps) {
  const { address, isConnected } = useAccount();
  const formattedStartDate = formatEventDate(event.startDate);
  const formattedEndDate = formatEventDate(event.endDate);
  const formattedStartTime = formatEventTime(Number(event.startTime));
  const formattedEndTime = formatEventTime(Number(event.endTime));

  const mentoTokens: Record<string, string> = {
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
    "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
    "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
  };

  const tokenName = mentoTokens[event.paymentToken] || event.paymentToken;
  const formattedPrice = formatPrice(event.ticketPrice);

  const isRegistered = address && attendees.includes(address);
  const showConnectMessage = !isConnected && !isMiniPay;
  const showMiniPayMessage = isMiniPay && !address;

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Banner Section */}
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={event.eventCardImgUrl}
            alt="Event Banner"
            width={1200}
            height={500}
            className="rounded-2xl object-cover w-full h-full"
          />
        </div>
      </div>

      {/* Event Details Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:space-x-8 mt-10">
        {/* Left Side */}
        <div className="max-w-4xl bg-white p-6 md:p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">
            {event.eventName}
          </h2>
          <p className="text-gray-600 mt-3 text-base">{event.eventDetails}</p>

          {/* Event Metadata */}
          <div className="mt-6 space-y-6">
            <div>
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

            <div>
              <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span>Location</span>
              </h3>
              <p className="text-gray-700 text-sm">{event.eventLocation}</p>
            </div>

            <div>
              <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
                <Ticket className="w-5 h-5 text-gray-600" />
                <span>Ticket Price</span>
              </h3>
              <p className="text-green-600 text-sm font-bold">
                {formattedPrice} {tokenName}
              </p>
            </div>

            <div>
              <h3 className="text-md font-semibold mb-4 flex items-center space-x-2 text-gray-800">
                <UsersRound className="w-5 h-5 text-gray-600" />
                <span>Attendees ({attendees.length})</span>
              </h3>
              <AttendeeList attendees={attendees} />
            </div>

            <div>
              <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
                <Handshake className="w-5 h-5 text-gray-600" />
                <span>Refund Policy</span>
              </h3>
              <p className="text-gray-700 text-sm text-justify">
                Refunds are available if the event is canceled or if requested
                at least 5 hours before the event starts, provided funds are
                still in escrow. Refunds are issued in the same token used for
                payment.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side (Ticket Actions) */}
        <div className="p-6 md:p-8 w-full md:w-1/3">
          <div className="border p-6 rounded-lg flex flex-col items-center bg-gray-50 shadow-sm">
            <p className="font-semibold text-lg text-gray-900">
              Reserve a Spot
            </p>
            <p className="text-gray-600 text-base mt-2">
              Price:{" "}
              <span className="font-semibold">
                {formattedPrice} {tokenName}
              </span>
            </p>
          </div>

          {/* MiniPay Status Indicator */}
          {isMiniPay && (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-md text-sm mb-4 mt-4 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>Using MiniPay for fast, low-cost transactions</span>
            </div>
          )}

          {/* Connection Status */}
          {showConnectMessage && (
            <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-3 rounded-md text-sm mb-4 mt-4">
              Connect your wallet to register for this event
            </div>
          )}

          {/* MiniPay Loading State */}
          {showMiniPayMessage && (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-md text-sm mb-4 mt-4">
              Loading MiniPay wallet...
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 mt-4">
            {isRegistered ? (
              <div className="w-full bg-green-600 text-white py-3 rounded-lg text-lg font-semibold flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Registered
              </div>
            ) : (
              <button
                className={`w-full ${
                  isMiniPay
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-orange-600 hover:bg-orange-700"
                } text-white py-3 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2`}
                onClick={buyTicket}
                disabled={loading || registering || !address}
              >
                {registering ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : isMiniPay ? (
                  "Pay with MiniPay"
                ) : (
                  "Register for Event"
                )}
              </button>
            )}
            {isRegistered && (
              <button
                onClick={requestRefund}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg text-lg font-semibold transition flex items-center justify-center gap-2"
                disabled={loading || refunding}
              >
                {refunding ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Request Refund"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

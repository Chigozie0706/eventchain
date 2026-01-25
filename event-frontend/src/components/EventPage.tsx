"use client";
import AttendeeList from "./AttendeeList";
import {
  MapPin,
  CalendarDays,
  Ticket,
  Handshake,
  UsersRound,
  Check,
  Info,
  Shield,
  Sparkles,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useAccount } from "wagmi";
import { useState } from "react";
import { formatUnits } from "viem";
import { getTokenByAddress } from "@/utils/tokens";

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
  fundsHeld: bigint;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
  paymentToken: string;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  buyTicket: () => void;
  requestRefund: () => void;
  loading: boolean;
  registering: boolean;
  refunding: boolean;
  id: string;
}

export default function EventPage({
  event,
  attendees,
  buyTicket,
  requestRefund,
  loading,
  registering,
  refunding,
  id,
}: EventPageProps) {
  const { address, isConnected } = useAccount();
  const [imgError, setImgError] = useState(false);
  const [showRefundDetails, setShowRefundDetails] = useState(false);

  // Format dates and times
  const formatEventDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formattedStartDate = formatEventDate(Number(event.startDate));
  const formattedEndDate = formatEventDate(Number(event.endDate));
  const formattedStartTime = formatEventTime(Number(event.startTime));
  const formattedEndTime = formatEventTime(Number(event.endTime));

  // Get token info and format price
  const tokenInfo = getTokenByAddress(event.paymentToken);
  const formattedPrice = formatUnits(
    event.ticketPrice,
    tokenInfo?.decimals || 18,
  );
  const tokenSymbol = tokenInfo?.symbol || "Unknown Token";

  // Get refund policy text
  const getRefundPolicyText = () => {
    switch (event.refundPolicy) {
      case 0:
        return "No refunds available for this event";
      case 1:
        return "Full refund available until event starts";
      case 2:
        return `Full refund available up to ${event.refundBufferHours} hours before event`;
      default:
        return "Refund policy not specified";
    }
  };

  const getImageUrl = () => {
    if (!event.eventCardImgUrl) return "/default-event.jpg";
    return event.eventCardImgUrl.startsWith("http")
      ? event.eventCardImgUrl
      : `https://ipfs.io/ipfs/${event.eventCardImgUrl}`;
  };

  const getLocationShort = (location: string) => {
    const parts = location.split(",");
    if (parts.length >= 2) {
      return parts.slice(-2).join(",").trim();
    }
    return location;
  };

  const isRegistered = address && attendees.includes(address);
  const requiresAgeVerification = event.minimumAge > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50">
      {/* Hero Banner - Responsive */}
      <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent z-10" />

        <div className="absolute inset-0">
          <img
            src={imgError ? "/default-event.jpg" : getImageUrl()}
            alt="Event Banner"
            className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[3000ms]"
            onError={() => setImgError(true)}
          />
        </div>

        <div className="relative z-20 container mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-8 sm:pb-12">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
              <span className="px-3 py-1.5 sm:px-4 bg-emerald-500/90 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold rounded-full flex items-center gap-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                {event.isActive ? "Active Event" : "Event Ended"}
              </span>
              <span className="px-3 py-1.5 sm:px-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs sm:text-sm font-semibold rounded-full">
                {attendees.length}/{Number(event.maxCapacity)} Spots
              </span>
              <span className="px-3 py-1.5 sm:px-4 bg-blue-500/90 backdrop-blur-sm text-white text-xs sm:text-sm font-semibold rounded-full">
                {tokenSymbol}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-2xl leading-tight">
              {event.eventName}
            </h1>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">
                  {formattedStartDate}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">
                  {getLocationShort(event.eventLocation)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">
                  {formattedPrice} {tokenSymbol}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Grid */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                {event.eventDetails}
              </p>
            </div>

            {/* Date & Time Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-emerald-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg">
                  <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Date & Time
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    Start
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {formattedStartDate}
                  </p>
                  <p className="text-emerald-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {formattedStartTime}
                  </p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    End
                  </p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">
                    {formattedEndDate}
                  </p>
                  <p className="text-emerald-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {formattedEndTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-rose-500 rounded-lg">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Location
              </h3>
              <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-4">
                {event.eventLocation}
              </p>
              <div className="rounded-xl overflow-hidden h-48 sm:h-56 md:h-64 border-2 border-gray-200">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    event.eventLocation,
                  )}&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  title="Event Location Map"
                />
              </div>
            </div>

            {/* Age Restriction Card */}
            {requiresAgeVerification && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-amber-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-500 rounded-lg">
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Age Restriction
                </h3>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base text-gray-700">
                      This event requires attendees to be{" "}
                      <span className="font-bold text-amber-700">
                        {event.minimumAge}+ years old
                      </span>
                      . Age verification may be required.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attendees Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-indigo-500 rounded-lg">
                  <UsersRound className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                Attendees ({attendees.length}/{Number(event.maxCapacity)})
              </h3>
              <AttendeeList
                attendees={attendees}
                maxCapacity={Number(event.maxCapacity)}
              />
            </div>

            {/* Refund Policy Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-blue-100">
              <button
                onClick={() => setShowRefundDetails(!showRefundDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                    <Handshake className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  Refund Policy
                </h3>
                <ChevronDown
                  className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 transition-transform duration-300 flex-shrink-0 ${
                    showRefundDetails ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  showRefundDetails ? "max-h-96 mt-4 sm:mt-6" : "max-h-0"
                }`}
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-lg">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                        {event.refundPolicy === 0
                          ? "No Refunds"
                          : "Refund Available"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-700">
                        {getRefundPolicyText()}
                      </p>
                    </div>
                  </div>
                  {event.refundPolicy !== 0 && (
                    <div className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-lg">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                          Automatic Processing
                        </p>
                        <p className="text-xs sm:text-sm text-gray-700">
                          Refunds are processed automatically and returned to
                          your wallet in {tokenSymbol}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Purchase - Sticky on Desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Ticket Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-5 sm:p-6 md:p-8 text-white">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold">
                      Get Your Ticket
                    </h3>
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>

                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <p className="text-white/80 text-xs sm:text-sm mb-2">
                      Price per ticket
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold break-all">
                      {formattedPrice} {tokenSymbol}
                    </p>
                  </div>

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/80">Available Spots</span>
                      <span className="font-bold">
                        {Number(event.maxCapacity) - attendees.length} /{" "}
                        {Number(event.maxCapacity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/80">Event Status</span>
                      <span className="font-bold flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse ${
                            event.isActive ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {event.isActive ? "Active" : "Ended"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/80">Payment Token</span>
                      <span className="font-bold">{tokenSymbol}</span>
                    </div>
                  </div>

                  {!isConnected ? (
                    <button className="w-full bg-white text-emerald-600 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Connect Wallet
                    </button>
                  ) : isRegistered ? (
                    <div className="space-y-3">
                      <div className="bg-white text-emerald-600 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-lg">
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                        You're Registered!
                      </div>
                      {event.refundPolicy !== 0 && (
                        <button
                          onClick={requestRefund}
                          disabled={loading || refunding}
                          className="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {refunding ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            "Request Refund"
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={buyTicket}
                      disabled={
                        loading ||
                        registering ||
                        !event.isActive ||
                        attendees.length >= Number(event.maxCapacity)
                      }
                      className="w-full bg-white text-emerald-600 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : attendees.length >= Number(event.maxCapacity) ? (
                        "Sold Out"
                      ) : !event.isActive ? (
                        "Event Inactive"
                      ) : (
                        "Complete Registration"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Info Cards */}
              {!requiresAgeVerification && (
                <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">
                        All Ages Welcome
                      </h4>
                      <p className="text-xs sm:text-sm text-blue-700">
                        This event has no minimum age requirement. Everyone is
                        welcome to attend!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-purple-900 mb-2">
                      Secure Blockchain Ticketing
                    </h4>
                    <p className="text-xs sm:text-sm text-purple-700">
                      Your ticket is secured on the blockchain with transparent
                      refund policies. Payments accepted in {tokenSymbol}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

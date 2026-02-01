"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import EventCard from "./EventCard";
import contractABI from "../contract/abi.json";
import { useReadContract } from "wagmi";

interface Event {
  index: number;
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
  fundsHeld: number;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
}

export default function HeroSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data, error, isLoading, isError, isSuccess } = useReadContract({
    abi: contractABI.abi,
    address: "0x1EdD444EA19c1F5240D771af3BeC58561934f5bC",
    functionName: "getAllEvents",
  });

  useEffect(() => {
    if (isSuccess && data) {
      const [indexes, activeEvents] = data as [bigint[], any[]];

      const formattedEvents: Event[] = activeEvents.map((event, idx) => ({
        index: Number(indexes[idx]),
        owner: event.owner,
        eventName: event.eventName,
        eventCardImgUrl: event.eventCardImgUrl,
        eventDetails: event.eventDetails,
        startDate: Number(event.startDate),
        endDate: Number(event.endDate),
        startTime: Number(event.startTime),
        endTime: Number(event.endTime),
        eventLocation: event.eventLocation,
        isActive: event.isActive,
        ticketPrice: Number(event.ticketPrice),
        fundsHeld: Number(event.fundsHeld),
        minimumAge: Number(event.minimumAge),
        maxCapacity: Number(event.maxCapacity),
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        exists: event.exists,
        refundPolicy: Number(event.refundPolicy),
        refundBufferHours: Number(event.refundBufferHours),
      }));

      setEvents(formattedEvents);
    }
  }, [isSuccess, data]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.eventName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <>
      {/* Hero Section with Enhanced Design */}
      <section className="relative w-full h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Animated Background Gradient Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 "></div>
          <img
            src="/images/banner.png"
            alt="Event background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Elements for Visual Interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl text-white space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">
              {events.length} Live Events Available
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-black sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            Discover Events That
            <span className="block bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Inspire You
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
            Experience unforgettable moments at concerts, workshops, and
            conferences powered by blockchain technology
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/create_event">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-lg font-bold hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                <span className="relative z-10 flex items-center gap-2">
                  Create an Event
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </span>
              </button>
            </Link>
            <Link href="/view_events">
              <button className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-xl text-lg font-bold hover:bg-white/20 transition-all duration-300 hover:scale-105">
                Explore All Events
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                {events.length}+
              </div>
              <div className="text-gray-600 mt-2 font-medium">
                Active Events
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text">
                1000+
              </div>
              <div className="text-gray-600 mt-2 font-medium">
                Happy Attendees
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-transparent bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text">
                24/7
              </div>
              <div className="text-gray-600 mt-2 font-medium">
                Blockchain Secured
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-transparent bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text">
                100%
              </div>
              <div className="text-gray-600 mt-2 font-medium">Transparent</div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Featured Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing experiences happening near you
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 rounded-xl">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-red-700 font-medium">
                  Failed to load events. Please try again.
                </p>
              </div>
            </div>
          )}

          {/* Events Grid */}
          {!isLoading && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <div
                    key={event.index}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <EventCard event={event} />
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <svg
                    className="w-24 h-24 mx-auto text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-xl font-medium">
                    No events found matching your search
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}

          {/* View All Button */}
          {filteredEvents.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/view_events">
                <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                  View All Events →
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
}

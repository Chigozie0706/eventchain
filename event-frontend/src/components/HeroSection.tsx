"use client";
import Link from "next/link";
import Home from "@/app/view_events/page";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { useContract } from "@/context/ContractContext";

export default function HeroSection() {
  const [events, setEvents] = useState([]);
  const [, setIndexes] = useState([]);
  const { contract, readOnlyContract } = useContract();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!readOnlyContract) {
          console.error(" readOnlyContract instance not found");
          return;
        }

        // Fetch all active events along with their indexes
        const rawData = await readOnlyContract.getAllEvents();
        console.log(" Raw Events Data:", rawData); // Debugging

        if (!rawData || rawData.length !== 2) {
          console.error(" Unexpected data format from readOnlyContract");
          return;
        }

        const [rawIndexes, rawEvents] = rawData; // Extract indexes and events

        // Convert to a structured format
        const formattedEvents = rawEvents.map(
          (event: any[], idx: string | number) => ({
            index: Number(rawIndexes[idx]), // Ensure index is stored
            owner: event[0],
            eventName: event[1],
            eventCardImgUrl: event[2],
            eventDetails: event[3],
            eventDate: Number(event[4]), // Convert BigInt to Number
            startTime: Number(event[5]), // Convert BigInt to Number
            endTime: Number(event[6]), // Convert BigInt to Number
            eventLocation: event[7],
            isActive: event[8],
          })
        );

        setIndexes(rawIndexes.map(Number)); // Store indexes separately
        setEvents(formattedEvents);
        console.log("✅ Formatted Events:", formattedEvents); // Debugging
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [readOnlyContract]);

  return (
    <>
      {/* <section>
        <div className="relative w-full h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/banner.png"
              alt="Event background"
              className="object-cover opacity-90"
            />
          </div>
          <div className="z-10 max-w-3xl">
            <h2 className="text-4xl font-extrabold md:text-6xl">
              Discover & Book Events Anywhere!
            </h2>
            <p className="text-lg mt-4 md:text-xl">
              Find exciting concerts, workshops, and conferences worldwide. Stay
              connected to what matters!
            </p>
            <div className="mt-6 flex space-x-4 justify-center">
              <Link href="/create-event">
                <button className="bg-orange-500 px-6 py-3 rounded-md text-lg hover:bg-orange-600 transition">
                  Host an Event
                </button>
              </Link>
              <Link href="/view-events">
                <button className="bg-blue-600 px-6 py-3 rounded-md text-lg hover:bg-blue-700 transition">
                  View Events
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      <section className="relative w-full h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-black opacity-50"></div>{" "}
          {/* Dark Overlay */}
          <img
            src="/images/banner.png"
            alt="Event background"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="relative z-10 max-w-3xl text-white">
          <h2 className="text-3xl font-extrabold sm:text-4xl md:text-5xl lg:text-6xl">
            Discover & Book Events Anywhere!
          </h2>
          <p className="mt-4 text-lg sm:text-xl md:text-2xl">
            Find exciting concerts, workshops, and conferences worldwide. Stay
            connected to what matters!
          </p>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
            <Link href="/create_event">
              <button className="bg-orange-500 px-6 py-3 rounded-md text-lg font-semibold hover:bg-orange-600 transition">
                Create an Event
              </button>
            </Link>
            <Link href="/">
              <button className="bg-blue-600 px-6 py-3 rounded-md text-lg font-semibold hover:bg-blue-700 transition">
                View Tickets
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* <Home /> */}

      <div className="">
        <div className="">
          <h3 className="text-1xl md:text-2xl font-bold mt-20 m-5">
            Featured & Upcoming Events
          </h3>

          <div className="w-full px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 justify-center">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <EventCard key={index} event={event} />
                ))
              ) : (
                <p className="text-center text-gray-500 col-span-full">
                  No events found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

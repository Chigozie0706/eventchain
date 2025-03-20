"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { useContract } from "@/context/ContractContext";

export default function Home() {
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
      <div className="">
        <div className="pt-16">
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

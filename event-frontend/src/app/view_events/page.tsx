"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import HeroSection from "@/components/HeroSection";
import EventPage from "@/components/EventPage";
import { useContract } from "@/context/ContractContext";

export default function Home() {
  const [events, setEvents] = useState([]);
  const { contract } = useContract();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!contract) {
          console.error("Contract not found");
          return;
        }

        const eventData = await contract.getAllEvents();
        setEvents(eventData);
        console.log(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [contract]);

  return (
    <>
      {/* <Navbar /> */}
      <div className="">
        <div className="pt-16">
          <h3 className="text-1xl md:text-2xl font-bold mt-20 m-5">
            Featured & Upcoming Events
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-5">
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
    </>
  );
}

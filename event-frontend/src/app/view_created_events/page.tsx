"use client";
import { useEffect, useState, useCallback } from "react";
import EventCard from "@/components/EventCard";
import { useContract } from "@/context/ContractContext";
import CreatorEventCard from "@/components/CreatorEventCard";
import { toast } from "react-hot-toast";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [, setIndexes] = useState([]);
  const { contract, readOnlyContract } = useContract();
  const [loading, setLoading] = useState(false);

  // Fetch events
  const fetchCreatorEvents = useCallback(async () => {
    try {
      if (!contract) {
        console.error(" Contract instance not found");
        return;
      }

      const rawData = await contract.getActiveEventsByCreator();
      console.log("🔹 Raw Creator Events Data:", rawData);

      if (!rawData || rawData.length !== 2) {
        console.error(" Unexpected data format from contract");
        return;
      }

      const [rawIndexes, rawEvents] = rawData;

      const formattedEvents = rawEvents.map(
        (event: any[], idx: string | number) => ({
          index: Number(rawIndexes[idx]),
          owner: event[0],
          eventName: event[1],
          eventCardImgUrl: event[2],
          eventDetails: event[3],
          eventDate: Number(event[4]),
          startTime: Number(event[5]),
          endTime: Number(event[6]),
          eventLocation: event[7],
          isActive: event[8],
          ticketPrice: Number(event[9]),
        })
      );

      setIndexes(rawIndexes.map(Number));
      setEvents(formattedEvents);
      console.log("✅ Updated Creator Events:", formattedEvents);
    } catch (error) {
      console.error("Error fetching creator events:", error);
      toast.error("Failed to fetch events.");
    }
  }, [contract]);

  useEffect(() => {
    fetchCreatorEvents();
  }, [contract, fetchCreatorEvents]);

  // Delete event
  // const deleteEvent = async (eventId: number) => {
  //   if (!contract) return;

  //   setLoading(true);
  //   toast.loading("Deleting event...");

  //   try {
  //     const tx = await contract.deleteEventById(eventId);
  //     await tx.wait();
  //     toast.success(`Event ${eventId} deleted successfully!`);

  //     // Refetch events after deletion
  //     fetchCreatorEvents();
  //   } catch (error) {
  //     console.error("Error deleting event:", error);
  //     toast.error("Failed to delete event.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const deleteEvent = async (eventId: number) => {
    if (!contract) return;

    const toastId = toast.loading("Deleting event...");
    setLoading(true);

    try {
      const tx = await contract.deleteEventById(eventId);
      await tx.wait();

      toast.dismiss(toastId);
      toast.success("Event deleted successfully!");

      console.log(`Event ${eventId} deleted!`);

      // Refetch events after deletion
      fetchCreatorEvents();
    } catch (error: any) {
      console.error("Error deleting event:", error);

      toast.dismiss(toastId);

      if (error.reason) {
        toast.error(`Transaction Reverted: ${error.reason}`);
      } else if (error.data?.message) {
        toast.error(`Smart Contract Error: ${error.data.message}`);
      } else {
        toast.error("Transaction failed. Please check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="">
        <div className="pt-16">
          <h3 className="text-1xl md:text-2xl font-bold mt-20 m-5">
            Created Events
          </h3>
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-5"> */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-5 justify-items-center"> */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-5 justify-items-stretch"> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mx-auto">
            {events.length > 0 ? (
              events.map((event, index) => (
                <CreatorEventCard
                  key={index}
                  event={event}
                  onDelete={deleteEvent}
                  loading={loading}
                />
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

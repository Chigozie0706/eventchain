"use client";
import { useEffect, useState, useCallback } from "react";
import CreatorEventCard from "@/components/CreatorEventCard";
import { useContract } from "@/context/ContractContext";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [mentoTokens, setMentoTokens] = useState<Record<string, string>>({});
  const { contract } = useContract();
  const [loading, setLoading] = useState(false);

  // Fetch events
  const fetchCreatorEvents = useCallback(async () => {
    try {
      if (!contract) {
        console.error("Contract instance not found");
        return;
      }

      const rawData = await contract.getActiveEventsByCreator();
      console.log("🔹 Raw Creator Events Data:", rawData);

      if (!rawData || rawData.length !== 2) {
        console.error("Unexpected data format from contract");
        return;
      }

      const [rawIndexes, rawEvents] = rawData;

      const formattedEvents = rawEvents.map((event: any[], idx: number) => ({
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
        fundsHeld: Number(event[10]),
        isCanceled: event[11],
        fundsReleased: event[12],
        paymentToken: ethers.getAddress(event[13]), // Ensure checksummed
      }));

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
      <div className="pt-16 px-4">
        <h3 className="text-2xl font-bold mt-10 mb-6">Created Events</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
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
    </>
  );
}

"use client";
import { useEffect, useState, useCallback } from "react";
import CreatorEventCard from "@/components/CreatorEventCard";
import { useContract } from "@/context/ContractContext";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const { contract } = useContract();
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Function to fetch events created by the user
  // const fetchCreatorEvents = useCallback(async () => {
  //   try {
  //     if (!contract) {
  //       return;
  //     }

  //     // Fetch active events created by the user from the smart contract
  //     const rawData = await contract.getActiveEventsByCreator();

  //     // Validate the expected data structure
  //     if (!rawData || rawData.length !== 2) {
  //       console.error("Unexpected data format from contract");
  //       return;
  //     }

  //     const [rawIndexes, rawEvents] = rawData;

  //     // Format the raw event data into a structured format for rendering
  //     const formattedEvents = rawEvents.map((event: any[], idx: number) => ({
  //       index: Number(rawIndexes[idx]),
  //       owner: event[0],
  //       eventName: event[1],
  //       eventCardImgUrl: event[2],
  //       eventDetails: event[3],
  //       eventDate: Number(event[4]),
  //       startTime: Number(event[5]),
  //       endTime: Number(event[6]),
  //       eventLocation: event[7],
  //       isActive: event[8],
  //       ticketPrice: Number(event[9]),
  //       fundsHeld: Number(event[10]),
  //       isCanceled: event[11],
  //       fundsReleased: event[12],
  //       paymentToken: ethers.getAddress(event[13]), // Ensure checksummed
  //     }));

  //     setEvents(formattedEvents);
  //     console.log(" Updated Creator Events:", formattedEvents);
  //   } catch (error) {
  //     console.error("Error fetching creator events:", error);
  //     toast.error("Failed to fetch events.");
  //   }
  // }, [contract]);

  const cancelEvent = async (eventId: number) => {
    if (!contract) return;

    const toastId = toast.loading("Canceling event...");
    setCancelLoading(true);

    try {
      const tx = await contract.cancelEvent(eventId);
      await tx.wait();

      toast.dismiss(toastId);
      toast.success("Event canceled successfully!");
      fetchCreatorEvents(); // Refresh the events list
    } catch (error: any) {
      console.error("Error canceling event:", error);
      toast.dismiss(toastId);

      const errorMessage =
        error.reason ||
        error.data?.message ||
        "Failed to cancel event. Check console for details.";
      toast.error(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  const fetchCreatorEvents = useCallback(async () => {
    try {
      if (!contract) return;

      setLoading(true);
      const rawData = await contract.getActiveEventsByCreator();

      if (!rawData || rawData.length !== 2) {
        console.error("Unexpected data format from contract");
        return;
      }

      const [rawIndexes, rawEvents] = rawData;

      const formattedEvents = rawEvents.map((event: any, idx: number) => ({
        index: Number(rawIndexes[idx]),
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
        ticketPrice: Number(ethers.formatUnits(event.ticketPrice, 18)), // Convert from wei
        fundsHeld: Number(ethers.formatUnits(event.fundsHeld, 18)), // Convert from wei
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        paymentToken: ethers.getAddress(event.paymentToken), // Ensure checksum address
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching creator events:", error);
      toast.error("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Fetch events whenever the contract instance changes
  useEffect(() => {
    fetchCreatorEvents();
  }, [contract, fetchCreatorEvents]);

  // Function to delete an event
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

        {/* Grid layout for displaying created events */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
          {events.length > 0 ? (
            events.map((event, index) => (
              <CreatorEventCard
                key={index}
                event={event}
                onDelete={deleteEvent}
                loading={loading}
                cancelLoading={cancelLoading}
                onCancel={cancelEvent}
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

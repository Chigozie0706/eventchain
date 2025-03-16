"use client";
import { useState, useEffect, useCallback } from "react";
import EventPage from "@/components/EventPage";
import { useContract } from "@/context/ContractContext";
import { parseUnits } from "ethers";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";

export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  eventDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: number;
}

export default function Home() {
  const [attendees, setAttendees] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contract, readOnlyContract, cUSDToken } = useContract();
  const { id } = useParams();

  console.log("id", id);

  const [event, setEvent] = useState<Event>({
    owner: "",
    eventName: "",
    eventCardImgUrl: "",
    eventDetails: "",
    eventDate: 0,
    startTime: 0,
    endTime: 0,
    eventLocation: "",
    isActive: false,
    ticketPrice: 0,
  });

  // Move fetchEventById outside useEffect so it can be called manually
  const fetchEventById = useCallback(async () => {
    try {
      if (!readOnlyContract) {
        console.error(" readOnlyContract instance not found");
        return;
      }

      const rawData = await readOnlyContract.getEventById(id);
      console.log("🔹 Raw Event Data:", rawData); // Debugging

      if (!rawData || rawData.length !== 3) {
        console.error(" Unexpected data format from readOnlyContract");
        return;
      }

      const [eventDetails, rawAttendees, rawCreatedEvents] = rawData;

      const formattedEvent = {
        owner: eventDetails.owner,
        eventName: eventDetails.eventName,
        eventCardImgUrl: eventDetails.eventCardImgUrl,
        eventDetails: eventDetails.eventDetails,
        eventDate: Number(eventDetails.eventDate),
        startTime: Number(eventDetails.startTime),
        endTime: Number(eventDetails.endTime),
        eventLocation: eventDetails.eventLocation,
        isActive: eventDetails.isActive,
        ticketPrice: Number(eventDetails.ticketPrice),
      };

      const formattedAttendees = rawAttendees.map((attendee: any) => attendee);

      const formattedCreatedEvents = rawCreatedEvents.map((event: any) => ({
        owner: event.owner,
        eventName: event.eventName,
        eventCardImgUrl: event.eventCardImgUrl,
        eventDetails: event.eventDetails,
        eventDate: Number(event.eventDate),
        startTime: Number(event.startTime),
        endTime: Number(event.endTime),
        eventLocation: event.eventLocation,
        isActive: event.isActive,
        ticketPrice: Number(event.ticketPrice),
      }));

      setEvent(formattedEvent);
      setAttendees(formattedAttendees);
      setCreatedEvents(formattedCreatedEvents);

      console.log(" Formatted Event:", formattedEvent);
      console.log(" Formatted Attendees:", formattedAttendees);
      console.log(" Formatted Created Events:", formattedCreatedEvents);
    } catch (error) {
      console.error(" Error fetching event by ID:", error);
    }
  }, [contract, id]);

  useEffect(() => {
    fetchEventById();
  }, [readOnlyContract, fetchEventById]);

  const buyTicket = async () => {
    if (!contract || !cUSDToken) return;

    setLoading(true);
    const toastId = toast.loading("Processing your ticket purchase...");

    try {
      const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

      // Step 1: Approve contract to spend cUSD
      const approveTx = await cUSDToken.approve(
        contract.target,
        ticketPriceWei
      );
      await approveTx.wait();

      // Step 2: Buy ticket
      const buyTx = await contract.buyTicket(id);
      await buyTx.wait();

      // Dismiss loading toast and show success message
      toast.dismiss(toastId);
      toast.success(" Ticket purchased successfully!");

      console.log(" Ticket purchased successfully!");
      fetchEventById();
    } catch (error: any) {
      console.error(" Error buying ticket:", error);

      // Dismiss loading toast and show error message
      toast.dismiss(toastId);

      if (error.reason) {
        toast.error(`Transaction Reverted: ${error.reason}`);
      } else if (error.data?.message) {
        toast.error(`Smart Contract Error: ${error.data.message}`);
      } else {
        toast.error("Transaction failed. Please check console for details.");
      }
    } finally {
      setLoading(false); // Ensure loading state is turned off after completion
    }
  };

  const requestRefund = async () => {
    if (!contract) return;

    setLoading(true);
    const toastId = toast.loading("Processing refund request...");

    try {
      const refundTx = await contract.requestRefund(id);
      await refundTx.wait();

      toast.dismiss(toastId);
      toast.success("Refund processed successfully!");

      console.log("Refund successful!");
      fetchEventById(); // Refresh event details
    } catch (error: any) {
      console.error("Error requesting refund:", error);

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
      <div className="pt-16">
        <EventPage
          event={event}
          attendees={attendees}
          createdEvents={createdEvents}
          buyTicket={buyTicket}
          requestRefund={requestRefund}
          loading={loading}
        />
      </div>
    </>
  );
}

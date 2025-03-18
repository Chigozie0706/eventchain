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
  fundsHeld: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  paymentToken: string;
}

export default function Home() {
  const [attendees, setAttendees] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contract, readOnlyContract, address, mentoTokenContracts } =
    useContract();
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
    fundsHeld: 0,
    isCanceled: false,
    fundsReleased: false,
    paymentToken: "",
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
        fundsHeld: Number(eventDetails.fundsHeld),
        isCanceled: eventDetails.isCanceled,
        fundsReleased: eventDetails.isCanceled,
        paymentToken: eventDetails.paymentToken,
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
        fundsHeld: Number(event.fundsHeld),
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        paymentToken: event.paymentToken,
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
    console.log("Attempting to buy ticket with:", event.paymentToken);

    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!contract) {
      toast.error("Contract not initialized.");
      return;
    }

    const paymentTokenContract = mentoTokenContracts[event.paymentToken];
    if (!paymentTokenContract) {
      toast.error(`Unsupported payment token: ${event.paymentToken}`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing your ticket purchase...");

    try {
      const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

      console.log(`Approving ${event.paymentToken} spending...`);

      // Step 1: Approve the contract to spend the token
      const approveTx = await paymentTokenContract.approve(
        contract.target,
        ticketPriceWei
      );
      await approveTx.wait();
      console.log("Approval successful:", approveTx);

      console.log("Purchasing ticket...");

      // Step 2: Buy the ticket
      const buyTx = await contract.buyTicket(id);
      await buyTx.wait();
      console.log("Ticket purchased successfully:", buyTx);

      toast.dismiss(toastId);
      toast.success("Ticket purchased successfully!");

      fetchEventById(); // Refresh event details
    } catch (error: any) {
      console.error("Error buying ticket:", error);

      toast.dismiss(toastId);
      toast.error(error.reason || "Transaction failed.");
    } finally {
      setLoading(false);
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

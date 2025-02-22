"use client";
import { useState, useEffect } from "react";
import EventPage from "@/components/EventPage";
import { useContract } from "@/context/ContractContext";
// import { ethers } from "ethers"; // Import ethers.js for transaction handling
import { parseUnits } from "ethers";

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
  // const [event, setEvent] = useState({});
  // const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const { contract, cUSDToken } = useContract();

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

  useEffect(() => {
    const fetchEventById = async () => {
      try {
        if (!contract) {
          console.error(" Contract instance not found");
          return;
        }

        // Fetch event details, attendees, and created events
        const rawData = await contract.getEventById(0);
        console.log("🔹 Raw Event Data:", rawData); // Debugging

        if (!rawData || rawData.length !== 3) {
          console.error(" Unexpected data format from contract");
          return;
        }

        // Extract event details, attendees, and created events
        const [eventDetails, rawAttendees, rawCreatedEvents] = rawData;

        // Format event details
        const formattedEvent = {
          owner: eventDetails.owner,
          eventName: eventDetails.eventName,
          eventCardImgUrl: eventDetails.eventCardImgUrl,
          eventDetails: eventDetails.eventDetails,
          eventDate: Number(eventDetails.eventDate), // Convert BigInt to Number
          startTime: Number(eventDetails.startTime), // Convert BigInt to Number
          endTime: Number(eventDetails.endTime), // Convert BigInt to Number
          eventLocation: eventDetails.eventLocation,
          isActive: eventDetails.isActive,
          ticketPrice: Number(eventDetails.ticketPrice),
        };

        // Format attendees (array of addresses)
        const formattedAttendees = rawAttendees.map(
          (attendee: any) => attendee
        );

        // Format created events (array of Event structs)
        const formattedCreatedEvents = rawCreatedEvents.map((event: any) => ({
          owner: event.owner,
          eventName: event.eventName,
          eventCardImgUrl: event.eventCardImgUrl,
          eventDetails: event.eventDetails,
          eventDate: Number(event.eventDate), // Convert BigInt to Number
          startTime: Number(event.startTime), // Convert BigInt to Number
          endTime: Number(event.endTime), // Convert BigInt to Number
          eventLocation: event.eventLocation,
          isActive: event.isActive,
          ticketPrice: Number(event.ticketPrice),
        }));

        console.log(formattedEvent);
        // Update state
        setEvent(formattedEvent);
        setAttendees(formattedAttendees);
        setCreatedEvents(formattedCreatedEvents);
        console.log(" Formatted Event:", formattedEvent); // Debugging
        console.log(" Formatted Attendees:", formattedAttendees); // Debugging
        console.log(" Formatted Created Events:", formattedCreatedEvents); // Debugging
      } catch (error) {
        console.error(" Error fetching event by ID:", error);
      }
    };

    fetchEventById();
  }, [contract]);

  const buyTicket = async () => {
    if (!contract || !cUSDToken) return;

    try {
      //  const ticketPriceWei = ethers.utils.parseUnits(event.ticketPrice.toString(), "ether");
      const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

      // Step 1: Approve contract to spend cUSD
      const approveTx = await cUSDToken.approve(
        contract.target,
        ticketPriceWei
      );
      await approveTx.wait();

      // Step 2: Buy ticket
      const buyTx = await contract.buyTicket(0);
      await buyTx.wait();

      console.log("✅ Ticket purchased successfully!");
    } catch (error) {
      console.error("❌ Error buying ticket:", error);
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
        />
      </div>
    </>
  );
}

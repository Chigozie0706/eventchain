"use client";
import { useState, useEffect } from "react";
import EventPage from "@/components/EventPage";
import { useContract } from "@/context/ContractContext";

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
}

export default function Home() {
  // const [event, setEvent] = useState({});
  // const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const { contract } = useContract();

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
  return (
    <>
      <div className="pt-16">
        <EventPage
          event={event}
          attendees={attendees}
          createdEvents={createdEvents}
        />
      </div>
    </>
  );
}

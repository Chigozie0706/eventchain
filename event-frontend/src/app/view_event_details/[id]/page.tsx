"use client";
import { useState, useEffect, useCallback } from "react";
import EventPage from "@/components/EventPage";
import { useContract } from "@/context/ContractContext";
import { parseUnits } from "ethers";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import { useReadContract, useSendTransaction } from "thirdweb/react";
import { contract } from "@/app/client";
import { prepareContractCall, sendTransaction } from "thirdweb";

export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: bigint;
  fundsHeld: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  paymentToken: string;
}

export default function Home() {
  const [attendees1, setAttendees1] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const {
    readOnlyContract,
    address,
    mentoTokenContracts,
    balances,
    setBalances,
  } = useContract();
  // const { id } = useParams();
  const { id } = useParams<{ id: string }>();

  console.log("id", id);

  const [registering, setRegistering] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const eventId = id ? BigInt(id) : BigInt(0);
  // const { mutate: sendTransaction } = useSendTransaction();

  // const [event1, setEvent1] = useState<Event>({
  //   owner: "",
  //   eventName: "",
  //   eventCardImgUrl: "",
  //   eventDetails: "",
  //   startDate: 0,
  //   endDate: 0,
  //   startTime: 0,
  //   endTime: 0,
  //   eventLocation: "",
  //   isActive: false,
  //   ticketPrice: 0,
  //   fundsHeld: 0,
  //   isCanceled: false,
  //   fundsReleased: false,
  //   paymentToken: "",
  // });

  const mentoTokens: Record<string, string> = {
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
    "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
    "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
  };

  const {
    data: rawData,
    isLoading: isEventLoading,
    isError: isEventError,
    error: eventError,
    refetch: refetchEvent,
  } = useReadContract({
    contract,
    method:
      "function getEventById(uint256 _index) view returns ((address owner, string eventName, string eventCardImgUrl, string eventDetails, uint64 startDate, uint64 endDate, uint64 startTime, uint64 endTime, string eventLocation, bool isActive, uint256 ticketPrice, uint256 fundsHeld, bool isCanceled, bool fundsReleased, address paymentToken), address[], (address owner, string eventName, string eventCardImgUrl, string eventDetails, uint64 startDate, uint64 endDate, uint64 startTime, uint64 endTime, string eventLocation, bool isActive, uint256 ticketPrice, uint256 fundsHeld, bool isCanceled, bool fundsReleased, address paymentToken)[])",
    params: [eventId],
    //enabled: !!eventId
  });

  // Process event data
  const { event, attendees, relatedEvents } = rawData
    ? (() => {
        const [eventDetails, rawAttendees, rawRelatedEvents] = rawData;

        const formatEvent = (e: any): Event => ({
          owner: e.owner,
          eventName: e.eventName,
          eventCardImgUrl: e.eventCardImgUrl,
          eventDetails: e.eventDetails,
          startDate: Number(e.startDate),
          endDate: Number(e.endDate),
          startTime: Number(e.startTime),
          endTime: Number(e.endTime),
          eventLocation: e.eventLocation,
          isActive: e.isActive,
          ticketPrice: BigInt(e.ticketPrice.toString()), // Convert to bigint

          fundsHeld: Number(e.fundsHeld),
          isCanceled: e.isCanceled,
          fundsReleased: e.fundsReleased,
          paymentToken: ethers.getAddress(e.paymentToken),
        });

        return {
          event: formatEvent(eventDetails),
          attendees: rawAttendees.map(ethers.getAddress),
          relatedEvents: rawRelatedEvents.map(formatEvent),
        };
      })()
    : { event: null, attendees: [], relatedEvents: [] };

  console.log("event", event);

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
        startDate: Number(eventDetails.startDate),
        endDate: Number(eventDetails.endDate),
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
        startDate: Number(event.startDate),
        endDate: Number(event.endDate),
        startTime: Number(event.startTime),
        endTime: Number(event.endTime),
        eventLocation: event.eventLocation,
        isActive: event.isActive,
        ticketPrice: Number(event.ticketPrice),
        fundsHeld: Number(event.fundsHeld),
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        paymentToken: ethers.getAddress(eventDetails.paymentToken),
      }));

      // setEvent1(formattedEvent);
      setAttendees1(formattedAttendees);
      setCreatedEvents(formattedCreatedEvents);

      console.log(" Formatted Event:", formattedEvent);
      console.log(" Formatted Attendees:", formattedAttendees);
      console.log(" Formatted Created Events:", formattedCreatedEvents);
    } catch (error) {
      console.error(" Error fetching event by ID:", error);
    }
  }, [readOnlyContract, id]);

  // const buyTicket = async () => {
  //   if (!eventId) {
  //     toast.error("Invalid event ID");
  //     return;
  //   }

  //   const transaction = prepareContractCall({
  //     contract,
  //     method: "function buyTicket(uint256 _index)",
  //     params: [eventId],
  //   });

  //   sendTransaction(transaction);
  // };

  if (isEventLoading) {
    return <div className="pt-16">Loading event details...</div>;
  }

  if (isEventError) {
    return (
      <div className="pt-16 text-red-500">
        Error: {eventError?.message || "Failed to load event"}
      </div>
    );
  }

  if (!event) {
    return <div className="pt-16">Event not found</div>;
  }

  return (
    <>
      <div className="pt-16">
        <EventPage
          event={event}
          attendees={attendees}
          createdEvents={createdEvents}
          // buyTicket={buyTicket}
          id={id}
          // requestRefund={requestRefund () => void}
          loading={loading}
          registering={registering}
          refunding={refunding}
        />
      </div>
    </>
  );
}

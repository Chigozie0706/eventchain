"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { MapPin, Calendar, Flag, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import contractABI from "../contract/abi.json";

const CONTRACT_ADDRESS = "0x2A668c6A60dAe7B9cBBFB1d580cEcd0eB47e4132";

interface Event {
  id: string;
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
  ticketPrice: number;
  fundsHeld: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  paymentToken: string;
}

const mentoTokens: Record<string, string> = {
  [ethers.getAddress("0x765de816845861e75a25fca122bb6898b8b1282a")]: "cUSD",
  [ethers.getAddress("0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73")]: "cEUR",
  [ethers.getAddress("0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787")]: "cREAL",
};

// 2. Add a fallback symbol
const getTokenSymbol = (address: string) => {
  const checksumAddress = ethers.getAddress(address);
  return mentoTokens[checksumAddress] || checksumAddress.slice(0, 6) + "...";
};

export default function EventTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>(
    {}
  );

  const {
    data,
    error: contractError,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getUserEvents",
    account: address,
  });

  useEffect(() => {
    if (isError) {
      console.error("🚨 Contract read error:", {
        error: contractError,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "getUserEvents",
        timestamp: new Date().toISOString(),
      });
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        console.log("Raw user events data received:", {
          data,
          timestamp: new Date().toISOString(),
        });

        if (!Array.isArray(data) || data.length !== 2) {
          throw new Error("Unexpected data format from contract");
        }

        const [eventIds, eventData] = data as [string[], any[]];

        console.log("Processing user events data...", {
          eventCount: eventIds.length,
          timestamp: new Date().toISOString(),
        });

        const formattedEvents = eventData.map((event, index) => ({
          id: eventIds[index],
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
          ticketPrice: Number(ethers.formatUnits(event.ticketPrice, 18)),
          fundsHeld: Number(ethers.formatUnits(event.fundsHeld, 18)),
          isCanceled: event.isCanceled,
          fundsReleased: event.fundsReleased,
          paymentToken: ethers.getAddress(event.paymentToken),
        }));

        console.log("✅ Successfully formatted user events:", {
          eventCount: formattedEvents.length,
          sampleEvent: formattedEvents[0],
          timestamp: new Date().toISOString(),
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("🚨 Error processing user events data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, [isSuccess, data]);

  const requestRefund = async (id: string) => {
    setRefundLoading((prev) => ({ ...prev, [id]: true }));
    const toastId = toast.loading("Processing refund request...");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [id],
      });

      toast.dismiss(toastId);
      toast.success("Refund processed successfully!");

      console.log("Refreshing events after refund...");
      await refetch();
    } catch (error) {
      console.error("Error requesting refund:", {
        error,
        eventId: id,
        timestamp: new Date().toISOString(),
      });

      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Failed to process refund"
      );
    } finally {
      setRefundLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Events</h1>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Events</h1>
        <p className="text-red-500">
          Error: {contractError?.message || "Failed to load your tickets"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>

      {events.length === 0 ? (
        <p className="text-gray-500">You don't have any tickets yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const formattedStartTime = new Date(
              event.startTime * 1000
            ).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            });

            const formattedEndTime = new Date(
              event.endTime * 1000
            ).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            });

            const formattedStartDate = new Date(
              event.startDate * 1000
            ).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            const formattedEndDate = new Date(
              event.endDate * 1000
            ).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            });

            return (
              <li
                key={event.id}
                className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col space-y-2">
                  <h2 className="text-xl font-semibold">{event.eventName}</h2>
                  <p className="text-gray-600">{event.eventDetails}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.eventLocation}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {formattedStartDate} - {formattedEndDate}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Flag className="w-4 h-4 mr-2" />
                      <span>
                        {formattedStartTime} - {formattedEndTime}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <span>
                        {event.ticketPrice.toFixed(2)}{" "}
                        {mentoTokens[event.paymentToken]}
                      </span>
                    </div>
                  </div>

                  {/* <button
                    onClick={() => requestRefund(event.id)}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition text-sm self-start"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Request Refund"}
                  </button> */}

                  <button
                    onClick={() => requestRefund(event.id)}
                    className="mt-4 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition text-sm self-start"
                    disabled={refundLoading[event.id]}
                  >
                    {refundLoading[event.id]
                      ? "Processing..."
                      : "Request Refund"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { useAccount, useBalance, useReadContract } from "wagmi";
import contractABI from "../../contract/abi.json";
import { createWalletClient, custom } from "viem";
import { celo } from "viem/chains";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Event {
  index: number;
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

const CONTRACT_ADDRESS = "0x1b5F100B02f07E7A88f6C3A2B08152009d06685e";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

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
    functionName: "getAllEvents",
  });

  const [address1, setAddress1] = useState<string | null>(null);

  const getUserAddress = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      let walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: celo,
      });

      let [address1] = await walletClient.getAddresses();
      setAddress1(address1);
      console.log("address1", address1);
    }
  };

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address,
    chainId: 44787, // Celo Alfajores testnet
  });

  // format balance
  let formattedBalance = null;
  if (balanceData) {
    const userLocale = navigator.language || "en-US";
    const decimalFormatter = new Intl.NumberFormat(userLocale, {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
    formattedBalance = decimalFormatter.format(
      parseFloat(balanceData.formatted),
    );
  }

  useEffect(() => {
    getUserAddress();
  }, []);

  console.log("address2", address1);

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isError) {
      console.error("🚨 Contract read error:", {
        error: contractError,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "getAllEvents",
        timestamp: new Date().toISOString(),
      });
      setError("Failed to load events");
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        console.log("ℹ️ Raw events data received:", {
          data,
          timestamp: new Date().toISOString(),
        });

        if (!Array.isArray(data) || data.length !== 2) {
          throw new Error("Unexpected data format from contract");
        }

        const [indexes, eventData] = data as [bigint[], any[]];

        console.log("ℹ️ Processing events data...", {
          indexesCount: indexes.length,
          eventsCount: eventData.length,
          timestamp: new Date().toISOString(),
        });

        const formattedEvents = eventData.map((event, idx) => {
          // Now handling the event as an object with properties
          return {
            index: Number(indexes[idx]),
            owner: event.owner,
            eventName: event.eventName,
            eventCardImgUrl: event.eventCardImgUrl,
            eventDetails: event.eventDetails,
            startDate: Number(event.startDate), // Using startDate as eventDate
            startTime: Number(event.startTime),
            endDate: Number(event.startTime),
            endTime: Number(event.endTime),
            eventLocation: event.eventLocation,
            isActive: event.isActive,
            ticketPrice: Number(event.ticketPrice),
            fundsHeld: Number(event.fundsHeld),
            isCanceled: event.isCanceled,
            fundsReleased: event.fundsReleased,
            paymentToken: event.paymentToken,
          };
        });

        console.log("✅ Successfully formatted events:", {
          eventCount: formattedEvents.length,
          sampleEvent: formattedEvents[0],
          timestamp: new Date().toISOString(),
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("🚨 Error processing events data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        setError("Error processing event data");
      }
    }
  }, [isSuccess, data]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    await refetch();
  };

  if (loading) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 mt-20">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured & Upcoming Events
              </h3>
              {isConnected && address && (
                <p className="text-sm text-gray-500 mt-2">
                  Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh events"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <EventCard
                  key={`event-${event.index}-${event.owner}`}
                  event={event}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Events Available
                  </h3>
                  <p className="text-gray-500">
                    There are currently no upcoming events. Check back soon!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

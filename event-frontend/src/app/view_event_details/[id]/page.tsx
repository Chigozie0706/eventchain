"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import contractABI from "../../../contract/abi.json";
import EventPage from "@/components/EventPage";
import { erc20Abi } from "viem";

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

const CONTRACT_ADDRESS = "0x3C163Eee0Bc89cCf4b32A83278a3c7A1E6e7E9e4";
const mentoTokens: Record<string, string> = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<{
    event: Event;
    attendees: string[];
    relatedEvents: Event[];
  } | null>(null);
  const { id } = useParams<{ id: string }>();
  const eventId = id ? BigInt(id) : BigInt(0);
  const { address } = useAccount();

  // Contract data fetching with refetch capability
  const {
    data: rawData,
    isError: isEventError,
    error: eventError,
    refetch: refetchEvent,
  } = useReadContract({
    abi: contractABI.abi,
    address: CONTRACT_ADDRESS,
    functionName: "getEventById",
    args: [eventId],
  });

  // Transaction handling
  const {
    writeContract: write,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Token balance check
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: eventDetails?.event.paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address && !!eventDetails?.event.paymentToken },
  });

  // Token allowance check
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: eventDetails?.event.paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, CONTRACT_ADDRESS],
    query: { enabled: !!address && !!eventDetails?.event.paymentToken },
  });

  // Refund transaction handling
  const {
    writeContract: writeRefund,
    data: refundHash,
    isPending: isRefundWriting,
    error: refundWriteError,
  } = useWriteContract();
  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } =
    useWaitForTransactionReceipt({ hash: refundHash });

  // Refetch data after successful actions
  useEffect(() => {
    if (isConfirmed || isRefundConfirmed) {
      // Refetch all relevant data
      Promise.all([
        refetchEvent(),
        refetchBalance?.(),
        refetchAllowance?.(),
      ]).catch(console.error);
    }
  }, [
    isConfirmed,
    isRefundConfirmed,
    refetchEvent,
    refetchBalance,
    refetchAllowance,
  ]);

  // Refund status handling
  useEffect(() => {
    if (isRefundWriting) toast.loading("Confirming refund...");
    if (isRefundConfirming) toast.loading("Processing refund...");
    if (isRefundConfirmed) {
      toast.success("Refund processed successfully!");
    }
    if (refundWriteError) {
      toast.error(refundWriteError.message || "Refund failed");
    }

    return () => toast.dismiss();
  }, [
    isRefundWriting,
    isRefundConfirming,
    isRefundConfirmed,
    refundWriteError,
  ]);

  // Process event data when fetched
  useEffect(() => {
    if (rawData) {
      const [eventData, attendees, relatedEvents] = rawData as any;
      setEventDetails({
        event: {
          owner: eventData.owner,
          eventName: eventData.eventName,
          eventCardImgUrl: eventData.eventCardImgUrl,
          eventDetails: eventData.eventDetails,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          eventLocation: eventData.eventLocation,
          isActive: eventData.isActive,
          ticketPrice: eventData.ticketPrice,
          fundsHeld: eventData.fundsHeld,
          isCanceled: eventData.isCanceled,
          fundsReleased: eventData.fundsReleased,
          paymentToken: eventData.paymentToken,
        },
        attendees: attendees || [],
        relatedEvents: relatedEvents || [],
      });
    }
  }, [rawData]);

  // Purchase status handling
  useEffect(() => {
    if (isWriting) toast.loading("Confirming transaction...");
    if (isConfirming) toast.loading("Processing transaction...");
    if (isConfirmed) {
      toast.success("Ticket purchased successfully!");
    }
    if (writeError) {
      toast.error(writeError.message || "Transaction failed");
    }

    return () => toast.dismiss();
  }, [isWriting, isConfirming, isConfirmed, writeError]);

  const approveTokens = useCallback(async () => {
    if (!eventDetails || !address) return;

    try {
      const approveAmount =
        (eventDetails.event.ticketPrice * BigInt(110)) / BigInt(100);
      write({
        address: eventDetails.event.paymentToken as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, approveAmount],
      });
    } catch (error: any) {
      console.error("Approval failed:", error);
      toast.error(error?.message || "Token approval failed");
    }
  }, [eventDetails, address, write]);

  const buyTicket = useCallback(async () => {
    if (!eventDetails || !address) return;

    try {
      const requiredAllowance = eventDetails.event.ticketPrice;
      if (!tokenAllowance || tokenAllowance < requiredAllowance) {
        await write({
          address: eventDetails.event.paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, requiredAllowance],
          gas: BigInt(300000),
        });
      }

      await write({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "buyTicket",
        args: [eventId],
        gas: BigInt(500000),
      });
    } catch (error) {
      console.error("Full error:", error);
      toast.error("Transaction failed");
    }
  }, [eventDetails, address, eventId, write, tokenAllowance]);

  const requestRefund = useCallback(async () => {
    if (!eventDetails || !address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!eventDetails.attendees.includes(address)) {
      toast.error("You don't have a ticket to refund");
      return;
    }

    try {
      writeRefund({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [eventId],
      });
    } catch (error: any) {
      console.error("Refund request failed:", error);
      toast.error(error?.message || "Failed to process refund");
    }
  }, [eventDetails, address, eventId, writeRefund]);

  if (isEventError) {
    return (
      <div className="pt-16 text-red-500">
        Error: {eventError?.message || "Failed to load event"}
      </div>
    );
  }

  if (!eventDetails) {
    return <div className="pt-16">Loading event...</div>;
  }

  return (
    <div className="pt-16">
      <EventPage
        event={eventDetails.event}
        attendees={eventDetails.attendees}
        createdEvents={eventDetails.relatedEvents}
        buyTicket={buyTicket}
        id={id}
        loading={loading}
        registering={isWriting || isConfirming}
        requestRefund={requestRefund}
        refunding={isRefundWriting || isRefundConfirming}
      />
    </div>
  );
}

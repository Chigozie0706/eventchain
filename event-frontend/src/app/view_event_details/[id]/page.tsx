"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import {
  formatUnits,
  parseUnits,
  encodeFunctionData,
  encodeAbiParameters,
} from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import { erc20Abi } from "viem";

import contractABI from "@/contract/abi.json";
import EventPage from "@/components/EventPage";
import { getTokenByAddress } from "@/utils/tokens";

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
  fundsHeld: bigint;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
  paymentToken: string;
}

const CONTRACT_ADDRESS = "0x1b5F100B02f07E7A88f6C3A2B08152009d06685e";
const CELO_ADDRESS = "0x0000000000000000000000000000000000000000";
const G_DOLLAR_ADDRESS = "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";

// Toast configurations
const toastConfig = {
  success: {
    duration: 4000,
    icon: "✅",
    style: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
    },
  },
  error: {
    duration: 5000,
    icon: "❌",
    style: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
    },
  },
  loading: {
    icon: "⏳",
    style: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
    },
  },
  warning: {
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(245, 158, 11, 0.3)",
    },
  },
  info: {
    duration: 3000,
    icon: "ℹ️",
    style: {
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)",
    },
  },
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [eventDetails, setEventDetails] = useState<{
    event: Event;
    attendees: string[];
  } | null>(null);

  const { id } = useParams<{ id: string }>();
  const eventId = id ? BigInt(id) : BigInt(0);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Contract reads
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

  // Get token allowance for ERC20 payments
  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: eventDetails?.event.paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, CONTRACT_ADDRESS],
    query: {
      enabled:
        !!address &&
        !!eventDetails?.event.paymentToken &&
        eventDetails.event.paymentToken !== CELO_ADDRESS,
    },
  });

  // Transaction hooks
  const {
    writeContract: write,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const {
    writeContract: writeRefund,
    data: refundHash,
    isPending: isRefundWriting,
    error: refundWriteError,
  } = useWriteContract();

  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } =
    useWaitForTransactionReceipt({ hash: refundHash });

  // Parse event data
  useEffect(() => {
    if (rawData) {
      const [eventData, attendees] = rawData as any;
      setEventDetails({
        event: {
          owner: eventData.owner,
          eventName: eventData.eventName,
          eventCardImgUrl: eventData.eventCardImgUrl,
          eventDetails: eventData.eventDetails,
          startDate: Number(eventData.startDate),
          endDate: Number(eventData.endDate),
          startTime: Number(eventData.startTime),
          endTime: Number(eventData.endTime),
          eventLocation: eventData.eventLocation,
          isActive: eventData.isActive,
          ticketPrice: eventData.ticketPrice,
          fundsHeld: eventData.fundsHeld,
          minimumAge: Number(eventData.minimumAge),
          maxCapacity: Number(eventData.maxCapacity),
          isCanceled: eventData.isCanceled,
          fundsReleased: eventData.fundsReleased,
          exists: eventData.exists,
          refundPolicy: Number(eventData.refundPolicy),
          refundBufferHours: Number(eventData.refundBufferHours),
          paymentToken: eventData.paymentToken,
        },
        attendees: attendees || [],
      });
    }
  }, [rawData]);

  // Refetch data after successful transactions
  useEffect(() => {
    if (isConfirmed || isRefundConfirmed) {
      const refreshToastId = toast.loading("Refreshing event data...", {
        ...toastConfig.loading,
        icon: "🔄",
      });

      Promise.all([refetchEvent(), refetchAllowance?.()])
        .then(() => {
          toast.success("Event data updated!", {
            ...toastConfig.success,
            id: refreshToastId,
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error("Failed to refresh data:", error);
          toast.dismiss(refreshToastId);
        });
    }
  }, [isConfirmed, isRefundConfirmed, refetchEvent, refetchAllowance]);

  // Buy ticket notifications
  useEffect(() => {
    let toastId: string | undefined;

    if (isWriting) {
      toastId = toast.loading(
        "🔐 Please confirm the transaction in your wallet...",
        toastConfig.loading,
      );
    } else if (isConfirming) {
      toastId = toast.loading(
        "⏳ Waiting for blockchain confirmation...",
        toastConfig.loading,
      );
    } else if (isConfirmed) {
      toast.success("🎉 Ticket purchased successfully!", {
        ...toastConfig.success,
        duration: 5000,
      });

      setTimeout(() => {
        toast.success("Check your wallet for the ticket!", {
          ...toastConfig.info,
          duration: 3000,
        });
      }, 1000);
    } else if (writeError) {
      const errorMessage = parseErrorMessage(writeError.message);
      toast.error(errorMessage, {
        ...toastConfig.error,
        duration: 6000,
      });
    }

    return () => {
      if (toastId) toast.dismiss(toastId);
    };
  }, [isWriting, isConfirming, isConfirmed, writeError]);

  // Refund notifications
  useEffect(() => {
    let toastId: string | undefined;

    if (isRefundWriting) {
      toastId = toast.loading(
        "🔐 Confirming refund request...",
        toastConfig.loading,
      );
    } else if (isRefundConfirming) {
      toastId = toast.loading(
        "⏳ Processing refund on blockchain...",
        toastConfig.loading,
      );
    } else if (isRefundConfirmed) {
      toast.success("💰 Refund processed successfully!", {
        ...toastConfig.success,
        duration: 5000,
      });

      setTimeout(() => {
        toast.success("Funds have been returned to your wallet", {
          ...toastConfig.info,
          duration: 3000,
        });
      }, 1000);
    } else if (refundWriteError) {
      const errorMessage = parseErrorMessage(refundWriteError.message);
      toast.error(errorMessage, {
        ...toastConfig.error,
        duration: 6000,
      });
    }

    return () => {
      if (toastId) toast.dismiss(toastId);
    };
  }, [
    isRefundWriting,
    isRefundConfirming,
    isRefundConfirmed,
    refundWriteError,
  ]);

  // Helper function to parse error messages
  const parseErrorMessage = (message: string): string => {
    if (
      message.includes("User rejected") ||
      message.includes("user rejected")
    ) {
      return "Transaction was cancelled";
    }
    if (message.includes("insufficient funds")) {
      return "Insufficient funds for gas fees";
    }
    if (message.includes("transfer amount exceeds balance")) {
      return "Insufficient token balance";
    }
    if (
      message.includes("Already purchased") ||
      message.includes("Ticket already purchased")
    ) {
      return "You already own a ticket for this event";
    }
    if (message.includes("Event has started")) {
      return "This event has already started";
    }
    if (message.includes("Event is not active")) {
      return "This event is no longer active";
    }
    if (message.includes("Event at maximum capacity")) {
      return "Sorry, this event is sold out";
    }
    if (
      message.includes("Refund period has ended") ||
      message.includes("Refund buffer period has ended")
    ) {
      return "Refund period has expired for this event";
    }
    if (message.includes("No ticket purchased")) {
      return "You don't have a ticket to refund";
    }
    if (message.includes("Insufficient allowance")) {
      return "Token approval failed - please try again";
    }

    return message.length > 100
      ? "Transaction failed - please try again"
      : message;
  };

  // Buy ticket function
  const buyTicket = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to purchase tickets", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (!eventDetails || !address || !walletClient || !publicClient) {
      toast.error("Wallet connection error - please reconnect", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (eventDetails.attendees.includes(address)) {
      toast.error("You already own a ticket for this event", {
        ...toastConfig.warning,
        duration: 4000,
      });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (eventDetails.event.startDate < now) {
      toast.error("This event has already started", {
        ...toastConfig.warning,
        duration: 4000,
      });
      return;
    }

    if (!eventDetails.event.isActive) {
      toast.error("This event is no longer active", {
        ...toastConfig.warning,
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);
      const mainToastId = toast.loading(
        "🎟️ Preparing your ticket purchase...",
        toastConfig.loading,
      );

      const requiredAmount = eventDetails.event.ticketPrice;
      const paymentToken = eventDetails.event.paymentToken;
      const tokenInfo = getTokenByAddress(paymentToken);

      const isGdollar =
        paymentToken.toLowerCase() === G_DOLLAR_ADDRESS.toLowerCase();
      const isCelo = paymentToken === CELO_ADDRESS;

      // Check balance for CELO
      if (isCelo) {
        toast.loading("💰 Checking your CELO balance...", { id: mainToastId });

        const balance = await publicClient.getBalance({ address });
        if (balance < requiredAmount) {
          toast.error(
            `Insufficient CELO balance. Required: ${formatUnits(requiredAmount, 18)} CELO`,
            {
              ...toastConfig.error,
              id: mainToastId,
              duration: 6000,
            },
          );
          setLoading(false);
          return;
        }
      }

      let hash: `0x${string}`;

      // G$ token flow (ERC-677)
      if (isGdollar) {
        toast.loading("💵 Preparing G$ token transfer...", { id: mainToastId });

        const eventIdData = encodeAbiParameters(
          [{ type: "uint256" }],
          [eventId],
        );

        toast.loading("🔐 Confirm G$ transfer in your wallet...", {
          id: mainToastId,
        });

        hash = await walletClient.writeContract({
          address: paymentToken as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "data", type: "bytes" },
              ],
              name: "transferAndCall",
              outputs: [{ name: "", type: "bool" }],
              stateMutability: "nonpayable",
              type: "function",
            },
          ],
          functionName: "transferAndCall",
          args: [CONTRACT_ADDRESS, requiredAmount, eventIdData],
        });
      }
      // CELO native token flow
      else if (isCelo) {
        toast.loading("💎 Preparing CELO payment...", { id: mainToastId });

        toast.loading("🔐 Confirm CELO payment in your wallet...", {
          id: mainToastId,
        });

        write({
          address: CONTRACT_ADDRESS,
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
          value: requiredAmount,
        });

        // Wait for the write to complete
        return;
      }
      // Standard ERC-20 flow
      else {
        // Handle token approval if needed
        if (!tokenAllowance || tokenAllowance < requiredAmount) {
          toast.loading(
            `✅ Approving ${tokenInfo?.symbol || "token"} spend...`,
            { id: mainToastId },
          );

          const approvalHash = await walletClient.writeContract({
            address: paymentToken as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, requiredAmount],
          });

          toast.loading("⏳ Waiting for approval confirmation...", {
            id: mainToastId,
          });

          await publicClient.waitForTransactionReceipt({ hash: approvalHash });

          toast.success(
            `${tokenInfo?.symbol || "Token"} approved successfully!`,
            {
              ...toastConfig.success,
              duration: 2000,
            },
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        toast.loading(
          `💳 Preparing ${tokenInfo?.symbol || "token"} payment...`,
          { id: mainToastId },
        );

        toast.loading("🔐 Confirm purchase in your wallet...", {
          id: mainToastId,
        });

        write({
          address: CONTRACT_ADDRESS,
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        // Wait for the write to complete
        return;
      }

      // For G$ only (CELO and ERC20 use write hook)
      if (isGdollar) {
        toast.loading("⏳ Processing transaction...", { id: mainToastId });

        await publicClient.waitForTransactionReceipt({ hash });

        setLoading(false);

        toast.success(
          `🎉 Ticket purchased for ${eventDetails.event.eventName}!`,
          {
            ...toastConfig.success,
            id: mainToastId,
            duration: 5000,
          },
        );

        setTimeout(() => {
          toast.success(
            `Transaction: ${hash.slice(0, 6)}...${hash.slice(-4)}`,
            {
              ...toastConfig.info,
              duration: 4000,
            },
          );
        }, 1000);
      }
    } catch (error: any) {
      console.error("[Ticket] Transaction failed:", error);

      let errorMessage = "Failed to purchase ticket";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction cancelled by user";
        toast.error(errorMessage, { ...toastConfig.warning });
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
        toast.error(errorMessage, { ...toastConfig.error });
      } else {
        errorMessage = error.shortMessage || error.message || errorMessage;
        toast.error(errorMessage, { ...toastConfig.error });
      }

      setLoading(false);
    }
  }, [
    isConnected,
    eventDetails,
    address,
    eventId,
    walletClient,
    tokenAllowance,
    publicClient,
    write,
  ]);

  // Request refund function
  const requestRefund = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to request a refund", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (!eventDetails || !address) {
      toast.error("Wallet connection error - please reconnect", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (!eventDetails.attendees.includes(address)) {
      toast.error("You don't have a ticket to refund", {
        ...toastConfig.warning,
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);
      const mainToastId = toast.loading(
        "💰 Preparing refund request...",
        toastConfig.loading,
      );

      toast.loading("🔐 Confirm refund request in your wallet...", {
        id: mainToastId,
      });

      writeRefund({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [eventId],
      });
    } catch (error: any) {
      console.error("[Refund] Transaction failed:", error);

      let errorMessage = "Refund request failed";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Refund request cancelled";
        toast.error(errorMessage, { ...toastConfig.warning });
      } else {
        errorMessage = error.shortMessage || error.message || errorMessage;
        toast.error(errorMessage, { ...toastConfig.error });
      }

      setLoading(false);
    }
  }, [isConnected, eventDetails, address, eventId, writeRefund]);

  // Loading and error states
  if (isEventError) {
    const errorMsg = eventError?.message || "Failed to load event";
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Unable to Load Event
          </h2>
          <p className="text-red-600 mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
            {parseErrorMessage(errorMsg)}
          </p>
          <button
            onClick={() => {
              refetchEvent();
              toast.success("🔄 Refreshing event data...", toastConfig.info);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading Event Details...
          </h2>
          <p className="text-gray-600">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: { fontSize: "14px" },
        }}
      />
      <EventPage
        event={eventDetails.event}
        attendees={eventDetails.attendees}
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

"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatUnits, parseUnits } from "ethers";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useBalance,
} from "wagmi";
import { getReferralTag, submitReferral } from "@divvi/referral-sdk";
import contractABI from "../../../contract/abi.json";
import EventPage from "@/components/EventPage";
import {
  erc20Abi,
  encodeFunctionData,
  encodeAbiParameters,
  createWalletClient,
  custom,
  createPublicClient,
  http,
} from "viem";
import { celo } from "viem/chains";
import { getTokenByAddress, tokenOptions } from "@/utils/tokens";

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
  minimumAge: number;
  fundsReleased: boolean;
  paymentToken: string;
}

const CONTRACT_ADDRESS = "0x43247E2EFAe25a3bBc22b255147001BadcDecfc4";
const CELO_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

// Enhanced toast configurations
const toastConfig = {
  success: {
    duration: 4000,
    icon: "✅",
    style: {
      background: "#10b981",
      color: "#fff",
      fontWeight: "500",
    },
  },
  error: {
    duration: 5000,
    icon: "❌",
    style: {
      background: "#ef4444",
      color: "#fff",
      fontWeight: "500",
    },
  },
  loading: {
    icon: "⏳",
    style: {
      background: "#3b82f6",
      color: "#fff",
      fontWeight: "500",
    },
  },
  warning: {
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "#f59e0b",
      color: "#fff",
      fontWeight: "500",
    },
  },
  info: {
    duration: 3000,
    icon: "ℹ️",
    style: {
      background: "#6366f1",
      color: "#fff",
      fontWeight: "500",
    },
  },
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
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const DIVVI_CONFIG = {
    user: address as `0x${string}`,
    consumer: "0x5e23d5Be257d9140d4C5b12654111a4D4E18D9B2" as `0x${string}`,
  };

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

  useEffect(() => {
    getUserAddress();
  }, []);

  console.log("address2", address1);

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

  const { data: tokenAllowance, refetch: refetchAllowance } = useReadContract({
    address: eventDetails?.event.paymentToken as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, CONTRACT_ADDRESS],
    query: {
      enabled:
        !!address &&
        !!eventDetails?.event.paymentToken &&
        eventDetails.event.paymentToken !== CELO_TOKEN_ADDRESS,
    },
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

  // Create public client instance
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(),
  });

  // Refetch data after successful actions
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

  console.log("eventDetails", eventDetails);

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
          minimumAge: eventData.minimumAge,
          isCanceled: eventData.isCanceled,
          fundsReleased: eventData.fundsReleased,
          paymentToken: eventData.paymentToken,
        },
        attendees: attendees || [],
        relatedEvents: relatedEvents || [],
      });
    }
  }, [rawData]);

  // Enhanced transaction status handling
  useEffect(() => {
    let toastId: string | undefined;

    if (isWriting) {
      toastId = toast.loading(
        "🔐 Please confirm the transaction in your wallet...",
        toastConfig.loading
      );
    } else if (isConfirming) {
      toastId = toast.loading(
        "⏳ Waiting for blockchain confirmation...",
        toastConfig.loading
      );
    } else if (isConfirmed) {
      toast.success("🎉 Ticket purchased successfully!", {
        ...toastConfig.success,
        duration: 5000,
      });

      // Show additional success info
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

  // Enhanced refund status handling
  useEffect(() => {
    let toastId: string | undefined;

    if (isRefundWriting) {
      toastId = toast.loading(
        "🔐 Confirming refund request...",
        toastConfig.loading
      );
    } else if (isRefundConfirming) {
      toastId = toast.loading(
        "⏳ Processing refund on blockchain...",
        toastConfig.loading
      );
    } else if (isRefundConfirmed) {
      toast.success("💰 Refund processed successfully!", {
        ...toastConfig.success,
        duration: 5000,
      });

      // Show refund details
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
    if (message.includes("Already purchased")) {
      return "You already own a ticket for this event";
    }
    if (message.includes("Event expired")) {
      return "This event has already started or ended";
    }
    if (message.includes("Event inactive")) {
      return "This event is no longer active";
    }
    if (message.includes("Event at capacity")) {
      return "Sorry, this event is sold out";
    }
    if (message.includes("Refund period ended")) {
      return "Refund period has expired for this event";
    }
    if (message.includes("No ticket purchased")) {
      return "You don't have a ticket to refund";
    }
    if (message.includes("Insufficient allowance")) {
      return "Token approval failed - please try again";
    }

    // Generic fallback
    return message.length > 100
      ? "Transaction failed - please try again"
      : message;
  };

  const reportToDivvi = async (txHash: `0x${string}`) => {
    console.log("[Divvi] Starting to report transaction:", txHash);
    try {
      const chainId = 42220;
      console.log("[Divvi] Using chainId:", chainId);
      await submitReferral({ txHash, chainId });
      console.log("[Divvi] Successfully reported transaction");
    } catch (divviError) {
      console.error("[Divvi] Reporting failed:", divviError);
      // Silent failure - don't notify user
    }
  };

  const buyTicket = useCallback(async () => {
    console.log("[Ticket] Starting ticket purchase process");

    // Validation checks with user-friendly messages
    if (!isConnected) {
      toast.error("Please connect your wallet to purchase tickets", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (!eventDetails || !address || !walletClient) {
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

    // Check if event is still valid
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

    if (eventDetails.event.isCanceled) {
      toast.error("This event has been cancelled", {
        ...toastConfig.warning,
        duration: 4000,
      });
      return;
    }

    try {
      setLoading(true);
      const mainToastId = toast.loading(
        "🎟️ Preparing your ticket purchase...",
        toastConfig.loading
      );

      const requiredAmount = eventDetails.event.ticketPrice;
      const paymentToken = eventDetails.event.paymentToken;

      const tokenInfo = getTokenByAddress(paymentToken);

      const isGdollar =
        paymentToken.toLowerCase() ===
        "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";
      const isCelo = paymentToken === CELO_TOKEN_ADDRESS;
      const isUSDT = paymentToken.toLowerCase() === USDT_ADDRESS.toLowerCase();

      console.log("Token info:", {
        paymentToken,
        symbol: tokenInfo?.symbol,
        decimals: tokenInfo?.decimals,
        requiredAmount: requiredAmount.toString(),
        isUSDT,
        isCelo,
        isGdollar,
      });

      // Check balance for native CELO
      if (isCelo) {
        toast.loading("💰 Checking your CELO balance...", { id: mainToastId });

        const balance = await publicClient.getBalance({ address });
        if (balance < requiredAmount) {
          toast.error(
            `Insufficient CELO balance. Required: ${formatUnits(
              requiredAmount,
              18
            )} CELO`,
            {
              ...toastConfig.error,
              id: mainToastId,
              duration: 6000,
            }
          );
          setLoading(false);
          return;
        }
      }

      // Get Divvi suffix
      const divviSuffix = getReferralTag(DIVVI_CONFIG);
      let hash: `0x${string}`;

      // G$ token flow
      if (isGdollar) {
        toast.loading("💵 Preparing G$ token transfer...", { id: mainToastId });

        const eventIdData = encodeAbiParameters(
          [{ type: "uint256" }],
          [eventId]
        );
        const fullData = (eventIdData +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

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
          args: [CONTRACT_ADDRESS, requiredAmount, fullData],
        });
      }
      // CELO native token flow
      else if (isCelo) {
        toast.loading("💎 Preparing CELO payment...", { id: mainToastId });

        const encodedFunction = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const dataWithDivvi = (encodedFunction +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

        toast.loading("🔐 Confirm CELO payment in your wallet...", {
          id: mainToastId,
        });

        hash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
          value: requiredAmount,
        });
      }
      // Standard ERC-20 flow (including USDT)
      else {
        // Handle token approval if needed
        if (!tokenAllowance || tokenAllowance < requiredAmount) {
          toast.loading(
            `✅ Approving ${tokenInfo?.symbol || "token"} spend...`,
            { id: mainToastId }
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

          // Wait for approval to be mined
          await publicClient.waitForTransactionReceipt({ hash: approvalHash });

          toast.success(
            `${tokenInfo?.symbol || "Token"} approved successfully!`,
            {
              ...toastConfig.success,
              duration: 2000,
            }
          );

          // Small delay before purchase
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        toast.loading(
          `💳 Preparing ${tokenInfo?.symbol || "token"} payment...`,
          { id: mainToastId }
        );

        const encodedFunction = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const dataWithDivvi = (encodedFunction +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

        toast.loading("🔐 Confirm purchase in your wallet...", {
          id: mainToastId,
        });

        hash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
          gas: BigInt(250000),
        });
      }

      toast.loading("⏳ Processing transaction...", { id: mainToastId });

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      setLoading(false);

      toast.success(
        `🎉 Ticket purchased for ${eventDetails.event.eventName}!`,
        {
          ...toastConfig.success,
          id: mainToastId,
          duration: 5000,
        }
      );

      // Show transaction hash
      setTimeout(() => {
        toast.success(`Transaction: ${hash.slice(0, 6)}...${hash.slice(-4)}`, {
          ...toastConfig.info,
          duration: 4000,
        });
      }, 1000);

      // Report to Divvi silently
      await reportToDivvi(hash);
    } catch (error: any) {
      console.error("[Ticket] Transaction failed:", error);

      let errorMessage = "Failed to purchase ticket";

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected")
      ) {
        errorMessage = "Transaction cancelled by user";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
      } else if (error.message?.includes("transfer amount exceeds balance")) {
        errorMessage = `Insufficient token} balance`;
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
      } else if (error.message?.includes("not enough allowance")) {
        errorMessage = "Token approval failed - please try again";
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
      } else if (error.message?.includes("Already purchased")) {
        errorMessage = "You already own a ticket";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else if (error.message?.includes("Event at capacity")) {
        errorMessage = "Event is sold out";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else {
        errorMessage = error.shortMessage || error.message || errorMessage;
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
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
  ]);

  const requestRefund = useCallback(async () => {
    console.log("[Refund] Starting refund process");

    // Validation checks
    if (!isConnected) {
      toast.error("Please connect your wallet to request a refund", {
        ...toastConfig.error,
        icon: "🔌",
      });
      return;
    }

    if (!eventDetails || !address || !walletClient) {
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
        toastConfig.loading
      );

      const tokenInfo = getTokenByAddress(eventDetails.event.paymentToken);
      const refundAmount = eventDetails.event.ticketPrice;

      console.log("[Refund] Starting transaction flow");

      toast.loading("📝 Preparing refund transaction...", { id: mainToastId });

      // Get Divvi data suffix
      console.log("[Refund] Generating Divvi suffix");
      const divviSuffix = getReferralTag(DIVVI_CONFIG);

      // Encode the requestRefund function call
      const encodedFunction = encodeFunctionData({
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [eventId],
      });

      // Combine with Divvi suffix
      const dataWithDivvi = (encodedFunction +
        (divviSuffix.startsWith("0x")
          ? divviSuffix.slice(2)
          : divviSuffix)) as `0x${string}`;

      toast.loading("🔐 Confirm refund request in your wallet...", {
        id: mainToastId,
      });

      // Send transaction with Divvi data
      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACT_ADDRESS,
        data: dataWithDivvi,
      });

      toast.loading("⏳ Processing refund...", { id: mainToastId });

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      setLoading(false);

      // Calculate refund amount (99% for G$, 100% for others)
      const isGdollar =
        eventDetails.event.paymentToken.toLowerCase() ===
        "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";

      const displayAmount = isGdollar
        ? formatUnits(
            (refundAmount * BigInt(99)) / BigInt(100),
            tokenInfo?.decimals || 18
          )
        : formatUnits(refundAmount, tokenInfo?.decimals || 18);

      toast.success(
        `💰 Refund of ${displayAmount} ${
          tokenInfo?.symbol || "tokens"
        } processed!`,
        {
          ...toastConfig.success,
          id: mainToastId,
          duration: 5000,
        }
      );

      // Show additional info
      setTimeout(() => {
        toast.success("Funds have been returned to your wallet", {
          ...toastConfig.info,
          duration: 3000,
        });
      }, 1000);

      // Report to Divvi
      await reportToDivvi(hash);
    } catch (error: any) {
      console.error("[Refund] Transaction failed:", error);

      let errorMessage = "Refund request failed";

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected")
      ) {
        errorMessage = "Refund request cancelled";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else if (error.message?.includes("Refund period ended")) {
        errorMessage = "Refund deadline has passed";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else if (error.message?.includes("No ticket purchased")) {
        errorMessage = "No ticket found to refund";
        toast.error(errorMessage, {
          ...toastConfig.warning,
        });
      } else if (error.message?.includes("Insufficient funds")) {
        errorMessage = "Contract has insufficient funds for refund";
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
      } else {
        errorMessage = error.shortMessage || error.message || errorMessage;
        toast.error(errorMessage, {
          ...toastConfig.error,
        });
      }

      setLoading(false);
    }
  }, [isConnected, eventDetails, address, eventId, walletClient, publicClient]);

  // Loading and error states with better UX
  if (isEventError) {
    const errorMsg = eventError?.message || "Failed to load event";
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unable to Load Event
          </h2>
          <p className="text-red-500 mb-4">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!eventDetails) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* <div className="animate-spin text-6xl mb-4">⏳</div> */}
          <h2 className="text-2xl font-bold text-gray-800">
            Loading Event Details...
          </h2>
          <p className="text-gray-600 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
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

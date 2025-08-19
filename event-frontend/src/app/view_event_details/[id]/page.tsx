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
} from "viem";
import { celoAlfajores } from "viem/chains";

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

const CONTRACT_ADDRESS = "0x68ea5654c080Ce51598D270C153B3DD262d071E9";
const CELO_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"; // Mainnet USDT

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
        chain: celoAlfajores,
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

  // Add CELO balance check
  const { data: celoBalance } = useBalance({
    address: address,
    query: { enabled: !!address },
  });

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
    query: {
      enabled:
        !!address &&
        !!eventDetails?.event.paymentToken &&
        eventDetails.event.paymentToken !== CELO_TOKEN_ADDRESS,
    },
    // query: { enabled: !!address && !!eventDetails?.event.paymentToken },
  });

  // Token allowance check
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
    // query: { enabled: !!address && !!eventDetails?.event.paymentToken },
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

  useEffect(() => {
    let toastId: string | undefined;

    if (isWriting) {
      toastId = toast.loading("Confirming transaction...");
    } else if (isConfirming) {
      toastId = toast.loading("Processing transaction...");
    } else if (isConfirmed) {
      toast.success("Ticket purchased successfully!");
    } else if (writeError) {
      toast.error(writeError.message || "Transaction failed");
    }

    return () => {
      if (toastId) toast.dismiss(toastId);
      else toast.dismiss();
    };
  }, [isWriting, isConfirming, isConfirmed, writeError]);

  // Refund status handling
  useEffect(() => {
    let toastId: string | undefined;

    if (isRefundWriting) {
      toastId = toast.loading("Confirming refund...");
    } else if (isRefundConfirming) {
      toastId = toast.loading("Processing refund...");
    } else if (isRefundConfirmed) {
      toast.success("Refund processed successfully!");
    } else if (refundWriteError) {
      toast.error(refundWriteError.message || "Refund failed");
    }

    return () => {
      if (toastId) toast.dismiss(toastId);
      else toast.dismiss();
    };
  }, [
    isRefundWriting,
    isRefundConfirming,
    isRefundConfirmed,
    refundWriteError,
  ]);

  const reportToDivvi = async (txHash: `0x${string}`) => {
    console.log("[Divvi] Starting to report transaction:", txHash);
    try {
      const chainId = 42220; // Celo mainnet
      console.log("[Divvi] Using chainId:", chainId);
      await submitReferral({ txHash, chainId });
      console.log("[Divvi] Successfully reported transaction");
    } catch (divviError) {
      console.error("[Divvi] Reporting failed:", divviError);
    }
  };

  const buyTicket = useCallback(async () => {
    console.log("[Ticket] Starting ticket purchase process");

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!eventDetails || !address || !walletClient) {
      toast.error("Wallet not properly connected");
      return;
    }

    if (eventDetails.attendees.includes(address)) {
      toast.error("You already have a ticket for this event");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Preparing transaction...");

      const requiredAmount = eventDetails.event.ticketPrice;
      const paymentToken = eventDetails.event.paymentToken;
      const isGdollar =
        paymentToken.toLowerCase() ===
        "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";
      const isCelo = paymentToken === CELO_TOKEN_ADDRESS;
      const isUSDT = [USDT_ADDRESS.toLowerCase()].includes(
        paymentToken.toLowerCase()
      );

      // Balance checks
      if (isCelo) {
        if (!celoBalance || celoBalance.value < requiredAmount) {
          toast.error("Insufficient CELO balance");
          setLoading(false);
          return;
        }
      } else if (tokenBalance !== undefined && tokenBalance < requiredAmount) {
        toast.error("Insufficient token balance");
        setLoading(false);
        return;
      }

      // Get Divvi suffix
      const divviSuffix = getReferralTag(DIVVI_CONFIG);
      let hash: `0x${string}`;

      // USDT-specific flow
      if (isUSDT) {
        toast.loading("Preparing USDT transaction...", { id: toastId });

        // 1. Reset allowance if needed
        if (tokenAllowance && tokenAllowance > BigInt(0)) {
          await write({
            address: paymentToken as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, BigInt(0)],
            gas: BigInt(100000),
          });
        }

        // 2. Set new allowance
        await write({
          address: paymentToken as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, requiredAmount],
          gas: BigInt(150000),
        });

        // 3. Verify allowance
        const newAllowance = await refetchAllowance();
        if (newAllowance.data! < requiredAmount) {
          throw new Error("USDT approval failed");
        }

        // 4. Execute purchase
        const encodedFunction = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const dataWithDivvi = (encodedFunction +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

        hash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
          gas: BigInt(300000),
        });
      }
      // G$ token flow
      else if (isGdollar) {
        toast.loading("Preparing G$ transfer...", { id: toastId });

        const eventIdData = encodeAbiParameters(
          [{ type: "uint256" }],
          [eventId]
        );
        const fullData = (eventIdData +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

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
        const encodedFunction = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const dataWithDivvi = (encodedFunction +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

        hash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
          value: requiredAmount,
        });
      }
      // Standard ERC-20 flow
      else {
        // Handle token approval if needed
        if (!tokenAllowance || tokenAllowance < requiredAmount) {
          toast.loading("Approving token spend...", { id: toastId });
          await write({
            address: paymentToken as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, requiredAmount],
            gas: BigInt(100000),
          });
        }

        const encodedFunction = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const dataWithDivvi = (encodedFunction +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;

        toast.loading("Waiting for wallet confirmation...", { id: toastId });
        hash = await walletClient.sendTransaction({
          account: address,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
          gas: BigInt(250000),
        });
      }

      setLoading(false);
      toast.success("Transaction submitted!", { id: toastId });
      await reportToDivvi(hash);
    } catch (error: any) {
      console.error("[Ticket] Transaction failed:", error);
      let errorMessage =
        error.shortMessage || error.message || "Transaction failed";

      if (error.message.includes("transfer amount exceeds balance")) {
        errorMessage = "Insufficient token balance";
      } else if (error.message.includes("not enough allowance")) {
        errorMessage = "Approval failed - please try again";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Transaction reverted - check contract status";
      }

      toast.error(errorMessage);
      setLoading(false);
    }
  }, [
    isConnected,
    eventDetails,
    address,
    eventId,
    write,
    tokenAllowance,
    walletClient,
    tokenBalance,
    celoBalance,
    refetchAllowance,
  ]);

  const requestRefund = useCallback(async () => {
    console.log("[Refund] Starting refund process");

    if (!isConnected) {
      console.log("[Refund] Wallet not connected - aborting");
      toast.error("Please connect your wallet first");
      return;
    }

    if (!eventDetails || !address || !walletClient) {
      console.log("[Refund] Missing required data - aborting", {
        eventDetails: !!eventDetails,
        address: !!address,
        walletClient: !!walletClient,
      });
      toast.error("Wallet not properly connected");
      return;
    }

    if (!eventDetails.attendees.includes(address)) {
      console.log("[Refund] User doesn't have ticket", { user: address });
      toast.error("You don't have a ticket to refund");
      return;
    }

    try {
      setLoading(true);
      console.log("[Refund] Starting transaction flow");
      const toastId = toast.loading("Preparing refund...");

      // Get Divvi data suffix
      console.log("[Refund] Generating Divvi suffix");
      const divviSuffix = getReferralTag(DIVVI_CONFIG);
      console.log("[Refund] Divvi suffix generated:", divviSuffix);

      // Encode the requestRefund function call
      console.log("[Refund] Encoding requestRefund function");
      const encodedFunction = encodeFunctionData({
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [eventId],
      });
      console.log("[Refund] Encoded function:", encodedFunction);

      // Combine with Divvi suffix
      const dataWithDivvi = (encodedFunction +
        (divviSuffix.startsWith("0x")
          ? divviSuffix.slice(2)
          : divviSuffix)) as `0x${string}`;
      console.log("[Refund] Final transaction data:", dataWithDivvi);

      toast.loading("Waiting for wallet confirmation...", { id: toastId });

      // Send transaction with Divvi data
      console.log("[Refund] Sending transaction to wallet");
      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACT_ADDRESS,
        data: dataWithDivvi,
      });
      console.log("[Refund] Transaction submitted, hash:", hash);

      setLoading(false);
      toast.success("Refund submitted!", { id: toastId });

      // Report to Divvi
      console.log("[Refund] Reporting to Divvi");
      await reportToDivvi(hash);
      console.log("[Refund] Refund process completed");
    } catch (error: any) {
      console.error("[Refund] Transaction failed:", {
        error: error.message,
        stack: error.stack,
      });
      toast.error(error.message || "Refund failed");
      setLoading(false);
    }
  }, [isConnected, eventDetails, address, eventId, walletClient]);

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

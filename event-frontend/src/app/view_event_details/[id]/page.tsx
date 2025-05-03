"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import { celoAlfajores } from "wagmi/chains";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import contractABI from "../../../contract/abi.json";
import EventPage from "@/components/EventPage";
import { encodeFunctionData, erc20Abi } from "viem";

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

const CONTRACT_ADDRESS = "0xC2fcD06C85E50afc8175A52b58699F31a3A1ED77";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [eventDetails, setEventDetails] = useState<{
    event: Event;
    attendees: string[];
    relatedEvents: Event[];
  } | null>(null);
  const { id } = useParams<{ id: string }>();
  const eventId = id ? BigInt(id) : BigInt(0);
  const { address, isConnected, chain } = useAccount();

  // Detect MiniPay on mount

  useEffect(() => {
    const checkMiniPay = async () => {
      if (typeof window !== "undefined" && window.ethereum?.isMiniPay) {
        setIsMiniPay(true);
        try {
          // Request accounts to ensure we have access
          await window.ethereum.request({ method: "eth_requestAccounts" });
          // Switch to Alfajores
          if (chain?.id !== celoAlfajores.id) {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: `0x${celoAlfajores.id.toString(16)}` }],
            });
          }
        } catch (error) {
          console.error("MiniPay setup error:", error);
          toast.error("Failed to setup MiniPay");
        }
      }
    };
    checkMiniPay();
  }, [chain]);

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

  // const buyTicket = useCallback(async () => {
  //   // Check if wallet is connected
  //   if (!isConnected && !isMiniPay) {
  //     toast.error("Please connect your wallet first");
  //     return;
  //   }

  //   if (!eventDetails || !address) {
  //     toast.error("Wallet not properly connected");
  //     return;
  //   }

  //   // Check if user already has a ticket
  //   if (eventDetails.attendees.includes(address)) {
  //     toast.error("You already have a ticket for this event");
  //     return;
  //   }

  //   // Check token balance
  //   if (
  //     tokenBalance !== undefined &&
  //     tokenBalance < eventDetails.event.ticketPrice
  //   ) {
  //     toast.error("Insufficient token balance");
  //     return;
  //   }
  //   const gasParams = isMiniPay ? { gas: BigInt(300000) } : {};

  //   try {
  //     if (isMiniPay) {
  //       // 1. Verify MiniPay is available
  //       if (!window.ethereum?.isMiniPay) {
  //         toast.error("MiniPay not detected");
  //         return;
  //       }

  //       // 2. Request accounts if needed
  //       const accounts = await window.ethereum.request({
  //         method: "eth_requestAccounts",
  //       });

  //       if (!accounts || accounts.length === 0) {
  //         toast.error("No accounts found in MiniPay");
  //         return;
  //       }

  //       // 3. Prepare transaction data
  //       const data = encodeFunctionData({
  //         abi: contractABI.abi,
  //         functionName: "buyTicket",
  //         args: [eventId],
  //       });

  //       // 4. Send transaction
  //       const txHash = await window.ethereum.request({
  //         method: "eth_sendTransaction",
  //         params: [
  //           {
  //             from: accounts[0],
  //             to: CONTRACT_ADDRESS,
  //             value: "0x0", // Must be 0 for token transfers
  //             data: data,
  //             feeCurrency: eventDetails.event.paymentToken,
  //             gas: "0x7A120", // 500,000 gas limit
  //           },
  //         ],
  //       });

  //       toast.success(`Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
  //       console.log("Transaction hash:", txHash);
  //     } else {
  //       const requiredAllowance = eventDetails.event.ticketPrice;
  //       if (!tokenAllowance || tokenAllowance < requiredAllowance) {
  //         await write({
  //           address: eventDetails.event.paymentToken as `0x${string}`,
  //           abi: erc20Abi,
  //           functionName: "approve",
  //           args: [CONTRACT_ADDRESS, requiredAllowance],
  //           ...gasParams,
  //           // gas: BigInt(300000),
  //         });
  //       }

  //       await write({
  //         address: CONTRACT_ADDRESS,
  //         abi: contractABI.abi,
  //         functionName: "buyTicket",
  //         args: [eventId],
  //         ...gasParams,
  //         // gas: BigInt(500000),
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Full error:", error);
  //     toast.error("Transaction failed");
  //   }
  // }, [
  //   isConnected,
  //   eventDetails,
  //   address,
  //   eventId,
  //   write,
  //   tokenAllowance,
  //   isMiniPay,
  // ]);

  const buyTicket = useCallback(async () => {
    if (!eventDetails || !address) {
      toast.error("Wallet not properly connected");
      return;
    }

    if (eventDetails.attendees.includes(address)) {
      toast.error("You already have a ticket for this event");
      return;
    }

    try {
      if (isMiniPay) {
        // MiniPay specific flow
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts?.[0]) {
          throw new Error("No MiniPay account available");
        }

        // For ERC20 payments, we need to:
        // 1. Approve the contract to spend tokens
        // 2. Call buyTicket
        // This might require two transactions in MiniPay

        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, eventDetails.event.ticketPrice],
        });

        // First send approval
        await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: accounts[0],
              to: eventDetails.event.paymentToken,
              data: approveData,
              feeCurrency: eventDetails.event.paymentToken,
              gas: "0x7A120",
            },
          ],
        });

        // Then buy ticket
        const buyTicketData = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "buyTicket",
          args: [eventId],
        });

        const txHash = await window.ethereum.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: accounts[0],
              to: CONTRACT_ADDRESS,
              data: buyTicketData,
              feeCurrency: eventDetails.event.paymentToken,
              gas: "0x7A120",
            },
          ],
        });

        toast.success(`Transaction sent: ${txHash.slice(0, 10)}...`);
      } else {
        // Standard wallet flow
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
      }
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(
        error instanceof Error ? error.message : "Transaction failed"
      );
    }
  }, [
    isConnected,
    eventDetails,
    address,
    eventId,
    write,
    tokenAllowance,
    isMiniPay,
  ]);

  const requestRefund = useCallback(async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!eventDetails || !address) {
      toast.error("Wallet not properly connected");
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
  }, [isConnected, eventDetails, address, eventId, writeRefund, isMiniPay]);

  // Helper function to encode transaction data
  const encodeBuyTicketData = (eventId: bigint) => {
    // This should match your contract's buyTicket function ABI
    // You might need to use viem's encodeFunctionData
    return "0x..." + eventId.toString(16).padStart(64, "0");
  };

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
        loading={loading}
        registering={isWriting || isConfirming}
        requestRefund={requestRefund}
        refunding={isRefundWriting || isRefundConfirming}
        isMiniPay={isMiniPay}
      />
    </div>
  );
}

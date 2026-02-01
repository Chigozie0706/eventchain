"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import axios from "axios";
import { EventData } from "./eventCreation/types";
import { MultiStep } from "./MultiStep";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from "wagmi";
import contractABI from "../contract/abi.json";
import {
  tokenOptions,
  normalizeAddress,
  getTokenByAddress,
} from "@/utils/tokens";

export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

const CONTRACT_ADDRESS = "0x1EdD444EA19c1F5240D771af3BeC58561934f5bC";

// Enhanced toast configurations for better UX
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

const EventForm = () => {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData>({
    eventName: "",
    eventDetails: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    eventLocation: "",
    eventPrice: "",
    minimumAge: "0",
    paymentToken: tokenOptions[0].address,
    maxCapacity: "",
    refundPolicy: "1",
    refundBufferHours: "",
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const CELO_MAINNET_CHAIN_ID = 42220;

  const [ticketCount, setTicketCount] = useState("");
  const [refundAddress, setRefundAddress] = useState("");
  const { writeContractAsync } = useWriteContract();

  // Show wallet connection prompt
  const showWalletPrompt = () => {
    toast.error("Please connect your wallet to continue", {
      ...toastConfig.error,
      icon: "🔌",
    });
  };

  const handleBuy = async () => {
    if (!address) {
      showWalletPrompt();
      return;
    }

    if (!ticketCount || parseFloat(ticketCount) <= 0) {
      toast.error("Please enter a valid ticket count", toastConfig.error);
      return;
    }

    const buyToastId = toast.loading(
      `Purchasing ${ticketCount} ticket(s)...`,
      toastConfig.loading,
    );

    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "buyTicket",
        args: [BigInt(ticketCount)],
      });

      toast.success(`🎉 Successfully purchased ${ticketCount} ticket(s)!`, {
        ...toastConfig.success,
        id: buyToastId,
      });

      // Reset ticket count
      setTicketCount("");
    } catch (err: any) {
      console.error("Ticket purchase error:", err);

      const errorMessage = err.shortMessage || err.message || "Purchase failed";

      // Enhanced error messages
      if (errorMessage.includes("insufficient")) {
        toast.error("Insufficient balance to purchase tickets", {
          ...toastConfig.error,
          id: buyToastId,
        });
      } else if (errorMessage.includes("rejected")) {
        toast.error("Transaction rejected by user", {
          ...toastConfig.warning,
          id: buyToastId,
        });
      } else {
        toast.error(`Purchase failed: ${errorMessage}`, {
          ...toastConfig.error,
          id: buyToastId,
        });
      }
    }
  };

  const handleRefund = async () => {
    if (!address) {
      showWalletPrompt();
      return;
    }

    if (!refundAddress || !refundAddress.startsWith("0x")) {
      toast.error("Please enter a valid wallet address", toastConfig.error);
      return;
    }

    const refundToastId = toast.loading(
      `Processing refund to ${refundAddress.slice(
        0,
        6,
      )}...${refundAddress.slice(-4)}`,
      toastConfig.loading,
    );

    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "refund",
        args: [refundAddress],
      });

      toast.success(
        `💰 Refund successfully sent to ${refundAddress.slice(
          0,
          6,
        )}...${refundAddress.slice(-4)}`,
        {
          ...toastConfig.success,
          id: refundToastId,
        },
      );

      // Reset refund address
      setRefundAddress("");
    } catch (err: any) {
      console.error("Refund error:", err);

      const errorMessage = err.shortMessage || err.message || "Refund failed";

      if (errorMessage.includes("No tickets")) {
        toast.error("This address has no tickets to refund", {
          ...toastConfig.error,
          id: refundToastId,
        });
      } else if (errorMessage.includes("rejected")) {
        toast.error("Transaction rejected by user", {
          ...toastConfig.warning,
          id: refundToastId,
        });
      } else {
        toast.error(`Refund failed: ${errorMessage}`, {
          ...toastConfig.error,
          id: refundToastId,
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    try {
      // Check required fields
      if (
        !eventData.eventName ||
        !eventData.eventDetails ||
        !eventData.startDate ||
        !eventData.endDate ||
        !eventData.startTime ||
        !eventData.endTime ||
        !eventData.eventLocation ||
        !eventData.eventPrice
      ) {
        throw new Error("Please fill in all required fields");
      }

      // Check if image is uploaded
      if (!file) {
        throw new Error("Please upload an event image");
      }

      // Validate dates
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`,
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      if (startDateTime.getTime() < Date.now()) {
        throw new Error("The event must start in the future");
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new Error("End date/time must be after start date/time");
      }

      // Validate price
      const price = parseFloat(eventData.eventPrice);
      if (isNaN(price))
        throw new Error("Please enter a valid number for price");
      if (price <= 0) throw new Error("Price must be greater than 0");
      if (price > 1000000) throw new Error("Price seems unusually high");

      // Validate token
      if (
        !tokenOptions.some((token) => token.address === eventData.paymentToken)
      ) {
        throw new Error("Selected payment token is not supported");
      }

      // Validate age
      const minAge = parseInt(eventData.minimumAge);
      if (isNaN(minAge) || minAge < 0 || minAge > 120) {
        throw new Error("Please enter a valid minimum age (0-120)");
      }

      return true;
    } catch (error: any) {
      toast.error(error.message, {
        ...toastConfig.error,
        icon: "⚠️",
      });
      return false;
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newToken = e.target.value;
    setEventData({ ...eventData, paymentToken: newToken });

    const token = getTokenByAddress(newToken);
    if (token) {
      toast.success(`Payment token changed to ${token.symbol}`, {
        ...toastConfig.info,
        duration: 2000,
      });
    }
  };

  const handleFileChange = (
    fileOrEvent: File | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError(null);
    let selectedFile: File | null = null;

    if (fileOrEvent instanceof File) {
      selectedFile = fileOrEvent;
    } else if (fileOrEvent.target.files?.[0]) {
      selectedFile = fileOrEvent.target.files[0];
    }

    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      const errorMsg = "Only image files are allowed (JPG, PNG, GIF, etc.)";
      setError(errorMsg);
      toast.error(errorMsg, toastConfig.error);
      return;
    }

    // Validate file size
    if (selectedFile.size > 10 * 1024 * 1024) {
      const errorMsg = "File size must be less than 10MB";
      setError(errorMsg);
      toast.error(errorMsg, toastConfig.error);
      return;
    }

    setFile(selectedFile);

    // Show success message
    toast.success(`Image "${selectedFile.name}" selected successfully`, {
      ...toastConfig.success,
      duration: 2000,
      icon: "🖼️",
    });

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    const uploadToastId = toast.loading(
      "Uploading image to IPFS...",
      toastConfig.loading,
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "pinataMetadata",
        JSON.stringify({ name: `event-image-${Date.now()}` }),
      );

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error("Failed to upload image to IPFS");
      }

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;

      toast.success("Image uploaded to IPFS successfully", {
        ...toastConfig.success,
        id: uploadToastId,
      });

      return ipfsUrl;
    } catch (error: any) {
      console.error("IPFS upload error:", error);

      toast.error("Failed to upload image. Please try again.", {
        ...toastConfig.error,
        id: uploadToastId,
      });

      throw error;
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const createEvent = async () => {
    // Validate form first
    if (!validateForm()) return;

    // Check wallet connection
    if (!address) {
      showWalletPrompt();
      return;
    }

    // Check if on correct network

    // if (chainId !== CELO_MAINNET_CHAIN_ID) {
    //   toast.error("Please switch to Celo network", {
    //     ...toastConfig.error,
    //     icon: "🔗",
    //   });

    //   try {
    //     // await switchChain({ chainId: CELO_MAINNET_CHAIN_ID });
    //     toast.success("Switched to Celo network", {
    //       ...toastConfig.success,
    //       duration: 2000,
    //     });
    //   } catch (error) {
    //     console.error("Failed to switch network:", error);
    //     toast.error(
    //       "Failed to switch to Celo. Please switch manually in your wallet.",
    //       {
    //         ...toastConfig.error,
    //         duration: 5000,
    //       },
    //     );
    //     return;
    //   }
    // }

    const mainToastId = toast.loading(
      "Preparing your event...",
      toastConfig.loading,
    );

    try {
      setLoading(true);

      // Step 1: Upload image to IPFS
      toast.loading("📤 Uploading image to IPFS...", {
        ...toastConfig.loading,
        id: mainToastId,
      });

      const imageUrl = await uploadToIPFS(file!);
      const ipfsHash = imageUrl.split("/").pop() || "";

      // Step 2: Prepare transaction data
      toast.loading("📝 Preparing transaction data...", {
        ...toastConfig.loading,
        id: mainToastId,
      });

      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`,
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      const minimumAge = BigInt(eventData.minimumAge);
      const startDate = BigInt(Math.floor(startDateTime.getTime() / 1000));
      const endDate = BigInt(Math.floor(endDateTime.getTime() / 1000));
      const startTime = BigInt(
        startDateTime.getHours() * 3600 + startDateTime.getMinutes() * 60,
      );
      const endTime = BigInt(
        endDateTime.getHours() * 3600 + endDateTime.getMinutes() * 60,
      );

      const selectedToken = getTokenByAddress(eventData.paymentToken);
      const decimals = selectedToken?.decimals || 18;
      const priceInWei = parseUnits(eventData.eventPrice, decimals);

      const normalizedPaymentToken = normalizeAddress(eventData.paymentToken);

      const maxCapacity = BigInt(eventData.maxCapacity);
      const refundPolicy = BigInt(eventData.refundPolicy || "1");

      let refundBufferHours = BigInt(0);
      if (eventData.refundPolicy === "2" && eventData.refundBufferHours) {
        refundBufferHours = BigInt(eventData.refundBufferHours);
      }

      console.log("Creating event with:", {
        token: selectedToken?.symbol,
        decimals: decimals,
        price: eventData.eventPrice,
        priceInWei: priceInWei.toString(),
      });

      // Step 3: Send transaction
      toast.loading("🔐 Please confirm transaction in your wallet...", {
        ...toastConfig.loading,
        id: mainToastId,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "createEvent",
        args: [
          eventData.eventName,
          ipfsHash,
          eventData.eventDetails,
          startDate,
          endDate,
          startTime,
          endTime,
          eventData.eventLocation,
          priceInWei,
          minimumAge,
          maxCapacity,
          refundPolicy,
          refundBufferHours,
          normalizedPaymentToken,
        ],
        gas: BigInt(1_000_000),
        // chainId: CELO_MAINNET_CHAIN_ID,
      });

      setTxHash(hash);

      // Step 4: Wait for confirmation
      toast.loading("⏳ Waiting for blockchain confirmation...", {
        ...toastConfig.loading,
        id: mainToastId,
      });

      // Success!
      toast.success(`🎉 Event "${eventData.eventName}" created successfully!`, {
        ...toastConfig.success,
        id: mainToastId,
        duration: 5000,
      });

      // Show additional info toast
      setTimeout(() => {
        toast.success("Redirecting to events page...", {
          ...toastConfig.info,
          duration: 2000,
        });
      }, 1000);

      // Reset form
      setEventData({
        eventName: "",
        eventDetails: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        eventLocation: "",
        eventPrice: "",
        paymentToken: tokenOptions[0].address,
        minimumAge: "0",
        maxCapacity: "",
        refundPolicy: "1",
        refundBufferHours: "",
      });
      setFile(null);
      setPreview(null);

      // Redirect after delay
      setTimeout(() => {
        router.push("/view_events");
      }, 2000);
    } catch (error: any) {
      console.error("Event creation failed:", error);

      let errorMessage = "Failed to create event";

      // Parse different error types
      if (error.message?.includes("User rejected")) {
        errorMessage = "Transaction was rejected";
        toast.error(errorMessage, {
          ...toastConfig.warning,
          id: mainToastId,
        });
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
        toast.error(errorMessage, {
          ...toastConfig.error,
          id: mainToastId,
        });
      } else if (error.message?.includes("IPFS")) {
        errorMessage = "Failed to upload image. Please try again.";
        toast.error(errorMessage, {
          ...toastConfig.error,
          id: mainToastId,
        });
      } else {
        errorMessage =
          error.shortMessage || error.message || "Unknown error occurred";
        toast.error(errorMessage, {
          ...toastConfig.error,
          id: mainToastId,
        });
      }

      // Show support message for persistent errors
      if (error.message && !error.message.includes("rejected")) {
        setTimeout(() => {
          toast.error("Need help? Contact support with your error details", {
            ...toastConfig.info,
            duration: 4000,
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg my-20">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Create Your Event
        </h2>

        <MultiStep
          eventData={eventData}
          setEventData={setEventData}
          file={file}
          setFile={setFile}
          preview={preview}
          setPreview={setPreview}
          error={error}
          setError={setError}
          handleFileChange={handleFileChange}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          handleTokenChange={handleTokenChange}
          tokenOptions={tokenOptions}
          createEvent={createEvent}
          loading={loading}
        />
      </div>
    </>
  );
};

export default EventForm;

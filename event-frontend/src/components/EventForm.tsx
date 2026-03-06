"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import axios from "axios";
import { EventData } from "./eventCreation/types";
import { MultiStep } from "./MultiStep";

import {
  useAccount,
  useWriteContract,
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

const CONTRACT_ADDRESS = "0xb9AD5b51fD436b0884A51259E351BA10f913Ef8d";

// Toast styles aligned with Dark Emerald theme
const toastConfig = {
  success: {
    duration: 4000,
    icon: "✅",
    style: {
      background: "#0C1A2E",
      color: "#4DDBA0",
      fontWeight: "500",
      border: "1px solid rgba(53,208,127,0.3)",
    },
  },
  error: {
    duration: 5000,
    icon: "❌",
    style: {
      background: "#0C1A2E",
      color: "#F87171",
      fontWeight: "500",
      border: "1px solid rgba(248,113,113,0.3)",
    },
  },
  loading: {
    icon: "⏳",
    style: {
      background: "#0C1A2E",
      color: "#F8FAFC",
      fontWeight: "500",
      border: "1px solid rgba(53,208,127,0.15)",
    },
  },
  warning: {
    duration: 4000,
    icon: "⚠️",
    style: {
      background: "#0C1A2E",
      color: "#FBBF24",
      fontWeight: "500",
      border: "1px solid rgba(251,191,36,0.3)",
    },
  },
  info: {
    duration: 3000,
    icon: "ℹ️",
    style: {
      background: "#0C1A2E",
      color: "#67E8F9",
      fontWeight: "500",
      border: "1px solid rgba(34,211,238,0.25)",
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
    category: "0",
    subcategory: "",
  });

  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const showWalletPrompt = () =>
    toast.error("Please connect your wallet to continue", {
      ...toastConfig.error,
      icon: "🔌",
    });

  const validateForm = () => {
    try {
      if (
        !eventData.eventName ||
        !eventData.eventDetails ||
        !eventData.startDate ||
        !eventData.endDate ||
        !eventData.startTime ||
        !eventData.endTime ||
        !eventData.eventLocation ||
        !eventData.eventPrice
      )
        throw new Error("Please fill in all required fields");

      if (!file) throw new Error("Please upload an event image");

      const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const end = new Date(`${eventData.endDate}T${eventData.endTime}`);

      if (start.getTime() < Date.now())
        throw new Error("The event must start in the future");
      if (end.getTime() <= start.getTime())
        throw new Error("End date/time must be after start");

      const price = parseFloat(eventData.eventPrice);
      if (isNaN(price)) throw new Error("Please enter a valid price");
      if (price <= 0) throw new Error("Price must be greater than 0");
      if (price > 1000000) throw new Error("Price seems unusually high");

      if (!tokenOptions.some((t) => t.address === eventData.paymentToken))
        throw new Error("Selected payment token is not supported");

      const minAge = parseInt(eventData.minimumAge);
      if (isNaN(minAge) || minAge < 0 || minAge > 120)
        throw new Error("Please enter a valid minimum age (0–120)");

      if (!eventData.subcategory)
        throw new Error("Please select a subcategory for your event");

      return true;
    } catch (err: any) {
      toast.error(err.message, { ...toastConfig.error, icon: "⚠️" });
      return false;
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newToken = e.target.value;
    setEventData({ ...eventData, paymentToken: newToken });
    const token = getTokenByAddress(newToken);
    if (token)
      toast.success(`Payment token → ${token.symbol}`, {
        ...toastConfig.info,
        duration: 2000,
      });
  };

  const handleFileChange = (
    fileOrEvent: File | React.ChangeEvent<HTMLInputElement>,
  ) => {
    setError(null);
    let selectedFile: File | null = null;

    if (fileOrEvent instanceof File) selectedFile = fileOrEvent;
    else if (fileOrEvent.target.files?.[0])
      selectedFile = fileOrEvent.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      const msg = "Only image files are allowed (JPG, PNG, GIF, etc.)";
      setError(msg);
      toast.error(msg, toastConfig.error);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      const msg = "File size must be less than 10MB";
      setError(msg);
      toast.error(msg, toastConfig.error);
      return;
    }

    setFile(selectedFile);
    toast.success(`Image "${selectedFile.name}" selected`, {
      ...toastConfig.success,
      duration: 2000,
      icon: "🖼️",
    });

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    const id = toast.loading("Uploading image to IPFS…", toastConfig.loading);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "pinataMetadata",
        JSON.stringify({ name: `event-image-${Date.now()}` }),
      );

      const imgRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        },
      );
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imgRes.data.IpfsHash}`;

      const metaRes = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          image: imageUrl,
          subcategory: eventData.subcategory,
          category: eventData.category,
          createdAt: new Date().toISOString(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
          },
        },
      );

      toast.success("Image uploaded successfully", {
        ...toastConfig.success,
        id,
      });
      return `https://gateway.pinata.cloud/ipfs/${metaRes.data.IpfsHash}`;
    } catch (err: any) {
      toast.error("Failed to upload image. Please try again.", {
        ...toastConfig.error,
        id,
      });
      throw err;
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
    },
    [handleFileChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const createEvent = async () => {
    if (!validateForm()) return;
    if (!address) {
      showWalletPrompt();
      return;
    }

    const mainId = toast.loading("Preparing your event…", toastConfig.loading);
    try {
      setLoading(true);

      toast.loading("📤 Uploading image to IPFS…", {
        ...toastConfig.loading,
        id: mainId,
      });
      const imageUrl = await uploadToIPFS(file!);

      toast.loading("📝 Preparing transaction…", {
        ...toastConfig.loading,
        id: mainId,
      });

      const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const end = new Date(`${eventData.endDate}T${eventData.endTime}`);
      const token = getTokenByAddress(eventData.paymentToken);
      const decimals = token?.decimals || 18;

      const category = parseInt(eventData.category);
      if (isNaN(category) || category < 0 || category > 8)
        throw new Error("Please select a valid event category");

      let refundBufferHours = BigInt(0);
      if (eventData.refundPolicy === "2" && eventData.refundBufferHours)
        refundBufferHours = BigInt(eventData.refundBufferHours);

      toast.loading("🔐 Please confirm in your wallet…", {
        ...toastConfig.loading,
        id: mainId,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "createEvent",
        args: [
          eventData.eventName,
          imageUrl,
          eventData.eventDetails,
          BigInt(Math.floor(start.getTime() / 1000)),
          BigInt(Math.floor(end.getTime() / 1000)),
          BigInt(start.getHours() * 3600 + start.getMinutes() * 60),
          BigInt(end.getHours() * 3600 + end.getMinutes() * 60),
          eventData.eventLocation,
          parseUnits(eventData.eventPrice, decimals),
          BigInt(eventData.minimumAge),
          BigInt(eventData.maxCapacity),
          BigInt(eventData.refundPolicy || "1"),
          refundBufferHours,
          normalizeAddress(eventData.paymentToken),
          BigInt(eventData.category),
        ],
        gas: BigInt(1_000_000),
      });

      setTxHash(hash);

      toast.loading("⏳ Waiting for confirmation…", {
        ...toastConfig.loading,
        id: mainId,
      });
      toast.success(`🎉 "${eventData.eventName}" created!`, {
        ...toastConfig.success,
        id: mainId,
        duration: 5000,
      });

      setTimeout(
        () =>
          toast.success("Redirecting…", {
            ...toastConfig.info,
            duration: 2000,
          }),
        1000,
      );

      // Reset
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
        category: "0",
        subcategory: "",
      });
      setFile(null);
      setPreview(null);
      setTimeout(() => router.push("/view_events"), 2000);
    } catch (err: any) {
      console.error("Event creation failed:", err);
      const msg = err.message?.includes("User rejected")
        ? "Transaction was rejected"
        : err.message?.includes("insufficient funds")
          ? "Insufficient funds for gas"
          : err.message?.includes("IPFS")
            ? "Failed to upload image. Please try again."
            : err.shortMessage || err.message || "Unknown error occurred";

      const isRejection = err.message?.includes("rejected");
      toast.error(msg, {
        ...(isRejection ? toastConfig.warning : toastConfig.error),
        id: mainId,
      });

      if (!isRejection) {
        setTimeout(
          () =>
            toast.error("Need help? Contact support with your error details", {
              ...toastConfig.info,
              duration: 4000,
            }),
          1000,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // EventForm is now just a passthrough — MultiStep owns the full page layout
  return (
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
  );
};

export default EventForm;

"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import axios from "axios";
import MapView from "./MapView";
// import Home from "./AutoPlace";
import GoogleMapWithSearch from "./AutoPlace";
import { MultiStep } from "./MultiStep";

import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";
import { getReferralTag, submitReferral } from "@divvi/referral-sdk";
import contractABI from "../contract/abi.json";
import { encodeFunctionData } from "viem";
import { celo } from "viem/chains";
import { tokenOptions, normalizeAddress } from "@/utils/tokens";

interface EventData {
  eventName: string;
  eventDetails: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventLocation: string;
  eventPrice: string;
  minimumAge: string;
  paymentToken: string;
}

interface Address {
  streetAndNumber: string;
  place: string;
  region: string;
  postcode: string;
  country: string;
  latitude: string | number; // Can be string or number depending on your needs
  longitude: string | number; // Can be string or number depending on your needs
}

export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

const CONTRACT_ADDRESS = "0x2FE3B8dd920C6b0cE4bA6495C39552904Cf30D28";

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
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const DIVVI_CONFIG = {
    user: address as `0x${string}`,
    consumer: "0x5e23d5Be257d9140d4C5b12654111a4D4E18D9B2" as `0x${string}`,
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

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
      ) {
        throw new Error("Please fill in all required fields");
      }

      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      if (startDateTime.getTime() < Date.now()) {
        throw new Error("The event must start in the future");
      }

      if (endDateTime.getTime() <= startDateTime.getTime()) {
        throw new Error("End date/time must be after start date/time");
      }

      const price = parseFloat(eventData.eventPrice);
      if (isNaN(price))
        throw new Error("Please enter a valid number for price");
      if (price <= 0) throw new Error("Price must be greater than 0");

      if (
        !tokenOptions.some((token) => token.address === eventData.paymentToken)
      ) {
        throw new Error("Selected payment token is not supported");
      }

      const minAge = parseInt(eventData.minimumAge);
      if (isNaN(minAge) || minAge < 0 || minAge > 120) {
        throw new Error("Please enter a valid minimum age (0-120)");
      }

      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventData({ ...eventData, paymentToken: e.target.value });
  };

  const handleFileChange = (
    fileOrEvent: File | React.ChangeEvent<HTMLInputElement>
  ) => {
    setError(null);
    let selectedFile: File | null = null;

    if (fileOrEvent instanceof File) {
      selectedFile = fileOrEvent;
    } else if (fileOrEvent.target.files?.[0]) {
      selectedFile = fileOrEvent.target.files[0];
    }

    if (!selectedFile) return;

    // Rest of your validation logic...
    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "pinataMetadata",
      JSON.stringify({ name: `event-image-${Date.now()}` })
    );

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to upload image");
    }

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const createEvent = async () => {
    if (!validateForm()) return;
    if (!address || !walletClient) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Creating event...");

      // Upload image to IPFS
      const imageUrl = await uploadToIPFS(file!);
      const ipfsHash = imageUrl.split("/").pop() || "";

      // Prepare transaction data
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);

      const minimumAge = BigInt(eventData.minimumAge);
      const startDate = BigInt(Math.floor(startDateTime.getTime() / 1000));
      const endDate = BigInt(Math.floor(endDateTime.getTime() / 1000));
      const startTime = BigInt(
        startDateTime.getHours() * 3600 + startDateTime.getMinutes() * 60
      );
      const endTime = BigInt(
        endDateTime.getHours() * 3600 + endDateTime.getMinutes() * 60
      );

      // Get the selected token to check decimals
      const selectedToken = tokenOptions.find(
        (token) => token.address === eventData.paymentToken.toLowerCase()
      );

      // Use correct decimals for the token
      const decimals = selectedToken?.decimals || 18;
      const priceInWei = parseUnits(eventData.eventPrice, decimals);

      // const priceInWei = parseUnits(eventData.eventPrice, 18);

      // Get Divvi data suffix
      const divviSuffix = getReferralTag(DIVVI_CONFIG);

      // const paymentTokenAddress = eventData.paymentToken;

      const normalizedPaymentToken = normalizeAddress(eventData.paymentToken);

      // Encode contract function call
      const encodedFunction = encodeFunctionData({
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
          normalizedPaymentToken,
          // eventData.paymentToken.toLowerCase(), // Ensure lowercase for comparison
        ],
      });

      // Combine with Divvi suffix
      const dataWithDivvi = (encodedFunction +
        (divviSuffix.startsWith("0x")
          ? divviSuffix.slice(2)
          : divviSuffix)) as `0x${string}`;

      // Send transaction with sufficient gas
      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACT_ADDRESS,
        data: dataWithDivvi,
        gas: BigInt(1_000_000),
      });

      setTxHash(hash);
      toast.loading("Processing transaction...", { id: toastId });

      // Report to Divvi
      await reportToDivvi(hash);

      toast.success("Event created successfully!", { id: toastId });

      // Reset form and redirect
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
      });

      router.push("/view_events");
    } catch (error: any) {
      console.error("Event creation failed:", error);
      toast.error(
        error.shortMessage || error.message || "Failed to create event"
      );
    } finally {
      setLoading(false);
    }
  };

  const reportToDivvi = async (txHash: `0x${string}`) => {
    console.log("[DEBUG] Starting reportToDivvi with hash:", txHash);
    try {
      const chainId = 42220; // Celo mainnet
      console.log("[DEBUG] Submitting to Divvi with chainId:", chainId);
      await submitReferral({ txHash, chainId });
      console.log("[DEBUG] Successfully reported to Divvi");
    } catch (divviError) {
      console.error("[ERROR] Divvi reporting failed:", {
        error: divviError,
        txHash,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const [address1, setAddress1] = useState<Address>({
    streetAndNumber: "",
    place: "",
    region: "",
    postcode: "",
    country: "",
    latitude: "",
    longitude: "",
  });

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (address1.streetAndNumber) {
      console.log("Selected address:", address1);
    }
  };

  const updateCoordinates = (
    latitude: string | number,
    longitude: string | number
  ) => {
    setAddress1({ ...address1, latitude, longitude });
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

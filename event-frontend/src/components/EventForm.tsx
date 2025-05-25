"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { parseUnits } from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWalletClient,
} from "wagmi";
import { getDataSuffix, submitReferral } from "@divvi/referral-sdk";
import contractABI from "../contract/abi.json";
import { encodeFunctionData } from "viem";

interface EventData {
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventLocation: string;
  eventPrice: string;
  paymentToken: string;
}

const CONTRACT_ADDRESS = "0x2A668c6A60dAe7B9cBBFB1d580cEcd0eB47e4132";

const tokenOptions1 = [
  { symbol: "cUSD", address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" },
  { symbol: "cEUR", address: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F" },
  { symbol: "cREAL", address: "0xE4D517785D091D3c54818832dB6094bcc2744545" },
];

const tokenOptions = [
  { symbol: "cUSD", address: "0x765de816845861e75a25fca122bb6898b8b1282a" },
  { symbol: "cEUR", address: "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73" },
  { symbol: "cREAL", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" },
];

const DIVVI_CONFIG = {
  consumer: "0x5e23d5Be257d9140d4C5b12654111a4D4E18D9B2" as `0x${string}`,
  providers: [
    "0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8",
    "0x0423189886d7966f0dd7e7d256898daeee625dca",
    "0xc95876688026be9d6fa7a7c33328bd013effa2bb",
    "0x6226dde08402642964f9a6de844ea3116f0dfc7e",
  ] as `0x${string}`[],
};

const EventForm = () => {
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData>({
    eventName: "",
    eventCardImgUrl: "",
    eventDetails: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    eventLocation: "",
    eventPrice: "",
    paymentToken: tokenOptions[0].address,
  });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

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

      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventData({ ...eventData, paymentToken: e.target.value });
  };

  const createEvent = async () => {
    console.log("[DEBUG] Starting createEvent function");
    if (!validateForm()) {
      console.log("[DEBUG] Form validation failed");
      return;
    }

    if (!address || !walletClient) {
      console.log(
        "[DEBUG] Wallet not connected - address:",
        address,
        "walletClient:",
        walletClient
      );
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setLoading(true);
      const toastId = toast.loading("Preparing transaction...");
      console.log("[DEBUG] Loading state set to true");

      // Prepare transaction data
      console.log("[DEBUG] Preparing date/time values");
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);
      console.log(
        "[DEBUG] Date objects created - start:",
        startDateTime,
        "end:",
        endDateTime
      );

      const startDate = BigInt(Math.floor(startDateTime.getTime() / 1000));
      const endDate = BigInt(Math.floor(endDateTime.getTime() / 1000));
      const startTime = BigInt(
        startDateTime.getHours() * 3600 + startDateTime.getMinutes() * 60
      );
      const endTime = BigInt(
        endDateTime.getHours() * 3600 + endDateTime.getMinutes() * 60
      );
      console.log(
        "[DEBUG] Converted to Unix timestamps - startDate:",
        startDate,
        "endDate:",
        endDate,
        "startTime:",
        startTime,
        "endTime:",
        endTime
      );

      console.log("[DEBUG] Parsing price:", eventData.eventPrice);
      const priceInWei = parseUnits(eventData.eventPrice, 18);
      console.log("[DEBUG] Price in wei:", priceInWei.toString());

      // Get Divvi data suffix
      console.log("[DEBUG] Generating Divvi suffix with config:", DIVVI_CONFIG);
      const divviSuffix = getDataSuffix(DIVVI_CONFIG);
      console.log("[DEBUG] Divvi suffix generated:", divviSuffix);

      // Encode contract function call
      console.log("[DEBUG] Encoding function with ABI and args:", {
        eventName: eventData.eventName,
        eventCardImgUrl: eventData.eventCardImgUrl,
        eventDetails: eventData.eventDetails,
        startDate,
        endDate,
        startTime,
        endTime,
        eventLocation: eventData.eventLocation,
        priceInWei,
        paymentToken: eventData.paymentToken,
      });

      const encodedFunction = encodeFunctionData({
        abi: contractABI.abi,
        functionName: "createEvent",
        args: [
          eventData.eventName,
          eventData.eventCardImgUrl,
          eventData.eventDetails,
          startDate,
          endDate,
          startTime,
          endTime,
          eventData.eventLocation,
          priceInWei,
          eventData.paymentToken,
        ],
      });
      console.log("[DEBUG] Encoded function data:", encodedFunction);

      // Combine with Divvi suffix
      const dataWithDivvi = (encodedFunction +
        (divviSuffix.startsWith("0x")
          ? divviSuffix.slice(2)
          : divviSuffix)) as `0x${string}`;
      console.log("[DEBUG] Combined data with Divvi suffix:", dataWithDivvi);

      toast.loading("Waiting for wallet confirmation...", { id: toastId });
      console.log("[DEBUG] Sending transaction...");

      // Send transaction
      const hash = await walletClient.sendTransaction({
        account: address,
        to: CONTRACT_ADDRESS,
        data: dataWithDivvi,
      });
      console.log("[DEBUG] Transaction sent, hash:", hash);

      setTxHash(hash);
      toast.loading("Processing transaction...", { id: toastId });
      console.log("[DEBUG] Transaction hash set:", hash);

      // Report to Divvi
      console.log("[DEBUG] Reporting to Divvi with hash:", hash);
      await reportToDivvi(hash);
      console.log("[DEBUG] Successfully reported to Divvi");

      // Success
      toast.success("Event created successfully!", { id: toastId });
      setLoading(false);
      console.log("[DEBUG] Loading state set to false after success");

      // Reset form and redirect

      setEventData({
        eventName: "",
        eventCardImgUrl: "",
        eventDetails: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        eventLocation: "",
        eventPrice: "",
        paymentToken: tokenOptions[0].address,
      });

      console.log("[DEBUG] Redirecting to /view_events");
      router.push("/view_events");
    } catch (error: any) {
      console.error("[ERROR] Event creation failed:", {
        error: error.message,
        stack: error.stack,
        eventData,
        timestamp: new Date().toISOString(),
      });
      toast.dismiss();
      toast.error(error.message || "Failed to create event");
      setLoading(false);
      console.log("[DEBUG] Loading state set to false after error");
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

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg my-20">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Create Your Event
      </h2>

      {/* Form fields (same as your existing JSX) */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Event Title *
        </label>
        <input
          type="text"
          name="eventName"
          value={eventData.eventName}
          onChange={handleChange}
          placeholder="Enter event title"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Event Card Image */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Event Image URL *
        </label>
        <input
          type="text"
          name="eventCardImgUrl"
          value={eventData.eventCardImgUrl}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Event Details */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Event Description *
        </label>
        <textarea
          name="eventDetails"
          value={eventData.eventDetails}
          onChange={handleChange}
          placeholder="Enter event description"
          rows={4}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      {/* Start Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Start Date *
        </label>
        <input
          type="date"
          name="startDate"
          value={eventData.startDate}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* End Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          End Date *
        </label>
        <input
          type="date"
          name="endDate"
          value={eventData.endDate}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Start & End Time */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Start Time *
          </label>
          <input
            type="time"
            name="startTime"
            value={eventData.startTime}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            End Time *
          </label>
          <input
            type="time"
            name="endTime"
            value={eventData.endTime}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
          />
        </div>
      </div>

      {/* Event Location */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Location *
        </label>
        <input
          type="text"
          name="eventLocation"
          value={eventData.eventLocation}
          onChange={handleChange}
          placeholder="Enter event location"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>

      {/* Select Payment Token */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium text-sm mb-2">
          Payment Token (cUSD, cEUR, cREAL)*
        </label>
        <select
          name="paymentToken"
          value={eventData.paymentToken}
          onChange={handleTokenChange}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        >
          <option value="" disabled>
            Select a payment token
          </option>
          {tokenOptions.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Event Price */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Ticket Price *
        </label>
        <input
          type="number"
          name="eventPrice"
          value={eventData.eventPrice}
          onChange={handleChange}
          placeholder="Enter ticket price"
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
        />
      </div>
      <button
        className="w-full bg-orange-700 text-white p-3 rounded-lg font-semibold hover:bg-orange-800 transition"
        onClick={createEvent}
        disabled={loading}
      >
        {loading ? "Processing..." : "Create Event"}
      </button>
    </div>
  );
};

export default EventForm;

import { useState } from "react";
import { useContract } from "../context/ContractContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // For App Router

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

const EventForm: React.FC = () => {
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
    paymentToken: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  });

  const { contract, connectWallet } = useContract();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tokenOptions = [
    { symbol: "cUSD", address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" },
    { symbol: "cEUR", address: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F" },
    { symbol: "cCOP", address: "0xE4D517785D091D3c54818832dB6094bcc2744545" },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventData({ ...eventData, paymentToken: e.target.value });
  };

  // Validate form fields
  const validateForm = () => {
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
      toast.error("Please fill in all required fields.");
      return false;
    }

    // Ensure start date is in the future
    const startTimestamp = new Date(eventData.startDate).getTime();
    if (startTimestamp < Date.now()) {
      toast.error("The start date must be in the future.");
      return false;
    }

    // Ensure end date is after start date
    const endTimestamp = new Date(eventData.endDate).getTime();
    if (endTimestamp <= startTimestamp) {
      toast.error("End date must be after the start date.");
      return false;
    }

    const price = parseFloat(eventData.eventPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price in cUSD.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    // Check if all required fields are filled
    if (!validateForm()) return;

    // Ensure the selected payment token is supported
    const isTokenSupported = tokenOptions.some(
      (token) => token.address === eventData.paymentToken
    );

    if (!isTokenSupported) {
      toast.error("Selected payment token is not supported.");
      return;
    }

    // Proceed with event creation
    setLoading(true);

    try {
      let activeContract = contract;

      // Connect wallet if not already connected
      if (!activeContract) {
        activeContract = await connectWallet();
      }

      if (!activeContract) {
        toast.error("Failed to connect to the contract. Please try again.");
        setLoading(false);
        return;
      }

      // Convert timestamps to Unix format
      const startDate = Math.floor(
        new Date(eventData.startDate).getTime() / 1000
      );

      const endDate = Math.floor(
        new Date(eventData.startDate).getTime() / 1000
      );

      const startTime = Math.floor(
        new Date(`${eventData.startDate}T${eventData.startTime}`).getTime() /
          1000
      );
      const endTime = Math.floor(
        new Date(`${eventData.startDate}T${eventData.endTime}`).getTime() / 1000
      );

      // Convert ticket price to wei
      const priceInWei = (parseFloat(eventData.eventPrice) * 1e18).toString();

      // Send transaction to create event
      const tx = await activeContract.createEvent(
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
        { gasLimit: 5000000 } // Increase gas limit
      );

      await tx.wait();
      toast.success("Event successfully created!");

      // Reset form
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
        paymentToken: "",
      });

      // Redirect to view events page
      router.push("/view_events");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg my-20">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Create Your Event
      </h2>

      {/* Event Title */}
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
          Payment Token *
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
          Ticket Price (cUSD, cEUR, cCOP)*
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

      {/* Submit Button */}
      <button
        className="w-full bg-orange-700 text-white p-3 rounded-lg font-semibold hover:bg-orange-800 transition"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Creating Event..." : "Create Event"}
      </button>
    </div>
  );
};

export default EventForm;

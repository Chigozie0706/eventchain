import { useState } from "react";
import { useContract } from "../context/ContractContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation"; // For App Router

interface EventData {
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  eventDate: string;
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
    eventDate: "",
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
    console.log(eventData);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventData({ ...eventData, paymentToken: e.target.value });

    console.log(eventData);
  };

  // Validate form fields
  const validateForm = () => {
    if (
      !eventData.eventName ||
      !eventData.eventDetails ||
      !eventData.eventDate ||
      !eventData.startTime ||
      !eventData.endTime ||
      !eventData.eventLocation ||
      !eventData.eventPrice
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }

    // Validate event date (must be in the future)
    const eventTimestamp = new Date(eventData.eventDate).getTime();
    if (eventTimestamp < Date.now()) {
      toast.error("The event date must be in the future.");
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

  // const handleSubmit = async () => {
  //   if (!validateForm()) return;

  //   if (!contract) {
  //     console.error("Contract not found");
  //     toast.error("Contract not found");

  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     setSuccess(null);
  //     setError(null);

  //     // Convert time strings to UNIX timestamps
  //     const eventDate = Math.floor(
  //       new Date(eventData.eventDate).getTime() / 1000
  //     );
  //     const startTime = Math.floor(
  //       new Date(`${eventData.eventDate}T${eventData.startTime}`).getTime() /
  //         1000
  //     );
  //     const endTime = Math.floor(
  //       new Date(`${eventData.eventDate}T${eventData.endTime}`).getTime() / 1000
  //     );

  //     const priceInWei = (parseFloat(eventData.eventPrice) * 1e18).toString();

  //     // Send transaction
  //     const tx = await contract.createEvent(
  //       eventData.eventName,
  //       eventData.eventCardImgUrl,
  //       eventData.eventDetails,
  //       eventDate,
  //       startTime,
  //       endTime,
  //       eventData.eventLocation,
  //       priceInWei
  //     );

  //     await tx.wait();
  //     toast.success("Event successfully created!");

  //     setEventData({
  //       eventName: "",
  //       eventCardImgUrl: "",
  //       eventDetails: "",
  //       eventDate: "",
  //       startTime: "",
  //       endTime: "",
  //       eventLocation: "",
  //       eventPrice: "",
  //     });

  //     router.push("/view_events");
  //   } catch (err: any) {
  //     toast.error(err.message || "An error occurred.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleSubmit = async () => {
  //   if (!validateForm()) return;

  //   // if (!contract) {
  //   //   console.error("Contract not found");
  //   //   toast.error("Contract not found");

  //   //   return;
  //   // }

  //   // if (!contract) {
  //   //   await connectWallet();

  //   //   return;
  //   // }

  //   setLoading(true);
  //   setSuccess(null);
  //   setError(null);

  //   try {
  //     let activeContract = contract;

  //     // If contract is null, connect wallet and get the contract instance
  //     if (!activeContract) {
  //       activeContract = await connectWallet();
  //     }

  //     // If contract is still null, show error
  //     if (!activeContract) {
  //       toast.error("Failed to connect to the contract. Please try again.");
  //       setLoading(false);
  //       return;
  //     }

  //     // Convert time strings to UNIX timestamps
  //     const eventDate = Math.floor(
  //       new Date(eventData.eventDate).getTime() / 1000
  //     );
  //     const startTime = Math.floor(
  //       new Date(`${eventData.eventDate}T${eventData.startTime}`).getTime() /
  //         1000
  //     );
  //     const endTime = Math.floor(
  //       new Date(`${eventData.eventDate}T${eventData.endTime}`).getTime() / 1000
  //     );

  //     const priceInWei = (parseFloat(eventData.eventPrice) * 1e18).toString();

  //     if (!eventData.paymentToken) {
  //       toast.error("Please select a payment token.");
  //       return;
  //     }

  //     // Send transaction
  //     const tx = await activeContract.createEvent(
  //       eventData.eventName,
  //       eventData.eventCardImgUrl,
  //       eventData.eventDetails,
  //       eventDate,
  //       startTime,
  //       endTime,
  //       eventData.eventLocation,
  //       priceInWei,
  //       eventData.paymentToken
  //     );

  //     await tx.wait();
  //     toast.success("Event successfully created!");

  //     setEventData({
  //       eventName: "",
  //       eventCardImgUrl: "",
  //       eventDetails: "",
  //       eventDate: "",
  //       startTime: "",
  //       endTime: "",
  //       eventLocation: "",
  //       eventPrice: "",
  //       paymentToken: "",
  //     });

  //     router.push("/view_events");
  //   } catch (err: any) {
  //     toast.error(err.message || "An error occurred.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      let activeContract = contract;

      // If contract is null, connect wallet and get the contract instance
      if (!activeContract) {
        activeContract = await connectWallet();
      }

      // If contract is still null, show error
      if (!activeContract) {
        toast.error("Failed to connect to the contract. Please try again.");
        setLoading(false);
        return;
      }

      // Convert time strings to UNIX timestamps
      const eventDate = Math.floor(
        new Date(eventData.eventDate).getTime() / 1000
      );
      const startTime = Math.floor(
        new Date(`${eventData.eventDate}T${eventData.startTime}`).getTime() /
          1000
      );
      const endTime = Math.floor(
        new Date(`${eventData.eventDate}T${eventData.endTime}`).getTime() / 1000
      );

      // Validate timestamps
      if (startTime < eventDate || endTime < eventDate) {
        toast.error("Start and end times must be after the event date.");
        setLoading(false);
        return;
      }

      const priceInWei = (parseFloat(eventData.eventPrice) * 1e18).toString();

      // Validate payment token
      if (
        !tokenOptions.some((token) => token.address === eventData.paymentToken)
      ) {
        toast.error("Selected payment token is not supported.");
        setLoading(false);
        return;
      }

      // Send transaction
      const tx = await activeContract.createEvent(
        eventData.eventName,
        eventData.eventCardImgUrl,
        eventData.eventDetails,
        eventDate,
        startTime,
        endTime,
        eventData.eventLocation,
        priceInWei,
        eventData.paymentToken,
        { gasLimit: 500000 } // Increase gas limit
      );

      await tx.wait();
      toast.success("Event successfully created!");

      setEventData({
        eventName: "",
        eventCardImgUrl: "",
        eventDetails: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        eventLocation: "",
        eventPrice: "",
        paymentToken: "",
      });

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

      {/* Event Date */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Date *
        </label>
        <input
          type="date"
          name="eventDate"
          value={eventData.eventDate}
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

      {/* Event Price (cUSD) */}
      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-2 text-sm">
          Ticket Price (cUSD) *
        </label>
        <input
          type="number"
          name="eventPrice"
          value={eventData.eventPrice}
          onChange={handleChange}
          placeholder="Enter ticket price in cUSD"
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

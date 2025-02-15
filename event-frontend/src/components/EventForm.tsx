import { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useContract } from "../context/ContractContext";

export default function EventForm() {
  const [eventName, setEventName] = useState("");
  const [eventCardImgUrl, setEventCardImgUrl] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const { contract } = useContract();

  // Function to create an event on the blockchain
  const createEvent = async () => {
    if (!contract) {
      console.error("Contract not found");
      return;
    }

    try {
      const timestamp = Math.floor(new Date(eventDate).getTime() / 1000); // Convert date to Unix timestamp
      const tx = await contract.createEvent(
        eventName,
        eventCardImgUrl,
        eventDetails,
        timestamp,
        eventTime,
        eventLocation
      );
      await tx.wait(); // Wait for transaction to be mined
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-20">
      <h2 className="text-2xl font-bold">Create An Event</h2>
      <div className="mt-6">
        <input
          type="text"
          className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />
        <input
          type="text"
          className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Event Card Image URL"
          value={eventCardImgUrl}
          onChange={(e) => setEventCardImgUrl(e.target.value)}
        />
        <textarea
          className="w-full mt-2 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Event Description"
          value={eventDetails}
          onChange={(e) => setEventDetails(e.target.value)}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">Event Date</label>
          <div className="relative">
            <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="date"
              className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Event Time</label>
          <div className="relative">
            <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="time"
              className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="block font-medium">Event Location</label>
        <div className="relative">
          <MapPinIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Location"
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
          />
        </div>
      </div>

      <button
        className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        onClick={createEvent}
      >
        Create Event
      </button>
    </div>
  );
}

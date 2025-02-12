import { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useContract } from "../context/ContractContext";

export default function EventForm() {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventType, setEventType] = useState("venue");
  const { contract } = useContract();

  // Function to create an event on the blockchain
  const createEvent = async () => {
    if (!contract) {
      console.error("Contract not found");
      return;
    }

    try {
      // setLoading(true);
      const tx = await contract.createEvent(
        "Blockchain Summit 2025",
        "https://example.com/event-image.jpg",
        "A premier blockchain event featuring experts from around the world.",
        1735689600,
        "10:00 AM - 5:00 PM",
        "Lagos, Nigeria"
      );
      await tx.wait(); // Wait for the transaction to be mined
      alert("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      // setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold">Ein Event mit KI erstellen</h2>
      <p className="text-gray-600 mt-2">
        Beantworten Sie ein paar Fragen zu Ihrem Event. Unser KI-Erstellungstool
        erstellt dann anhand interner Daten eine Eventseite. Sie können
        natürlich auch{" "}
        <a href="#" className="text-blue-600 underline">
          ein Event ohne KI erstellen.
        </a>
      </p>

      {/* Event Title */}
      <div className="mt-6">
        <label className="block font-medium">
          Wie lautet der Name Ihres Events?
        </label>
        <p className="text-sm text-gray-500">
          Zusammenfassung, Beschreibung, Kategorie und Tags des Events.
        </p>
        <input
          type="text"
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Eventtitel *"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
      </div>

      {/* Date and Time */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-medium">Datum</label>
          <div className="relative">
            <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="date"
              className="w-full pl-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Startzeit</label>
          <div className="relative">
            <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="time"
              className="w-full pl-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block font-medium">Vorstellungsende</label>
          <div className="relative">
            <ClockIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="time"
              className="w-full pl-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Event Type Selection */}
      <div className="mt-6">
        <label className="block font-medium">Wo findet das Event statt?</label>
        <div className="flex space-x-2 mt-2">
          <button
            className={`px-4 py-2 rounded-lg border ${
              eventType === "venue" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
            onClick={() => setEventType("venue")}
          >
            Veranstaltungsort
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${
              eventType === "online" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
            onClick={() => setEventType("online")}
          >
            Online-Event
          </button>
          <button
            className={`px-4 py-2 rounded-lg border ${
              eventType === "announcement"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
            // onClick={() => setEventType("announcement")}
            onClick={createEvent}
          >
            createEvent
          </button>
        </div>
      </div>

      {/* Location Input */}
      {eventType === "venue" && (
        <div className="mt-6">
          <label className="block font-medium">Veranstaltungsort</label>
          <div className="relative">
            <MapPinIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="w-full pl-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Veranstaltungsort *"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

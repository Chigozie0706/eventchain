"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { useContract } from "@/context/ContractContext";

export default function EventTickets() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { contract, readOnlyContract } = useContract();

  const fetchUserEvent = useCallback(async () => {
    try {
      if (!contract) {
        console.error("❌ contract instance not found");
        return;
      }

      setLoading(true);

      const rawData = await contract.getUserEvents();
      console.log("🔹 Raw Event Data:", rawData);

      if (!rawData || rawData.length !== 2) {
        console.error("❌ Unexpected data format from getUserEvents()");
        return;
      }

      const [eventIds, rawEvents] = rawData;

      const formattedEvents = rawEvents.map((event: any, index: number) => ({
        id: eventIds[index], // Mapping event ID from contract
        owner: event.owner,
        eventName: event.eventName,
        eventCardImgUrl: event.eventCardImgUrl,
        eventDetails: event.eventDetails,
        startDate: Number(event.startDate),
        endDate: Number(event.endDate),
        startTime: Number(event.startTime),
        endTime: Number(event.endTime),
        eventLocation: event.eventLocation,
        isActive: event.isActive,
        ticketPrice: Number(event.ticketPrice),
        fundsHeld: Number(event.fundsHeld),
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        paymentToken: ethers.getAddress(event.paymentToken), // Fixed incorrect method
      }));

      setEvents(formattedEvents); // Corrected reference
      setLoading(false);

      console.log("✅ Formatted Events:", formattedEvents);
    } catch (error) {
      console.error("❌ Error fetching user events:", error);
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchUserEvent();
  }, [fetchUserEvent]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Events</h1>
      {loading && <p>Loading...</p>}
      {!loading && events.length === 0 && <p>No events found.</p>}
      <ul className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{event.eventName}</h2>
            <p className="text-gray-600">{event.eventDetails}</p>
            <p>
              📍 Location:{" "}
              <span className="font-medium">{event.eventLocation}</span>
            </p>
            <p>
              🗓 Start:{" "}
              <span className="font-medium">
                {new Date(event.startDate * 1000).toLocaleString()}
              </span>
            </p>
            <p>
              🏁 End:{" "}
              <span className="font-medium">
                {new Date(event.endDate * 1000).toLocaleString()}
              </span>
            </p>
            <p>
              💰 Ticket Price:{" "}
              <span className="font-medium">{event.ticketPrice} Tokens</span>
            </p>
            <p>
              🏦 Payment Token:{" "}
              <span className="font-medium">{event.paymentToken}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";
import EventForm from "@/components/EventForm";
import EventTickets from "@/components/EventTickets";

export default function Home() {
  return (
    <>
      <div className="pt-16">
        <EventTickets />
      </div>
    </>
  );
}

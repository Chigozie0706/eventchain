"use client";
import Image from "next/image";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventForm from "@/components/EventForm";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container">
        <div className="pt-16">
          <HeroSection />
          <div className="flex items-center flex-wrap mx-auto">
            <EventCard />

            <EventCard />

            <EventCard />

            <EventCard />

            <EventCard />

            <EventCard />
          </div>

          <EventForm />
        </div>
      </div>
    </>
  );
}

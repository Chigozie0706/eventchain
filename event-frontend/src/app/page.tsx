"use client";
import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import { useContract } from "../context/ContractContext";

export default function Home() {
  const [, setEvents] = useState([]);
  const { contract } = useContract();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!contract) {
          console.error("Contract not found");
          return;
        }

        const eventData = await contract.getAllEvents();
        setEvents(eventData);
        console.log(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
  }, [contract]);

  return (
    <>
      {/* <Navbar /> */}
      <div className="">
        <div className="pt-16">
          <HeroSection />
        </div>
      </div>
    </>
  );
}

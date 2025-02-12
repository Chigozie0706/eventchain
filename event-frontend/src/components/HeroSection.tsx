// import { useState } from "react";
// import { BrowserProvider } from "ethers";
import { useContract } from "../context/ContractContext";

export default function HeroSection() {
  const { contract } = useContract();

  const getEventLength = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }

    try {
      const length = await contract.getEventLength(); // Replace with actual contract method
      // setEventLength(length);
      console.log(length);
    } catch (error) {
      console.error("Error fetching event length:", error);
    }
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto mt-20 rounded-lg overflow-hidden">
      {/* Background Image */}
      <div
        className="relative h-[400px] md:h-[450px] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/image1.jpg')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="text-white px-8 md:px-16 max-w-lg">
            <h2 className="text-xl md:text-2xl font-semibold">
              Best events in
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold">Lagos</h1>
            <p className="mt-3 text-sm md:text-base">
              Looking for something to do in Lagos? Whether you're a local, new
              in town or just cruising through, we've got great tips and events.
            </p>

            {/* Button */}
            <button
              className="mt-5 flex items-center bg-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-blue-700"
              onClick={getEventLength}
            >
              <span className="mr-2">📍</span> Lagos
            </button>

            <button
              className="mt-5 flex items-center bg-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-blue-700"
              // onClick={connectWallet}
            >
              <span className="mr-2">📍</span> connect wallet ⌄
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

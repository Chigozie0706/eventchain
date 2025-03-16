"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContract } from "../context/ContractContext";
import { ethers } from "ethers";

export default function Navbar() {
  const { cUSDToken, address, connectWallet } = useContract();
  const pathname = usePathname();
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!cUSDToken || !address) return;
      try {
        const bal = await cUSDToken.balanceOf(address);
        setBalance(ethers.formatUnits(bal, 18));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [cUSDToken, address]);

  // Helper function for active nav link styling
  const linkClass = (path: string) =>
    pathname === path ? "text-orange-600 font-bold" : "text-gray-700";

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-md fixed w-full z-50">
      {/* Left: Logo */}
      <div className="text-orange-500 text-2xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-6 text-gray-700">
        <button
          className={`flex items-center text-xs ${linkClass("/create_event")}`}
        >
          <Link href="/create_event">
            <span className="ml-1">Create Event</span>
          </Link>
        </button>
        <button
          className={`flex items-center text-xs ${linkClass("/view_events")}`}
        >
          <Link href="/view_events">
            <span className="ml-1">View Events</span>
          </Link>
        </button>

        <button
          className={`flex items-center text-xs ${linkClass(
            "/view_created_events"
          )}`}
        >
          <Link href="/view_created_events">
            <span className="ml-1">Created Events</span>
          </Link>
        </button>

        {/*  Display Address & Balance */}
        {address ? (
          <div className="flex items-center space-x-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
            <span className="font-semibold">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            {balance && <span className="text-orange-600">{balance} cUSD</span>}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

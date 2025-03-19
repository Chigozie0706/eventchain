"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContract } from "../context/ContractContext";
import { ethers } from "ethers";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { mentoTokenContracts, address, connectWallet } = useContract();
  const pathname = usePathname();
  const [selectedToken, setSelectedToken] = useState("cUSD");
  const [balance, setBalance] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!mentoTokenContracts[selectedToken] || !address) return;
      try {
        const bal = await mentoTokenContracts[selectedToken]?.balanceOf(
          address
        );
        setBalance(ethers.formatUnits(bal, 18));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [mentoTokenContracts, selectedToken, address]);

  const linkClass = (path: string) =>
    pathname === path ? "text-orange-600 font-bold" : "text-gray-700";

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md fixed w-full z-50">
      {/* Logo */}
      <div className="text-orange-500 text-xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Right Section (Links + Wallet) */}
      <div className="ml-auto flex items-center">
        {/* Navigation Links */}
        <div
          className={`md:flex md:items-center md:space-x-6 text-sm absolute md:static top-16 left-0 w-full md:w-auto bg-white shadow-md md:shadow-none px-6 py-4 md:p-0 transition-all duration-300 ${
            menuOpen ? "flex flex-col space-y-4 text-center" : "hidden"
          }`}
        >
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>

          <Link href="/" className={linkClass("/view_events")}>
            Tickets
          </Link>
          <Link href="/create_event" className={linkClass("/create_event")}>
            Create Event
          </Link>

          <Link
            href="/view_created_events"
            className={linkClass("/view_created_events")}
          >
            Created Events
          </Link>
        </div>

        {/* Wallet & Token Section */}
        <div className="hidden md:flex items-center space-x-4 text-xs">
          {address && (
            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
              {balance && (
                <span className="text-orange-600">
                  {balance} {selectedToken}
                </span>
              )}
            </div>
          )}

          {!address ? (
            <button
              onClick={connectWallet}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-orange-600 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none ml-4"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}

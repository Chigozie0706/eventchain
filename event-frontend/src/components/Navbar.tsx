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
      <div className="text-orange-500 text-2xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden focus:outline-none"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation Links */}
      <div
        className={`md:flex md:items-center md:space-x-6 text-gray-700 absolute md:static top-16 left-0 w-full md:w-auto bg-white shadow-md md:shadow-none px-6 py-4 md:p-0 transition-all duration-300 ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <Link href="/create_event" className={linkClass("/create_event")}>
          Create Event
        </Link>
        <Link href="/view_events" className={linkClass("/view_events")}>
          View Events
        </Link>
        <Link
          href="/view_created_events"
          className={linkClass("/view_created_events")}
        >
          Created Events
        </Link>
      </div>

      {/* Wallet & Token Section */}
      <div className="hidden md:flex items-center space-x-4 text-sm">
        {address && (
          <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-xs">
            {/* <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              {Object.keys(mentoTokenContracts).map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select> */}
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
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </nav>
  );
}

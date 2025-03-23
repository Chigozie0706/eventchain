"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContract } from "../context/ContractContext";
import { ethers } from "ethers";
import { Menu, X, ChevronDown } from "lucide-react";

const mentoTokens: Record<string, string> = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
};

export default function Navbar() {
  const {
    mentoTokenContracts,
    address,
    connectWallet,
    balances,
    setBalances,
    disconnectWallet,
  } = useContract();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!mentoTokenContracts || !address) return;

      const newBalances: Record<string, string> = {};
      for (const [tokenAddress, contract] of Object.entries(
        mentoTokenContracts
      )) {
        try {
          const bal = await contract.balanceOf(address);
          const formattedBalance = parseFloat(
            ethers.formatUnits(bal, 18)
          ).toFixed(2);
          const tokenName = mentoTokens[tokenAddress] || tokenAddress;
          newBalances[tokenName] = formattedBalance;
        } catch (error) {
          console.error(`Error fetching balance for ${tokenAddress}:`, error);
          const tokenName = mentoTokens[tokenAddress] || tokenAddress;
          newBalances[tokenName] = "0";
        }
      }
      setBalances(newBalances);
    };

    fetchBalances();
  }, [mentoTokenContracts, address, setBalances]);

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md fixed w-full z-50">
      {/* Logo */}
      <div className="text-orange-500 text-xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Menu (Mobile & Desktop) */}
        <div
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white shadow-md md:shadow-none px-6 py-4 md:p-0 transition-all duration-300 ${
            menuOpen
              ? "flex flex-col space-y-4 md:space-y-0 text-center md:flex md:flex-row md:space-x-6"
              : "hidden md:flex gap-6"
          } text-xs`}
        >
          <Link
            href="/"
            className={`text-gray-700 ${
              pathname === "/" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/view_events"
            className={`text-gray-700 ${
              pathname === "/view_events" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Events
          </Link>
          <Link
            href="/create_event"
            className={`text-gray-700 ${
              pathname === "/create_event" ? "text-orange-600 font-bold" : ""
            }`}
          >
            Create Event
          </Link>

          {/* Wallet Section (Inside Hamburger Menu for Mobile) */}
          {address ? (
            <div className="md:hidden">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center space-x-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition w-full"
              >
                <span>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="bg-white shadow-md rounded-lg p-2 mt-2 ">
                  {Object.keys(balances).length > 0 ? (
                    Object.entries(balances).map(([token, balance]) => (
                      <div key={token} className="px-4 py-2 text-gray-700">
                        {balance} {token}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      Fetching balances...
                    </div>
                  )}

                  <hr className="my-2 border-gray-300" />
                  <Link
                    href="/event_tickets"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Tickets
                  </Link>
                  <Link
                    href="/view_created_events"
                    className="block px-4 py-2 hover:bg-gray-100 ml-2"
                  >
                    Created Events
                  </Link>

                  <hr className="my-2 border-gray-300" />
                  <button
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    onClick={disconnectWallet}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="md:hidden bg-orange-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-orange-600 transition"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Wallet Button (Visible on Desktop) */}
        <div className="hidden md:block ml-6">
          {address ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition text-xs"
              >
                <span>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-lg p-2 text-xs">
                  {Object.keys(balances).length > 0 ? (
                    Object.entries(balances).map(([token, balance]) => (
                      <div key={token} className="px-4 py-2 text-gray-700">
                        {balance} {token}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      Fetching balances...
                    </div>
                  )}

                  <hr className="my-2 border-gray-300" />
                  <Link
                    href="/event_tickets"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Tickets
                  </Link>
                  <Link
                    href="/view_created_events"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Created Events
                  </Link>

                  <hr className="my-2 border-gray-300" />
                  <button
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    onClick={disconnectWallet}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-orange-600 transition"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

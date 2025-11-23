"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import blockies from "ethereum-blockies";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Wagmi
  const { address, isConnected } = useAccount();
  const { disconnect: disconnectWagmi } = useDisconnect();

  // Privy
  const { user, authenticated, login, logout: logoutPrivy } = usePrivy();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(e.target as Node)
      ) {
        setWalletDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setEventsDropdownOpen(false);
    setWalletDropdownOpen(false);
  }, [pathname]);

  // Logout
  const handleLogout = async () => {
    if (isConnected) disconnectWagmi();
    logoutPrivy();
  };

  // Display address
  const displayAddress = address || user?.wallet?.address;

  // Avatar blockie
  const avatar = blockies
    .create({
      seed: displayAddress?.toLowerCase() || "0x0",
      size: 8,
      scale: 4,
    })
    .toDataURL();

  return (
    <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-md fixed w-full z-50">
      {/* Logo */}
      <Link href="/" className="text-orange-500 text-xl font-bold">
        EventChain
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Links */}
        <div
          ref={menuRef}
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-white shadow-md md:shadow-none px-6 py-4 md:p-0 transition-all duration-300 ${
            menuOpen
              ? "flex flex-col space-y-4 md:flex md:flex-row md:space-x-6"
              : "hidden md:flex gap-6"
          } text-xs items-center`}
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

          {/* Mobile-only My Events */}
          {authenticated && menuOpen && (
            <>
              <Link
                href="/event_tickets"
                className="text-gray-700 hover:text-orange-600"
              >
                My Tickets
              </Link>
              <Link
                href="/view_created_events"
                className="text-gray-700 hover:text-orange-600"
              >
                Created Events
              </Link>
            </>
          )}
        </div>

        {/* Wallet Avatar + Dropdown */}
        {authenticated && (
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 transition"
            >
              <img src={avatar} className="w-5 h-5 rounded-md" />

              {displayAddress
                ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
                : "Connected"}

              <ChevronDown size={14} className="text-gray-600" />
            </button>

            {walletDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-xl overflow-hidden text-sm z-50">
                {/* My Events */}
                <Link
                  href="/event_tickets"
                  className="block px-4 py-3 hover:bg-gray-100 transition"
                >
                  My Tickets
                </Link>

                <Link
                  href="/view_created_events"
                  className="block px-4 py-3 hover:bg-gray-100 transition"
                >
                  Created Events
                </Link>

                {/* Mobile-only Main Links */}
                <Link
                  href="/"
                  className="block px-4 py-3 hover:bg-gray-100 transition md:hidden"
                >
                  Home
                </Link>

                <Link
                  href="/view_events"
                  className="block px-4 py-3 hover:bg-gray-100 transition md:hidden"
                >
                  Events
                </Link>

                <Link
                  href="/create_event"
                  className="block px-4 py-3 hover:bg-gray-100 transition md:hidden"
                >
                  Create Event
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

        {/* If not logged in */}
        {!authenticated && (
          <button
            onClick={login}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-orange-600 transition"
          >
            Login with Privy
          </button>
        )}
      </div>
    </nav>
  );
}

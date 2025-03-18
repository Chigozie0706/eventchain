// "use client";
// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useContract } from "../context/ContractContext";
// import { ethers } from "ethers";

// export default function Navbar() {
//   const { mentoTokenContracts, address, connectWallet } = useContract();
//   const pathname = usePathname();
//   const [selectedToken, setSelectedToken] = useState("cUSD");
//   const [balance, setBalance] = useState<string | null>(null);

//   // Fetch token balance
//   useEffect(() => {
//     const fetchBalance = async () => {
//       if (!mentoTokenContracts[selectedToken] || !address) return;
//       try {
//         const bal = await mentoTokenContracts[selectedToken]?.balanceOf(
//           address
//         );
//         setBalance(ethers.formatUnits(bal, 18));
//       } catch (error) {
//         console.error("Error fetching balance:", error);
//       }
//     };

//     fetchBalance();
//   }, [mentoTokenContracts, selectedToken, address]);

//   // Helper function for active nav link styling
//   const linkClass = (path: string) =>
//     pathname === path ? "text-orange-600 font-bold" : "text-gray-700";

//   return (
//     <nav className="flex items-center justify-between bg-white px-6 py-3 shadow-md fixed w-full z-50">
//       {/* Left: Logo */}
//       <div className="text-orange-500 text-2xl font-bold">
//         <Link href="/">EventChain</Link>
//       </div>

//       {/* Right: Actions */}
//       <div className="flex items-center space-x-6 text-gray-700">
//         <Link href="/create_event" className={linkClass("/create_event")}>
//           Create Event
//         </Link>
//         <Link href="/view_events" className={linkClass("/view_events")}>
//           View Events
//         </Link>
//         <Link
//           href="/view_created_events"
//           className={linkClass("/view_created_events")}
//         >
//           Created Events
//         </Link>

//         {/* Token Selector & Balance */}
//         {address && (
//           <div className="flex items-center space-x-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
//             <select
//               value={selectedToken}
//               onChange={(e) => setSelectedToken(e.target.value)}
//               className="bg-transparent outline-none cursor-pointer"
//             >
//               {Object.keys(mentoTokenContracts).map((token) => (
//                 <option key={token} value={token}>
//                   {token}
//                 </option>
//               ))}
//             </select>
//             {balance && (
//               <span className="text-orange-600">
//                 {balance} {selectedToken}
//               </span>
//             )}
//           </div>
//         )}

//         {/* Wallet Connection Button */}
//         {!address ? (
//           <button
//             onClick={connectWallet}
//             className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition"
//           >
//             Connect Wallet
//           </button>
//         ) : (
//           <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">
//             {address.slice(0, 6)}...{address.slice(-4)}
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// }

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
    <nav className="bg-white shadow-md fixed w-full z-50 px-6 py-3 flex items-center justify-between">
      <div className="text-orange-500 text-2xl font-bold">
        <Link href="/">EventChain</Link>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6 text-gray-700">
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

        {address && (
          <div className="flex items-center space-x-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            >
              {Object.keys(mentoTokenContracts).map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
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

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-md md:hidden flex flex-col items-center py-4 space-y-4">
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

          {address && (
            <div className="flex flex-col items-center space-y-2">
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="bg-gray-100 p-2 rounded-md"
              >
                {Object.keys(mentoTokenContracts).map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
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
      )}
    </nav>
  );
}

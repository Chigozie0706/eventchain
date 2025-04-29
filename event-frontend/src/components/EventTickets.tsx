// "use client";

// import { useEffect, useState, useCallback } from "react";
// import { ethers } from "ethers";
// import { useContract } from "@/context/ContractContext";
// import { MapPin, Calendar, Flag, DollarSign } from "lucide-react";
// import { toast } from "react-hot-toast";

// // Event Interface
// type Event = {
//   id: string;
//   owner: string;
//   eventName: string;
//   eventCardImgUrl: string;
//   eventDetails: string;
//   startDate: number;
//   endDate: number;
//   startTime: number;
//   endTime: number;
//   eventLocation: string;
//   isActive: boolean;
//   ticketPrice: number;
//   fundsHeld: number;
//   isCanceled: boolean;
//   fundsReleased: boolean;
//   paymentToken: string;
// };

// export default function EventTickets() {
//   const [events, setEvents] = useState<Event[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [refunding, setRefunding] = useState(false);

//   const {
//     contract,
//     readOnlyContract,
//     address,
//     mentoTokenContracts,
//     balances,
//     setBalances,
//   } = useContract();

//   const mentoTokens: Record<string, string> = {
//     "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
//     "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
//     "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
//   };

//   const fetchUserEvents = useCallback(async () => {
//     if (!contract) {
//       console.error(" Contract instance not found");
//       return;
//     }
//     try {
//       setLoading(true);
//       const rawData = await contract.getUserEvents();
//       if (!rawData || rawData.length !== 2) {
//         console.error(" Unexpected data format from getUserEvents()");
//         return;
//       }

//       const [eventIds, rawEvents] = rawData;
//       const formattedEvents = rawEvents.map((event: any, index: number) => ({
//         id: eventIds[index],
//         owner: event.owner,
//         eventName: event.eventName,
//         eventCardImgUrl: event.eventCardImgUrl,
//         eventDetails: event.eventDetails,
//         startDate: Number(event.startDate),
//         endDate: Number(event.endDate),
//         startTime: Number(event.startTime),
//         endTime: Number(event.endTime),
//         eventLocation: event.eventLocation,
//         isActive: event.isActive,
//         ticketPrice: Number(event.ticketPrice),
//         fundsHeld: Number(event.fundsHeld),
//         isCanceled: event.isCanceled,
//         fundsReleased: event.fundsReleased,
//         paymentToken: ethers.getAddress(event.paymentToken),
//       }));

//       setEvents(formattedEvents);
//     } catch (error) {
//       console.error(" Error fetching user events:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [contract]);

//   useEffect(() => {
//     fetchUserEvents();
//   }, [fetchUserEvents]);

//   const requestRefund = async (id: string) => {
//     if (!contract) return;

//     setRefunding(true);
//     // setLoading(true);
//     const toastId = toast.loading("Processing refund request...");

//     try {
//       const refundTx = await contract.requestRefund(id);
//       await refundTx.wait();

//       toast.dismiss(toastId);
//       toast.success("Refund processed successfully!");

//       fetchUserEvents();
//       fetchBalances();
//     } catch (error: any) {
//       console.error("Error requesting refund:", error);

//       toast.dismiss(toastId);
//       toast.error(
//         error.reason || "Transaction failed. Check console for details."
//       );
//     } finally {
//       setRefunding(false);
//       // setLoading(false);
//     }
//   };

//   const fetchBalances = async () => {
//     if (!mentoTokenContracts || !address) return;

//     const newBalances: Record<string, string> = {};
//     for (const [tokenAddress, contract] of Object.entries(
//       mentoTokenContracts
//     )) {
//       try {
//         const bal = await contract.balanceOf(address);
//         const formattedBalance = parseFloat(
//           ethers.formatUnits(bal, 18)
//         ).toFixed(2);
//         const tokenName = mentoTokens[tokenAddress] || tokenAddress;
//         newBalances[tokenName] = formattedBalance;
//       } catch (error) {
//         console.error(`Error fetching balance for ${tokenAddress}:`, error);
//         const tokenName = mentoTokens[tokenAddress] || tokenAddress;
//         newBalances[tokenName] = "0";
//       }
//     }
//     setBalances(newBalances);
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">My Events</h1>
//       {loading && <p>Loading...</p>}
//       {!loading && events.length === 0 && <p>No events found.</p>}
//       <ul className="space-y-4">
//         {events.map((event) => {
//           const formattedStartTime = new Date(
//             event.startTime * 1000
//           ).toLocaleTimeString(undefined, {
//             hour: "numeric",
//             minute: "numeric",
//             hour12: true,
//           });

//           const formattedEndTime = new Date(
//             event.endTime * 1000
//           ).toLocaleTimeString(undefined, {
//             hour: "numeric",
//             minute: "numeric",
//             hour12: true,
//           });

//           const formattedStartDate = new Date(
//             event.startDate * 1000
//           ).toLocaleDateString(undefined, {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           });

//           const formattedEndDate = new Date(
//             event.endDate * 1000
//           ).toLocaleDateString(undefined, {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           });

//           return (
//             <li key={event.id} className="border p-4 rounded-lg">
//               <h2 className="text-xl font-semibold mb-2">{event.eventName}</h2>
//               <p className="text-gray-600">{event.eventDetails}</p>

//               <p className="text-gray-600 text-sm">
//                 <MapPin className="inline-block w-5 h-5 mr-1 text-gray-600" />
//                 <span className="font-medium">{event.eventLocation}</span>
//               </p>

//               <p className="text-gray-600 text-sm">
//                 <Calendar className="inline-block w-5 h-5 mr-1 text-gray-600" />
//                 Start: <span className="font-medium">{formattedStartDate}</span>
//               </p>

//               <p className="text-gray-600 text-sm">
//                 <Flag className="inline-block w-5 h-5 mr-1 text-gray-600" />
//                 End: <span className="font-medium">{formattedEndDate}</span>
//               </p>

//               <p className="text-gray-600 text-sm">
//                 <Calendar className="inline-block w-5 h-5 mr-1 text-gray-600" />
//                 Time:{" "}
//                 <span className="font-medium">
//                   {formattedStartTime} - {formattedEndTime}
//                 </span>
//               </p>

//               <p className="text-gray-600 text-sm">
//                 <DollarSign className="inline-block w-5 h-5 mr-1 text-gray-600 text-sm" />
//                 Ticket Price: {(event.ticketPrice / 1e18).toFixed(2)}{" "}
//                 {mentoTokens[event.paymentToken]}
//               </p>

//               <button
//                 onClick={() => requestRefund(event.id)}
//                 className="mt-4 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition text-sm"
//                 disabled={refunding}
//               >
//                 {refunding ? "Processing..." : "Apply for Refund"}
//               </button>
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

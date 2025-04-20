"use client";
import AttendeeList from "./AttendeeList";
import { MapPin } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Ticket } from "lucide-react";
import { Handshake } from "lucide-react";
import { UsersRound } from "lucide-react";
import { useContract } from "../context/ContractContext";
import { client, contract } from "@/app/client";
import {
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { TransactionButton } from "thirdweb/react";
import toast from "react-hot-toast";
import { celoAlfajoresTestnet } from "thirdweb/chains";
import { isERC20 } from "thirdweb/extensions/erc20";
import { useActiveAccount } from "thirdweb/react";
import { approve } from "thirdweb/extensions/erc20";

// import { erc20Approve } from "thirdweb/extensions/erc20";

// interfaces.ts
export interface Event {
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: bigint;
  paymentToken: string;
}

export interface EventPageProps {
  event: any;
  attendees: string[];
  createdEvents: Event[];
  // buyTicket: () => Promise<void>;
  // requestRefund: () => Promise<void>;
  loading: boolean;
  registering: boolean;
  refunding: boolean;
  id: string;
}

export default function EventPage({
  event,
  attendees,
  createdEvents,
  // buyTicket,
  // requestRefund,
  loading,
  registering,
  refunding,
  id,
}: EventPageProps) {
  // const { mentoTokens } = useContract();

  const account = useActiveAccount();

  const formattedStartDate = new Date(
    event.startDate * 1000
  ).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD on Alfajores

  const formattedEndDate = new Date(event.endDate * 1000).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const formattedStartTime = new Date(
    event.startTime * 1000
  ).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const formattedEndTime = new Date(event.endTime * 1000).toLocaleTimeString(
    undefined,
    {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }
  );

  // const handleBuyTicket = async () => {
  //   if (!account) {
  //     toast.error("Please connect your wallet first");
  //     return;
  //   }

  //   try {
  //     // 1. First approve the token spending
  //     const tokenContract = getContract({
  //       address: event.paymentToken,
  //       chain: celoAlfajoresTestnet,
  //       client,
  //     });

  //     const approveTx = prepareContractCall({
  //       contract: tokenContract,
  //       method: "function approve(address spender, uint256 amount)",
  //       params: [contract.address, BigInt(event.ticketPrice)],
  //     });

  //     await sendTransaction({
  //       transaction: await approveTx,
  //       account,
  //     });

  //     // 2. Then execute the ticket purchase
  //     const buyTx = prepareContractCall({
  //       contract,
  //       method: "function buyTicket(uint256 _index)",
  //       params: [BigInt(id)],
  //     });

  //     const purchaseResult = await sendTransaction({
  //       transaction: await buyTx,
  //       account,
  //     });

  //     toast.success("🎟️ Ticket purchased successfully!");
  //     return purchaseResult;
  //   } catch (error: any) {
  //     console.error("Purchase error:", error);

  //     if (error.message.includes("nonce too low")) {
  //       toast.error("Transaction processing. Please wait...");
  //     } else if (error.message.includes("Insufficient token allowance")) {
  //       toast.error("Please approve token spending first");
  //     } else {
  //       toast.error(`Purchase failed: ${error.message}`);
  //     }
  //     throw error;
  //   }
  // };

  // const handleBuyTicket = async () => {
  //   if (!account) {
  //     toast.error("Please connect your wallet first");
  //     throw new Error("No account connected");
  //   }

  //   // 1. First return the approval transaction
  //   const tokenContract = getContract({
  //     address: event.paymentToken,
  //     chain: celoAlfajoresTestnet,
  //     client,
  //   });

  //   const approveTx = prepareContractCall({
  //     contract: tokenContract,
  //     method: "function approve(address spender, uint256 amount)",
  //     params: [contract.address, BigInt(event.ticketPrice)],
  //   });

  //   // 2. Then return the purchase transaction
  //   return prepareContractCall({
  //     contract,
  //     method: "function buyTicket(uint256 _index)",
  //     params: [BigInt(id)],
  //   });
  // };

  const handleApproveTokens = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // 1. Get the token contract
      const tokenContract = getContract({
        address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Your token address
        chain: celoAlfajoresTestnet,
        client,
      });

      // 2. Prepare approval transaction
      const transaction = await approve({
        contract: tokenContract,
        spender: contract.address, // Your Event contract address
        amount: 1000000000000000000, // Exact ticket price
      });

      // 3. Send the approval transaction
      const result = await sendTransaction({
        transaction,
        account,
      });

      toast.success("Token approval successful!");
      return result;
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(`Approval failed: ${error}`);
      throw error;
    }
  };

  // const handleBuyTicket2 = async () => {
  //   if (!account) {
  //     toast.error("Please connect your wallet first");
  //     throw new Error("No account connected");
  //   }

  //   // 1. First check existing allowance
  //   const tokenContract = getContract({
  //     address: event.paymentToken,
  //     chain: celoAlfajoresTestnet,
  //     client,
  //   });

  //   // 2. If insufficient allowance, approve first
  //   const currentAllowance = await tokenContract.call(
  //     "allowance",
  //     [account.address, contract.address]
  //   );

  //   if (currentAllowance < BigInt(event.ticketPrice)) {
  //     await handleApproveTokens();
  //     await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
  //   }

  //   // 3. Proceed with ticket purchase
  //   return prepareContractCall({
  //     contract,
  //     method: "function buyTicket(uint256 _index)",
  //     params: [BigInt(id)],
  //   });
  // };

  // const handleBuyTicket = async () => {
  //   if (!account) {
  //     toast.error("Please connect your wallet first");
  //     throw new Error("No account connected");
  //   }

  //   try {
  //     // 1. Get the token contract
  //     const tokenContract = getContract({
  //       address: event.paymentToken,
  //       chain: celoAlfajoresTestnet,
  //       client,
  //     });

  //     // 2. Check current allowance
  //     const currentAllowance = await readContract({
  //       contract: tokenContract,
  //       method:
  //         "function allowance(address owner, address spender) view returns (uint256)",
  //       params: [account.address, contract.address],
  //     });

  //     // 3. Approve if needed
  //     if (currentAllowance < BigInt(event.ticketPrice)) {
  //       const approveTx = await approve({
  //         contract: tokenContract,
  //         spender: contract.address,
  //         amount: 1000000000000000000,
  //       });

  //       await sendTransaction({
  //         transaction: approveTx,
  //         account,
  //       });

  //       toast.success("Token approval submitted!");
  //       await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for blockchain update
  //     }

  //     // 4. Return purchase transaction
  //     return prepareContractCall({
  //       contract,
  //       method: "function buyTicket(uint256 _index)",
  //       params: [BigInt(id)],
  //     });
  //   } catch (error) {
  //     console.error("Error in buy flow:", error);
  //     throw error;
  //   }
  // };

  // const handleBuyTicket = async () => {
  //   if (!account) {
  //     toast.error("Please connect your wallet first");
  //     throw new Error("No account connected");
  //   }

  //   // 1. Get the token contract
  //   const tokenContract = getContract({
  //     address: event.paymentToken,
  //     chain: celoAlfajoresTestnet,
  //     client,
  //   });

  //   // 2. Check current allowance
  //   const currentAllowance = await readContract({
  //     contract: tokenContract,
  //     method: "function allowance(address owner, address spender) view returns (uint256)",
  //     params: [account.address, contract.address]
  //   });

  //   // 3. If insufficient allowance, approve first
  //   if (currentAllowance < BigInt(event.ticketPrice)) {
  //     const approveTx = await approve({
  //       contract: tokenContract,
  //       spender: contract.address,
  //       amount: BigInt(event.ticketPrice),
  //     });

  //     await sendTransaction({
  //       transaction: approveTx,
  //       account,
  //     });

  //     // Wait for approval to be confirmed
  //     await new Promise(resolve => setTimeout(resolve, 5000));
  //   }

  //   // 4. Return the purchase transaction
  //   return prepareContractCall({
  //     contract,
  //     method: "function buyTicket(uint256 _index)",
  //     params: [BigInt(id)],
  //   });
  // };

  const handleBuyTicket = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      throw new Error("No account connected");
    }

    const tokenContract = getContract({
      address: event.paymentToken,
      chain: celoAlfajoresTestnet,
      client,
    });

    // No need for BigInt() conversion here since ticketPrice is already bigint
    const requiredAllowance = event.ticketPrice;

    const currentAllowance = await readContract({
      contract: tokenContract,
      method:
        "function allowance(address owner, address spender) view returns (uint256)",
      params: [account.address, contract.address],
    });

    if (currentAllowance < requiredAllowance) {
      const approveTx = await approve({
        contract: tokenContract,
        spender: contract.address,
        amount: requiredAllowance,
      });

      await sendTransaction({
        transaction: approveTx,
        account,
      });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return prepareContractCall({
      contract,
      method: "function buyTicket(uint256 _index)",
      params: [BigInt(id)],
    });
  };

  const handleBuyTicket1 = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      throw new Error("No account connected");
    }

    // 1. First handle the approval
    const tokenContract = getContract({
      address: event.paymentToken,
      chain: celoAlfajoresTestnet,
      client,
    });

    const approveTx = prepareContractCall({
      contract: tokenContract,
      method: "function approve(address spender, uint256 amount)",
      params: [contract.address, BigInt(event.ticketPrice)],
    });

    // Execute approval first
    try {
      const approvalResult = await sendTransaction({
        transaction: await approveTx,
        account,
      });

      // Wait for approval to be mined (important!)
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
    } catch (error) {
      console.error("Approval failed:", error);
      throw new Error("Token approval failed");
    }

    // 2. Then return the ticket purchase transaction
    return prepareContractCall({
      contract,
      method: "function buyTicket(uint256 _index)",
      params: [BigInt(id)],
    });
  };
  const mentoTokens: Record<string, string> = {
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
    "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
    "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
  };

  // Find the token name using the event's paymentToken address
  const tokenName = mentoTokens[event.paymentToken] || event.paymentToken;

  // const onClick = () => {
  //   const transaction = prepareContractCall({
  //     contract,
  //     method: "function buyTicket(uint256 _index)",
  //     params: [_index],
  //   });
  //   sendTransaction(transaction);
  // };

  return (
    <div className="container mx-auto px-6 md:px-12 lg:px-20 py-8">
      {/* Banner Section */}
      <div className="relative w-full flex justify-center mt-4 h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-2xl">
        {/* Background Blur Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl"></div>

        {/* Banner Image */}
        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
          <img
            src={event.eventCardImgUrl}
            alt="Event Banner"
            width={1200}
            height={500}
            className="rounded-2xl"
          />
        </div>
      </div>

      {/* Event Details Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:space-x-8 mt-10">
        {/* Left Side */}

        <div className="max-w-4xl bg-white p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {event.eventName}
          </h2>
          <p className="text-gray-600 mt-3 text-base">{event.eventDetails}</p>

          {/* Date and Time */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <CalendarDays className="w-5 h-5 text-gray-600" />
              <span>Date & Time</span>
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              {formattedStartDate} - {formattedEndDate}
            </p>

            <p className="text-gray-700 text-sm">
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>

          {/* Location */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <MapPin className="w-5 h-5 text-gray-600" />
              <span>Location</span>
            </h3>
            <p className="text-gray-700 text-sm">{event.eventLocation}</p>
          </div>

          {/* Ticket Price */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Ticket className="w-5 h-5 text-gray-600" />
              <span>Ticket Price</span>
            </h3>
            <p className="text-green-600 text-sm font-bold">
              {/* {(event.ticketPrice / 1e18).toFixed(2)} {tokenName} */}
            </p>
          </div>

          {/* Attendee List */}
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-4 flex items-center space-x-2 text-gray-800">
              <UsersRound className="w-5 h-5 text-gray-600" />
              <span>Attendees</span>
            </h3>
            <AttendeeList attendees={attendees} />
          </div>

          {/* Refund Policy */}
          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center space-x-2 text-gray-800">
              <Handshake className="w-5 h-5 text-gray-600" />
              <span>Refund Policy</span>
            </h3>
            <p className="text-gray-700 text-sm text-justify">
              Refunds are available if the event is canceled or if requested at
              least 5 hours before the event starts, provided funds are still in
              escrow. Refunds are issued in the same token used for payment and
              processed automatically. No refunds are available once the event
              has started, if funds have been released to the organizer, or if
              the request is made too late.
              <br />
              To request a refund, use the "Request Refund" button on the event
              page. If you experience issues, contact the organizer.
            </p>
          </div>
        </div>

        {/* Right Side (Ticket Selection) */}
        <div className="p-6 md:p-8 w-full md:w-1/3">
          <div className="border p-6 rounded-lg flex flex-col items-center bg-gray-100 shadow-md">
            <p className="font-semibold text-lg text-gray-900">
              Reserve a Spot
            </p>
            <p className="text-gray-600 text-base mt-2">
              Price:{" "}
              {/* <span className="font-semibold">
                {(event.ticketPrice / 1e18).toFixed(2)} {tokenName}
              </span> */}
            </p>
          </div>

          <button
            className="w-full bg-orange-600 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-orange-700 transition"
            onClick={handleBuyTicket}
            disabled={loading}
          >
            {registering ? "Processing..." : "Register"}
          </button>

          <button
            // onClick={requestRefund}
            className="w-full bg-red-500 text-white mt-4 py-2 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
            disabled={loading}
          >
            {refunding ? "Processing..." : "Request Refund"}
          </button>

          {/* <TransactionButton
            transaction={() =>
              prepareContractCall({
                contract,
                method: "function buyTicket(uint256 _index)",
                params: [BigInt(id)],
              })
            }
            onError={(error) => {
              console.log(error);
              toast.error(`Error: ${error.message}`);
            }}
            onTransactionConfirmed={() => {
              toast.success("Ticket purchased!");
              // Refresh data if needed
            }}
            style={{
              width: "100%",
              backgroundColor: "#2563EB",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
            }}
          >
            Buy Ticket
          </TransactionButton> */}

          {/* <TransactionButton
            transaction={async () => {
              const tokenContract = getContract({
                address: event.paymentToken, // dynamically from event
                chain: celoAlfajoresTestnet,
                client: client,
              });

              // 1. Approve the contract to spend your tokens
              // const approveTx = prepareContractCall({
              //   contract: tokenContract,
              //   method: erc20Approve({
              //     amount: BigInt(event.ticketPrice), // Make sure it's in base units!
              //     spender: contract.address, // Your EventChain contract address
              //   }),
              // });

              const approveTx = prepareContractCall({
                contract: tokenContract,
                method: "function approve(address spender, uint256 amount)",
                params: [
                  "0xdad1dCA04Ec7d1B05155FA96b4A646B81653FBFA", // Your EventChain contract address
                  BigInt(event.ticketPrice), // Ticket price
                ],
              });

              // await sendTransaction(approveTx); // wait for approval to complete

              await sendTransaction({
                transaction: await approveTx,
                account: account!,
              });

              // 2. Buy the ticket
              return prepareContractCall({
                contract,
                method: "function buyTicket(uint256 _index)",
                params: [BigInt(id)], // Event ID / index
              });
            }}
            onTransactionConfirmed={() => toast.success("🎟️ Ticket purchased!")}
            onError={(error) => {
              console.log(error);
              toast.error(`❌ Error: ${error.message}`);
            }}
          >
            Buy Ticket
          </TransactionButton> */}

          {/* <TransactionButton
            transaction={async () => {
              if (!account) {
                toast.error("Please connect your wallet first");
                throw new Error("No account connected");
              }

              // 1. First handle the approval
              const tokenContract = getContract({
                address: event.paymentToken,
                chain: celoAlfajoresTestnet,
                client: client,
              });

              const approveTx = prepareContractCall({
                contract: tokenContract,
                method: "function approve(address spender, uint256 amount)",
                params: [contract.address, BigInt(event.ticketPrice)], // Use contract.address directly
              });

              // Execute approval first
              try {
                await sendTransaction({
                  transaction: await approveTx,
                  account,
                });
              } catch (error) {
                console.error("Approval failed:", error);
                throw error; // Re-throw to stop the process
              }

              // 2. Then return the ticket purchase transaction
              return prepareContractCall({
                contract,
                method: "function buyTicket(uint256 _index)",
                params: [BigInt(id)],
              });
            }}
            onTransactionConfirmed={() => {
              toast.success("🎟️ Ticket purchased!");
            }}
            onError={(error) => {
              console.error("Transaction error:", error);
              if (error.message.includes("nonce too low")) {
                toast.error("Transaction stalled. Please try again.");
              } else {
                toast.error(`Error: ${error.message}`);
              }
            }}
          >
            Buy Ticket
          </TransactionButton> */}

          {/* <TransactionButton
  transaction={handleBuyTicket}
  onTransactionConfirmed={(receipt) => {
    console.log("Transaction confirmed:", receipt);
    refetchEvent(); // Refresh event data
  }}
  onError={(error) => {
    console.error("Transaction error:", error);
    if (!error.message.includes("User rejected")) {
      toast.error(`Error: ${error.message}`);
    }
  }}
  style={{
    width: "100%",
    backgroundColor: "#2563EB",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: "600",
  }}
  disabled={!account || !event.isActive}
>
  {!account ? "Connect Wallet" : !event.isActive ? "Event Inactive" : "Buy Ticket"}
</TransactionButton> */}

          <TransactionButton
            transaction={handleBuyTicket}
            onTransactionConfirmed={(receipt) => {
              toast.success("🎟️ Ticket purchased successfully!");
              console.log(receipt);
              // refetchEvent();
            }}
            onError={(error) => {
              console.error("Error:", error);
              toast.error(`Purchase failed: ${error.message}`);
            }}
          >
            Buy Ticket
          </TransactionButton>
        </div>
      </div>
    </div>
  );
}

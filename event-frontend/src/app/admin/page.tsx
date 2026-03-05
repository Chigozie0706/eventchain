"use client";
import { useState, useEffect, useCallback } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Abi, formatEther, zeroAddress } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { injected } from "wagmi/connectors";

import contractABI from "@/contract/abi.json";
import nftABI from "@/contract/nftAbi.json";

// ─── Config ────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "0xb9AD5b51fD436b0884A51259E351BA10f913Ef8d";
const NFT_ADDRESS = "0x4eB23b4c07F161b5cFCF53DfAe6c51D526b0CE62";

const CATEGORIES = [
  "Religious & Faith",
  "Education",
  "Business",
  "Technology",
  "Community",
  "Family & Personal",
  "Health & Wellness",
  "Arts & Culture",
  "Charity & Fundraising",
];
const APPROVAL_LABELS = ["Pending", "Approved", "Rejected"];
const REFUND_LABELS = ["No Refund", "Before Start", "Custom Buffer"];

// ─── Toast helpers ──────────────────────────────────────────────
const toastConfig = {
  success: {
    duration: 4000,
    icon: "✅",
    style: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(16,185,129,0.3)",
    },
  },
  error: {
    duration: 5000,
    icon: "❌",
    style: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(239,68,68,0.3)",
    },
  },
  loading: {
    icon: "⏳",
    style: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(59,130,246,0.3)",
    },
  },
};

// ─── Helpers ────────────────────────────────────────────────────
const shortAddr = (a: string) => `${a?.slice(0, 6)}…${a?.slice(-4)}`;
const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtCELO = (wei: bigint) => {
  try {
    return parseFloat(formatEther(wei)).toFixed(3);
  } catch {
    return "0.000";
  }
};

// ─── Types ──────────────────────────────────────────────────────
interface EventData {
  id: number;
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: bigint;
  fundsHeld: bigint;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  refundPolicy: number;
  paymentToken: string;
  category: number;
  approvalStatus: number;
  rejectionReason: string;
  attendees: string[];
  attendeeCount: number;
  subcategory: string;
}

// ─── NFT ABI inline (minimal) ───────────────────────────────────
const NFT_ABI = [
  {
    name: "setBaseURI",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_uri", type: "string" }],
    outputs: [],
  },
  {
    name: "baseTokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "tokenIdCounter",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
];

// ═══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Toaster position="top-right" />
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h2>
          <p className="text-gray-500 mb-6">
            Connect your admin wallet to continue
          </p>
          <button
            onClick={() => connect({ connector: injected() })}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-semibold"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard address={address!} disconnect={disconnect} />;
}

// ═══════════════════════════════════════════════════════════════
function AdminDashboard({
  address,
  disconnect,
}: {
  address: string;
  disconnect: () => void;
}) {
  const [page, setPage] = useState("overview");
  const [eventFilter, setEventFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [allEvents, setAllEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [newBaseURI, setNewBaseURI] = useState("");

  const publicClient = usePublicClient();

  // ── Reads ────────────────────────────────────────────────────
  const { data: eventCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getEventLength",
  });

  const { data: baseTokenURI, refetch: refetchNFT } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "baseTokenURI",
  });

  const baseURI = baseTokenURI as string | undefined;

  const { data: tokenIdCounter } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "tokenIdCounter",
  });

  // ── Writes ───────────────────────────────────────────────────
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const isBusy = isPending || isConfirming;

  const fetchSubcategory = async (eventCardImgUrl: string): Promise<string> => {
    try {
      if (!eventCardImgUrl) return "—";
      const res = await fetch(eventCardImgUrl);
      const data = await res.json();
      return data.subcategory ?? "—";
    } catch {
      return "—";
    }
  };

  // ── Load events via multicall ─────────────────────────────────
  const loadEvents = useCallback(async () => {
    if (!publicClient || !eventCount) return;
    setLoadingEvents(true);
    try {
      const count = Number(eventCount);
      if (count === 0) {
        setAllEvents([]);
        setLoadingEvents(false);
        return;
      }

      const calls = Array.from({ length: count }, (_, i) => ({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: contractABI.abi as Abi,
        functionName: "getEventById",
        args: [BigInt(i)],
      }));

      const results = await publicClient.multicall({ contracts: calls });

      // Replace the current map block with this
      const events: EventData[] = (
        await Promise.all(
          results.map(async (r, i) => {
            if (r.status !== "success") return null;
            const [ev, attendees] = r.result as any;

            // Fetch subcategory from IPFS metadata
            const subcategory = await fetchSubcategory(ev.eventCardImgUrl);

            return {
              id: i,
              owner: ev.owner,
              eventName: ev.eventName,
              eventCardImgUrl: ev.eventCardImgUrl,
              eventDetails: ev.eventDetails,
              startDate: Number(ev.startDate),
              endDate: Number(ev.endDate),
              eventLocation: ev.eventLocation,
              isActive: ev.isActive,
              ticketPrice: ev.ticketPrice,
              fundsHeld: ev.fundsHeld,
              minimumAge: Number(ev.minimumAge),
              maxCapacity: Number(ev.maxCapacity),
              isCanceled: ev.isCanceled,
              fundsReleased: ev.fundsReleased,
              refundPolicy: Number(ev.refundPolicy),
              paymentToken: ev.paymentToken,
              category: Number(ev.category),
              approvalStatus: Number(ev.approvalStatus),
              rejectionReason: ev.rejectionReason,
              attendees: attendees || [],
              attendeeCount: attendees?.length || 0,
              subcategory, // ← from IPFS
            };
          }),
        )
      ).filter(Boolean) as EventData[];

      setAllEvents(events);
    } catch (e: any) {
      toast.error("Failed to load events: " + e.message, toastConfig.error);
    }
    setLoadingEvents(false);
  }, [publicClient, eventCount]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Tx feedback ───────────────────────────────────────────────
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction confirmed ✓", toastConfig.success);
      setRejectModal(null);
      setRejectReason("");
      setNewBaseURI("");
      loadEvents();
      refetchNFT();
      refetchCount();
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message, toastConfig.error);

      console.log(writeError);
    }
  }, [writeError]);

  // ── Actions ───────────────────────────────────────────────────
  const handleApprove = (id: number) => {
    const toastId = toast.loading("Confirm in wallet...", toastConfig.loading);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI.abi,
      functionName: "approveEvent",
      args: [BigInt(id)],
    });
    setTimeout(() => toast.dismiss(toastId), 3000);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required", toastConfig.error);
      return;
    }
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI.abi,
      functionName: "rejectEvent",
      args: [BigInt(rejectModal!), rejectReason.trim()],
    });
  };

  const handleSetBaseURI = () => {
    if (!newBaseURI.trim()) {
      toast.error("Please enter a URI", toastConfig.error);
      return;
    }
    writeContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: "setBaseURI",
      args: [newBaseURI.trim()],
    });
  };

  // ── Stats ─────────────────────────────────────────────────────
  const stats = allEvents.reduce(
    (acc, ev) => {
      acc.total++;
      if (ev.approvalStatus === 0) acc.pending++;
      else if (ev.approvalStatus === 1) acc.approved++;
      else acc.rejected++;
      acc.tickets += ev.attendeeCount;
      acc.revenue += ev.fundsHeld;
      return acc;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      tickets: 0,
      revenue: BigInt(0),
    },
  );

  const filteredEvents = allEvents.filter((ev) => {
    if (eventFilter === "pending") return ev.approvalStatus === 0;
    if (eventFilter === "approved") return ev.approvalStatus === 1;
    if (eventFilter === "rejected") return ev.approvalStatus === 2;
    return true;
  });

  const navItems = [
    { id: "overview", label: "Overview", emoji: "📊" },
    { id: "pending", label: "Pending", emoji: "⏳", badge: stats.pending },
    { id: "events", label: "All Events", emoji: "🗓️" },
    { id: "tickets", label: "Tickets & Users", emoji: "🎟️" },
    { id: "nft", label: "NFT Management", emoji: "🖼️" },
  ];

  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="fixed top-16 left-0 h-[calc(100vh-64px)] w-56 bg-white border-r border-gray-200 flex flex-col z-40">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
              Admin Console
            </p>
            <p className="text-xs font-mono text-blue-600 truncate">
              {shortAddr(address)}
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  page === item.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{item.emoji}</span>
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100 space-y-2">
            <button
              onClick={loadEvents}
              disabled={loadingEvents}
              className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {loadingEvents ? <span className="animate-spin">↻</span> : "↻"}{" "}
              Refresh
            </button>
            <button
              onClick={disconnect}
              className="w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              Disconnect
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ml-56 flex-1 p-8">
          {/* OVERVIEW */}
          {page === "overview" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Overview
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                Platform statistics · Celo Mainnet
              </p>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Total Events",
                    value: stats.total,
                    color: "blue",
                    emoji: "🗓️",
                  },
                  {
                    label: "Tickets Sold",
                    value: stats.tickets,
                    color: "green",
                    emoji: "🎟️",
                  },
                  {
                    label: "Pending Approval",
                    value: stats.pending,
                    color: "amber",
                    emoji: "⏳",
                  },
                  {
                    label: "CELO In Escrow",
                    value: `${fmtCELO(stats.revenue)}`,
                    color: "purple",
                    emoji: "💰",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                  >
                    <div className="text-2xl mb-3">{s.emoji}</div>
                    <div className="text-3xl font-bold text-gray-800">
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Approval Breakdown
                  </h3>
                  {[
                    {
                      label: "Approved",
                      val: stats.approved,
                      color: "bg-green-500",
                    },
                    {
                      label: "Pending",
                      val: stats.pending,
                      color: "bg-amber-400",
                    },
                    {
                      label: "Rejected",
                      val: stats.rejected,
                      color: "bg-red-400",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 mb-3"
                    >
                      <div className={`w-2 h-2 rounded-full ${row.color}`} />
                      <span className="flex-1 text-sm text-gray-600">
                        {row.label}
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {row.val}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full`}
                          style={{
                            width: `${stats.total ? (row.val / stats.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    NFT Contract
                  </h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Proxy Address
                  </p>
                  <p className="text-xs font-mono text-blue-600 mb-4 break-all">
                    {NFT_ADDRESS}
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Minted
                      </p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {Number(tokenIdCounter ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Base URI
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 ${baseTokenURI ? "text-green-600" : "text-red-400"}`}
                      >
                        {baseTokenURI ? "Set ✓" : "None"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PENDING */}
          {page === "pending" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Pending Approval
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                {stats.pending} event{stats.pending !== 1 ? "s" : ""} awaiting
                review
              </p>
              {loadingEvents ? (
                <LoadingSpinner label="Loading events…" />
              ) : allEvents.filter((e) => e.approvalStatus === 0).length ===
                0 ? (
                <EmptyState emoji="✅" label="No pending events — all clear" />
              ) : (
                <div className="space-y-3">
                  {allEvents
                    .filter((e) => e.approvalStatus === 0)
                    .map((ev) => (
                      <EventCard
                        key={ev.id}
                        ev={ev}
                        expanded={expandedId === ev.id}
                        onToggle={() =>
                          setExpandedId(expandedId === ev.id ? null : ev.id)
                        }
                        onApprove={() => handleApprove(ev.id)}
                        onReject={() => setRejectModal(ev.id)}
                        isBusy={isBusy}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ALL EVENTS */}
          {page === "events" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                All Events
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                {stats.total} total on platform
              </p>

              <div className="flex gap-2 mb-5">
                {(["all", "pending", "approved", "rejected"] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        eventFilter === f
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === "pending" && stats.pending > 0 && (
                        <span className="ml-1.5 bg-amber-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {stats.pending}
                        </span>
                      )}
                    </button>
                  ),
                )}
              </div>

              {loadingEvents ? (
                <LoadingSpinner label="Loading…" />
              ) : filteredEvents.length === 0 ? (
                <EmptyState emoji="🗓️" label="No events in this category" />
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      expanded={expandedId === ev.id}
                      onToggle={() =>
                        setExpandedId(expandedId === ev.id ? null : ev.id)
                      }
                      onApprove={
                        ev.approvalStatus === 0
                          ? () => handleApprove(ev.id)
                          : undefined
                      }
                      onReject={
                        ev.approvalStatus === 0
                          ? () => setRejectModal(ev.id)
                          : undefined
                      }
                      isBusy={isBusy}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TICKETS & USERS */}
          {page === "tickets" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Tickets & Users
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                {stats.tickets} tickets sold across {stats.approved} approved
                events
              </p>

              {loadingEvents ? (
                <LoadingSpinner label="Loading…" />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {[
                          "Event",
                          "Category",
                          "Attendees",
                          "Capacity",
                          "Price",
                          "Funds Held",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allEvents.filter((e) => e.approvalStatus === 1)
                        .length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center text-gray-400 py-10 text-sm"
                          >
                            No approved events yet
                          </td>
                        </tr>
                      ) : (
                        allEvents
                          .filter((e) => e.approvalStatus === 1)
                          .map((ev) => (
                            <tr
                              key={ev.id}
                              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <p className="font-semibold text-sm text-gray-800">
                                  {ev.eventName}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">
                                  #{ev.id} · {shortAddr(ev.owner)}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                                  {CATEGORIES[ev.category] ?? "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold text-gray-800 font-mono">
                                {ev.attendeeCount}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{
                                        width: `${(ev.attendeeCount / ev.maxCapacity) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {ev.maxCapacity}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                {fmtCELO(ev.ticketPrice)} CELO
                              </td>
                              <td className="px-4 py-3 text-sm font-mono font-semibold text-green-600">
                                {fmtCELO(ev.fundsHeld)} CELO
                              </td>
                              <td className="px-4 py-3">
                                {ev.isCanceled ? (
                                  <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                                    Canceled
                                  </span>
                                ) : ev.fundsReleased ? (
                                  <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-1 rounded-full">
                                    Released
                                  </span>
                                ) : (
                                  <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                                    Active
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Attendee wallets */}
              {allEvents.some(
                (e) => e.attendeeCount > 0 && e.approvalStatus === 1,
              ) && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3">
                    Attendee Wallets by Event
                  </h2>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                            Event
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">
                            Wallet Address
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEvents
                          .filter(
                            (e) =>
                              e.attendeeCount > 0 && e.approvalStatus === 1,
                          )
                          .flatMap((ev) =>
                            ev.attendees.map((addr, i) => (
                              <tr
                                key={`${ev.id}-${i}`}
                                className="border-b border-gray-50 hover:bg-gray-50"
                              >
                                {i === 0 && (
                                  <td
                                    rowSpan={ev.attendees.length}
                                    className="px-4 py-3 border-r border-gray-100 align-top"
                                  >
                                    <p className="font-semibold text-sm text-gray-800">
                                      {ev.eventName}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      ID #{ev.id}
                                    </p>
                                  </td>
                                )}
                                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                  {addr}
                                </td>
                              </tr>
                            )),
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NFT MANAGEMENT */}
          {page === "nft" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                NFT Management
              </h1>
              <p className="text-sm text-gray-400 mb-6">
                Manage ticket NFT base URI and metadata
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-3">🖼️</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {Number(tokenIdCounter ?? 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                    Total NFTs Minted
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-2xl mb-3">🔗</div>
                  <div
                    className={`text-3xl font-bold ${baseTokenURI ? "text-green-600" : "text-red-400"}`}
                  >
                    {baseTokenURI ? "Active" : "Not Set"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                    Base URI Status
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    EventChain Proxy
                  </p>
                  <p className="text-sm font-mono text-blue-600 break-all">
                    {CONTRACT_ADDRESS}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    NFT Proxy
                  </p>
                  <p className="text-sm font-mono text-blue-600 break-all">
                    {NFT_ADDRESS}
                  </p>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Current Base URI
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    All ticket NFTs use this as their metadata source
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-blue-600 min-h-[44px] break-all">
                    {baseURI ? (
                      baseURI
                    ) : (
                      <span className="text-gray-400 italic">
                        No base URI set
                      </span>
                    )}
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Update Base URI
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Upload your event banner to Pinata → get CID → create
                    metadata JSON → upload → paste URI below
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700 mb-4">
                    💡 Format:{" "}
                    <span className="font-mono">
                      ipfs://QmYourMetadataCIDHere/
                    </span>
                  </div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                    New Base URI
                  </label>
                  <input
                    type="text"
                    value={newBaseURI}
                    onChange={(e) => setNewBaseURI(e.target.value)}
                    placeholder="ipfs://QmYourMetadataCIDHere/"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={handleSetBaseURI}
                      disabled={isBusy || !newBaseURI.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBusy ? "Confirming…" : "Set Base URI"}
                    </button>
                    <button
                      onClick={() => setNewBaseURI("")}
                      className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                  {isBusy && (
                    <p className="text-xs text-blue-500 mt-2">
                      {isPending
                        ? "⏳ Waiting for wallet confirmation…"
                        : "⏳ Confirming on-chain…"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reject Modal */}
      {rejectModal !== null && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-1">
              Reject Event #{rejectModal}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {allEvents.find((e) => e.id === rejectModal)?.eventName}
            </p>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why — the creator can fix and resubmit…"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isBusy || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isBusy ? "Confirming…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Event Card ────────────────────────────────────────────────
function EventCard({
  ev,
  expanded,
  onToggle,
  onApprove,
  onReject,
  isBusy,
}: {
  ev: EventData;
  expanded: boolean;
  onToggle: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isBusy: boolean;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Fetch actual image from metadata JSON
  useEffect(() => {
    if (!ev.eventCardImgUrl) return;
    fetch(ev.eventCardImgUrl)
      .then((r) => r.json())
      .then((data) => setImgSrc(data.image))
      .catch(() => setImgSrc(null));
  }, [ev.eventCardImgUrl]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex gap-4 p-4 items-start">
        {imgSrc ? (
          <a
            href={imgSrc}
            target="_blank"
            rel="noopener noreferrer"
            title="Click to view full image"
          >
            <img
              src={imgSrc}
              alt={ev.eventName}
              className="w-16 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-400 transition-all"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </a>
        ) : (
          <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
            🎟️
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{ev.eventName}</p>
          <div className="flex flex-wrap gap-3 mt-1">
            {[
              `#${ev.id}`,
              `📅 ${formatDate(ev.startDate)}`,
              `📍 ${ev.eventLocation}`,
              `🎟 ${ev.attendeeCount}/${ev.maxCapacity}`,
              `💰 ${fmtCELO(ev.ticketPrice)} CELO`,
            ].map((item) => (
              <span key={item} className="text-xs text-gray-400">
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                ev.approvalStatus === 0
                  ? "bg-amber-100 text-amber-700"
                  : ev.approvalStatus === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
              }`}
            >
              {APPROVAL_LABELS[ev.approvalStatus]}
            </span>
            <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {CATEGORIES[ev.category] ?? "Other"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 items-center flex-shrink-0">
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all disabled:opacity-50"
            >
              Reject
            </button>
          )}
          <button
            onClick={onToggle}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <div className="mt-3 mb-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-blue-400 uppercase tracking-wide font-semibold">
              Subcategory
            </span>
            <span className="text-xs font-semibold text-blue-700">
              {ev.subcategory ?? "—"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-3 mb-3">
            {[
              { label: "Owner", val: shortAddr(ev.owner) },
              {
                label: "Payment Token",
                val:
                  ev.paymentToken === zeroAddress
                    ? "CELO"
                    : shortAddr(ev.paymentToken),
              },
              { label: "Refund Policy", val: REFUND_LABELS[ev.refundPolicy] },
              { label: "Min Age", val: `${ev.minimumAge} yrs` },
              { label: "End Date", val: formatDate(ev.endDate) },
              { label: "Funds Held", val: `${fmtCELO(ev.fundsHeld)} CELO` },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  {row.label}
                </p>
                <p className="text-xs font-mono text-gray-700">{row.val}</p>
              </div>
            ))}
          </div>
          {ev.eventDetails && (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
              {ev.eventDetails}
            </p>
          )}
          {ev.rejectionReason && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">
                Rejection Reason
              </p>
              <p className="text-xs text-red-700">{ev.rejectionReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────
function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function EmptyState({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
      <div className="text-4xl mb-3">{emoji}</div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

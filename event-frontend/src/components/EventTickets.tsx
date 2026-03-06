"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast, Toaster } from "react-hot-toast";
import contractABI from "@/contract/abi.json";
import { getTokenByAddress } from "@/utils/tokens";

const CONTRACT_ADDRESS = "0xb9AD5b51fD436b0884A51259E351BA10f913Ef8d";

interface Event {
  id: string;
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
  ticketPrice: number;
  fundsHeld: number;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
  paymentToken: string;
}

const REFUND_POLICY_NAMES: Record<number, string> = {
  0: "No Refunds",
  1: "Before Event Start",
  2: "Custom Buffer Period",
};

export default function EventTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingWithdrawal, setPending] = useState(0);
  const [pendingToken, setPendingToken] = useState<string>("CELO");
  const { address, isConnected } = useAccount();
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>(
    {},
  );
  const { writeContractAsync } = useWriteContract();

  const {
    data,
    error: contractError,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getUserEvents",
    args: [address],
  });

  // Token address for pull payment — derived from first event, zero address as fallback
  const paymentTokenAddress = (events[0]?.paymentToken ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const { data: pendingData, refetch: refetchPending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getPendingWithdrawal",
    // contract signature: getPendingWithdrawal(address user, address token)
    args: [address, paymentTokenAddress],
    query: {
      // only fire once wallet is connected AND events have loaded (so token address is known)
      enabled: !!address && events.length > 0,
      staleTime: 0,
    },
  });

  useEffect(() => {
    if (pendingData == null) return;
    // Derive decimals + symbol from the first event's token — fall back to 18 / CELO
    const firstToken = events[0]?.paymentToken;
    const token = firstToken ? getTokenByAddress(firstToken) : null;
    const decimals = token?.decimals ?? 18;
    const symbol = token?.symbol ?? "CELO";
    setPending(Number(pendingData) / Math.pow(10, decimals));
    setPendingToken(symbol);
  }, [pendingData, events]);

  useEffect(() => {
    if (isError) {
      console.error("Contract read error:", {
        error: contractError,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "getUserEvents",
        timestamp: new Date().toISOString(),
      });
    }
  }, [isError, contractError]);

  // Resolve eventCardImgUrl — may be a metadata JSON (new events) or direct image URL (old events)
  const resolveImageUrl = async (rawUrl: string): Promise<string> => {
    if (!rawUrl) return "/default-event.jpg";
    const url = rawUrl.startsWith("http")
      ? rawUrl
      : `https://ipfs.io/ipfs/${rawUrl}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json?.image ?? url; // new format: { image: "..." }
    } catch {
      return url; // old format — raw URL is a direct image
    }
  };

  useEffect(() => {
    if (isSuccess && data) {
      (async () => {
        try {
          if (!Array.isArray(data) || data.length !== 2)
            throw new Error("Bad format");
          const [eventIds, userEvents] = data as [string[], any[]];

          const parsed = userEvents.map((event, i) => {
            const token = getTokenByAddress(event.paymentToken);
            const decimals = token?.decimals || 18;
            return {
              id: eventIds[i],
              owner: event.owner,
              eventName: event.eventName,
              eventCardImgUrl: event.eventCardImgUrl, // raw — resolved below
              eventDetails: event.eventDetails,
              startDate: Number(event.startDate),
              endDate: Number(event.endDate),
              startTime: Number(event.startTime),
              endTime: Number(event.endTime),
              eventLocation: event.eventLocation,
              isActive: event.isActive,
              ticketPrice: Number(event.ticketPrice) / Math.pow(10, decimals),
              fundsHeld: Number(event.fundsHeld) / Math.pow(10, decimals),
              minimumAge: Number(event.minimumAge),
              maxCapacity: Number(event.maxCapacity),
              isCanceled: event.isCanceled,
              fundsReleased: event.fundsReleased,
              exists: event.exists,
              refundPolicy: Number(event.refundPolicy),
              refundBufferHours: Number(event.refundBufferHours),
              paymentToken: event.paymentToken,
            };
          });

          // Render cards immediately, resolve images in background per card
          setEvents(parsed);
          parsed.forEach(async (ev) => {
            const resolved = await resolveImageUrl(ev.eventCardImgUrl);
            setEvents((prev) =>
              prev.map((e) =>
                e.id === ev.id ? { ...e, eventCardImgUrl: resolved } : e,
              ),
            );
          });
        } catch {
          toast.error("Failed to load events data");
        }
      })();
    }
  }, [isSuccess, data]);

  const requestRefund = async (id: string) => {
    if (!isConnected || !address) {
      toast.error("Connect your wallet first");
      return;
    }
    setRefundLoading((p) => ({ ...p, [id]: true }));
    const tid = toast.loading("Processing refund…");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [BigInt(id)],
      });
      toast.dismiss(tid);
      toast.success("💰 Refund requested successfully!");
      await refetch();
      // Delay so chain state settles before reading pendingWithdrawal
      setTimeout(async () => {
        await refetchPending();
        toast.success(
          "✅ Funds added to your pending withdrawal — check the banner above!",
        );
      }, 1500);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err?.shortMessage || "Refund failed");
    } finally {
      setRefundLoading((p) => ({ ...p, [id]: false }));
    }
  };

  const handleWithdraw = async () => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }
    const tid = toast.loading("Withdrawing…");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "withdraw",
        args: [paymentTokenAddress],
      });
      toast.dismiss(tid);
      toast.success("💸 Withdrawal successful!");
      await refetchPending();
      setTimeout(() => {
        toast.success("✅ Funds sent to your wallet");
      }, 1000);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err?.shortMessage || "Withdrawal failed");
    }
  };

  const getStatus = (event: Event) => {
    if (event.isCanceled) return { label: "Canceled", variant: "canceled" };
    if (!event.isActive) return { label: "Inactive", variant: "inactive" };
    const now = Date.now() / 1000;
    if (now < event.startDate)
      return { label: "Upcoming", variant: "upcoming" };
    if (now <= event.endDate) return { label: "Live Now", variant: "live" };
    return { label: "Ended", variant: "ended" };
  };

  const getRefundInfo = (event: Event) => {
    if (event.isCanceled)
      return {
        eligible: true,
        reason: "Event canceled — full refund available",
      };
    const now = Date.now() / 1000;
    if (event.refundPolicy === 0)
      return { eligible: false, reason: "No refunds for this event" };
    if (event.refundPolicy === 1) {
      return now < event.startDate
        ? { eligible: true, reason: "Refund available before event starts" }
        : { eligible: false, reason: "Event has already started" };
    }
    if (event.refundPolicy === 2) {
      const deadline = event.startDate - event.refundBufferHours * 3600;
      if (now < deadline) {
        const h = Math.floor((deadline - now) / 3600);
        return {
          eligible: true,
          reason: `${h}h remaining until refund deadline`,
        };
      }
      return {
        eligible: false,
        reason: `${event.refundBufferHours}h buffer period expired`,
      };
    }
    return { eligible: false, reason: "Unknown refund policy" };
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600),
      m = Math.floor((secs % 3600) / 60);
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  const formatPrice = (price: number, tokenAddr: string) => {
    const token = getTokenByAddress(tokenAddr);
    return `${price.toFixed(token?.decimals === 6 ? 6 : 4)} ${token?.symbol || "?"}`;
  };

  // URL already resolved in parsing useEffect — just return it
  const getImageUrl = (event: Event) =>
    event.eventCardImgUrl || "/default-event.jpg";

  /* ── Wallet not connected ── */
  if (!isConnected)
    return (
      <>
        <style>{`${BASE_STYLES}`}</style>
        <div className="et-root">
          <div className="et-glow" />
          <div className="et-grid-bg" />
          <Toaster position="top-right" />
          <div className="et-centered">
            <div className="et-empty-icon">
              <svg
                width="36"
                height="36"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="var(--ec-green)"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h7m4-4h4m0 0l-2-2m2 2l-2 2"
                />
              </svg>
            </div>
            <h2 className="et-empty-title">Connect Your Wallet</h2>
            <p className="et-empty-sub">
              Access your event tickets and manage refunds on the Celo
              blockchain.
            </p>
          </div>
        </div>
      </>
    );

  /* ── Loading ── */
  if (isLoading)
    return (
      <>
        <style>{`${BASE_STYLES}`}</style>
        <div className="et-root">
          <div className="et-glow" />
          <div className="et-grid-bg" />
          <div className="et-centered">
            <div className="et-loader" />
            <p className="et-empty-sub" style={{ marginTop: 16 }}>
              Loading your tickets…
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{`${BASE_STYLES}`}</style>
      <div className="et-root">
        <div className="et-glow" />
        <div className="et-grid-bg" />
        <Toaster position="top-right" />

        <div className="et-inner">
          {/* Header */}
          <div className="et-header">
            <div>
              <div className="et-eyebrow">Your Account</div>
              <h1 className="et-page-title">My Tickets</h1>
              <p className="et-page-sub">
                Manage tickets &amp; process refunds with pull payment
              </p>
            </div>
            <div className="et-header-chip">
              <div className="et-chip-dot" />
              <span className="et-chip-count">{events.length}</span>
              <span className="et-chip-label">
                ticket{events.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Pending withdrawal banner */}
          {pendingWithdrawal > 0 && (
            <div className="et-withdraw-banner">
              <div className="et-withdraw-left">
                <div className="et-withdraw-icon">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="var(--ec-green)"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="et-withdraw-label">Pending Withdrawal</div>
                  <div className="et-withdraw-val">
                    {pendingWithdrawal.toFixed(4)} {pendingToken}
                  </div>
                  <div className="et-withdraw-hint">
                    Pull payment — withdraw when ready
                  </div>
                </div>
              </div>
              <button className="et-withdraw-btn" onClick={handleWithdraw}>
                Withdraw Funds
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Debug panel — remove before production */}
          {process.env.NODE_ENV === "development" && (
            <div className="et-debug-panel">
              <div className="et-debug-title">🔍 Pull Payment Debug</div>
              <div className="et-debug-row">
                <span className="et-debug-key">Wallet</span>
                <span className="et-debug-val">
                  {address
                    ? `${address.slice(0, 6)}…${address.slice(-4)}`
                    : "not connected"}
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">pendingData (raw)</span>
                <span className="et-debug-val">
                  {pendingData !== undefined
                    ? String(pendingData)
                    : "undefined"}
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">
                  pendingWithdrawal (formatted)
                </span>
                <span className="et-debug-val">
                  {pendingWithdrawal} {pendingToken}
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">Contract</span>
                <span className="et-debug-val">
                  {CONTRACT_ADDRESS.slice(0, 6)}…{CONTRACT_ADDRESS.slice(-4)}
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">Events loaded</span>
                <span className="et-debug-val">{events.length}</span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">First event token</span>
                <span className="et-debug-val">
                  {events[0]?.paymentToken ?? "none"} ({pendingToken})
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">getPendingWithdrawal args</span>
                <span className="et-debug-val">
                  [{address?.slice(0, 8)}…,{" "}
                  {events[0]?.paymentToken ?? "waiting…"}]
                </span>
              </div>
              <div className="et-debug-row">
                <span className="et-debug-key">Query enabled</span>
                <span className="et-debug-val">
                  {String(!!address && events.length > 0)}
                </span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {events.length === 0 ? (
            <div className="et-empty-wrap">
              <div className="et-empty-icon">
                <svg
                  width="32"
                  height="32"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="var(--ec-green)"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
              <h2 className="et-empty-title">No Tickets Yet</h2>
              <p className="et-empty-sub">
                Start exploring events and purchase your first ticket!
              </p>
            </div>
          ) : (
            <div className="et-list">
              {events.map((event, i) => {
                const status = getStatus(event);
                const refundInfo = getRefundInfo(event);
                return (
                  <div
                    key={event.id}
                    className="et-ticket-row fade-up"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {/* Image */}
                    <div className="et-ticket-img-wrap">
                      <img
                        src={getImageUrl(event)}
                        alt={event.eventName}
                        className="et-ticket-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-event.jpg";
                        }}
                      />
                      <div className="et-ticket-img-overlay" />
                      <div
                        className={`et-status-badge et-status-${status.variant}`}
                      >
                        <span className="et-status-dot" />
                        {status.label}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="et-ticket-body">
                      <h2 className="et-ticket-name">{event.eventName}</h2>
                      <p className="et-ticket-desc">{event.eventDetails}</p>

                      {/* Meta grid */}
                      <div className="et-meta-grid">
                        <div className="et-meta-item">
                          <div className="et-meta-icon loc">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Location</div>
                            <div className="et-meta-val">
                              {event.eventLocation}
                            </div>
                          </div>
                        </div>

                        <div className="et-meta-item">
                          <div className="et-meta-icon date">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Dates</div>
                            <div className="et-meta-val">
                              {formatDate(event.startDate)} —{" "}
                              {formatDate(event.endDate)}
                            </div>
                          </div>
                        </div>

                        <div className="et-meta-item">
                          <div className="et-meta-icon time">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path strokeLinecap="round" d="M12 6v6l4 2" />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Time</div>
                            <div className="et-meta-val">
                              {formatTime(event.startTime)} —{" "}
                              {formatTime(event.endTime)}
                            </div>
                          </div>
                        </div>

                        <div className="et-meta-item">
                          <div className="et-meta-icon price">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Ticket Price</div>
                            <div className="et-meta-val et-price">
                              {formatPrice(
                                event.ticketPrice,
                                event.paymentToken,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="et-meta-item">
                          <div className="et-meta-icon cap">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Capacity</div>
                            <div className="et-meta-val">
                              {event.maxCapacity} attendees
                            </div>
                          </div>
                        </div>

                        <div className="et-meta-item">
                          <div className="et-meta-icon shield">
                            <svg
                              width="13"
                              height="13"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div className="et-meta-lbl">Refund Policy</div>
                            <div className="et-meta-val">
                              {REFUND_POLICY_NAMES[event.refundPolicy]}
                            </div>
                            {event.refundPolicy === 2 && (
                              <div className="et-meta-hint">
                                {event.refundBufferHours}h buffer
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Refund eligibility strip */}
                      <div
                        className={`et-refund-strip ${refundInfo.eligible ? "eligible" : "ineligible"}`}
                      >
                        <svg
                          width="15"
                          height="15"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          {refundInfo.eligible ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          )}
                        </svg>
                        <span>{refundInfo.reason}</span>
                      </div>

                      {/* CTA row */}
                      <div className="et-cta-row">
                        <button
                          onClick={() => requestRefund(event.id)}
                          disabled={
                            refundLoading[event.id] || !refundInfo.eligible
                          }
                          className={`et-refund-btn ${refundInfo.eligible ? "active" : "disabled"}`}
                        >
                          {refundLoading[event.id] ? (
                            <>
                              <div className="et-spin" /> Processing…
                            </>
                          ) : (
                            <>
                              <svg
                                width="15"
                                height="15"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                                />
                              </svg>
                              Request Refund
                            </>
                          )}
                        </button>
                        {!refundInfo.eligible && !event.isCanceled && (
                          <p className="et-no-refund-note">
                            Refunds are no longer available for this event
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Shared styles ── */
const BASE_STYLES = `

  :root {
    --ec-bg:      #020617;
    --ec-surface: #0F172A;
    --ec-s2:      #1E293B;
    --ec-border:  rgba(53,208,127,0.12);
    --ec-green:   #35D07F;
    --ec-cyan:    #22D3EE;
    --ec-text:    #F8FAFC;
    --ec-muted:   rgba(248,250,252,0.45);
    --ec-dimmed:  rgba(248,250,252,0.18);
  }

  .et-root {
    min-height: 100vh; background: var(--ec-bg);
    font-family: var(--ec-font-body); color: var(--ec-text);
    padding-top: 72px;
  }

  .et-glow {
    position: fixed; top: -200px; left: 50%; transform: translateX(-50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse, rgba(53,208,127,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }
  .et-grid-bg {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(53,208,127,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(53,208,127,0.025) 1px, transparent 1px);
    background-size: 64px 64px;
    pointer-events: none; z-index: 0;
    mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 80%);
  }

  .et-inner {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto; padding: 48px 24px 80px;
  }

  /* Header */
  .et-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 36px;
  }
  .et-eyebrow {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.15em; color: var(--ec-green); margin-bottom: 6px;
    display: flex; align-items: center; gap: 8px;
  }
  .et-eyebrow::before {
    content: ''; display: inline-block;
    width: 18px; height: 2px; background: var(--ec-green); border-radius: 2px;
  }
  .et-page-title {
    font-family: var(--ec-font-display);
    font-size: clamp(28px, 4vw, 44px); font-weight: 800;
    letter-spacing: -0.025em; line-height: 1.05; margin-bottom: 6px;
  }
  .et-page-sub { font-size: 14px; color: var(--ec-muted); }

  .et-header-chip {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 18px;
    background: var(--ec-surface); border: 1px solid var(--ec-border); border-radius: 14px;
  }
  .et-chip-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ec-green); animation: et-pulse 2s infinite; }
  @keyframes et-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(53,208,127,0.5)}50%{box-shadow:0 0 0 5px rgba(53,208,127,0)} }
  .et-chip-count { font-family: var(--ec-font-display); font-size: 18px; font-weight: 800; color: var(--ec-text); }
  .et-chip-label { font-size: 12px; color: var(--ec-dimmed); text-transform: uppercase; letter-spacing: 0.08em; }

  /* Withdraw banner */
  .et-withdraw-banner {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(53,208,127,0.1) 0%, rgba(34,211,238,0.07) 100%);
    border: 1px solid rgba(53,208,127,0.3);
    border-radius: 18px; margin-bottom: 28px;
  }
  .et-withdraw-left { display: flex; align-items: center; gap: 16px; }
  .et-withdraw-icon {
    width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
    background: rgba(53,208,127,0.12); border: 1px solid rgba(53,208,127,0.25);
    display: flex; align-items: center; justify-content: center;
  }
  .et-withdraw-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ec-dimmed); margin-bottom: 4px; }
  .et-withdraw-val {
    font-family: var(--ec-font-display); font-size: 26px; font-weight: 800;
    background: linear-gradient(135deg, var(--ec-green), var(--ec-cyan));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .et-withdraw-hint { font-size: 12px; color: var(--ec-dimmed); margin-top: 2px; }
  .et-withdraw-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, var(--ec-green), #28b86d);
    border: none; border-radius: 12px; cursor: pointer;
    font-family: var(--ec-font-display); font-size: 13px; font-weight: 700; color: #020617;
    transition: all 0.25s ease; flex-shrink: 0;
  }
  .et-withdraw-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(53,208,127,0.3); }

  /* Ticket card row */
  .et-list { display: flex; flex-direction: column; gap: 20px; }

  .et-ticket-row {
    display: flex; flex-direction: row;
    background: var(--ec-surface);
    border: 1px solid var(--ec-border);
    border-radius: 20px; overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
  }
  .et-ticket-row:hover {
    border-color: rgba(53,208,127,0.28);
    box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(53,208,127,0.15);
  }
  @media (max-width: 768px) { .et-ticket-row { flex-direction: column; } }

  /* Image */
  .et-ticket-img-wrap {
    position: relative; flex-shrink: 0;
    width: 280px; min-height: 240px;
    background: var(--ec-s2); overflow: hidden;
  }
  @media (max-width: 768px) { .et-ticket-img-wrap { width: 100%; height: 200px; } }

  .et-ticket-img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8); transition: transform 0.5s ease; }
  .et-ticket-row:hover .et-ticket-img { transform: scale(1.04); }
  .et-ticket-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(15,23,42,0.9) 100%);
    z-index: 1;
  }

  /* Status badge */
  .et-status-badge {
    position: absolute; top: 12px; left: 12px; z-index: 3;
    display: flex; align-items: center; gap: 6px;
    padding: 5px 13px; border-radius: 100px;
    font-family: var(--ec-font-display); font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    backdrop-filter: blur(10px);
  }
  .et-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .et-status-live     { background: rgba(53,208,127,0.12); border: 1px solid rgba(53,208,127,0.4); color: #35D07F; }
  .et-status-live .et-status-dot { animation: et-pulse 2s infinite; }
  .et-status-upcoming { background: rgba(34,211,238,0.1);  border: 1px solid rgba(34,211,238,0.3);  color: #22D3EE; }
  .et-status-ended    { background: rgba(248,250,252,0.07); border: 1px solid rgba(248,250,252,0.15); color: var(--ec-muted); }
  .et-status-canceled { background: rgba(239,68,68,0.1);   border: 1px solid rgba(239,68,68,0.3);   color: #f87171; }
  .et-status-inactive { background: rgba(248,250,252,0.05); border: 1px solid rgba(248,250,252,0.1); color: var(--ec-dimmed); }

  /* Body */
  .et-ticket-body { flex: 1; padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
  .et-ticket-name {
    font-family: var(--ec-font-display); font-size: 20px; font-weight: 800;
    color: var(--ec-text); line-height: 1.2;
  }
  .et-ticket-desc { font-size: 13px; color: var(--ec-dimmed); line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

  /* Meta grid */
  .et-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .et-meta-item { display: flex; align-items: flex-start; gap: 10px; }
  .et-meta-icon {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .et-meta-icon svg { fill: none; }
  .et-meta-icon.loc   { background: rgba(34,211,238,0.1);  } .et-meta-icon.loc svg   { stroke: #22D3EE; }
  .et-meta-icon.date  { background: rgba(34,211,238,0.1);  } .et-meta-icon.date svg  { stroke: #22D3EE; }
  .et-meta-icon.time  { background: rgba(34,211,238,0.1);  } .et-meta-icon.time svg  { stroke: #22D3EE; }
  .et-meta-icon.price { background: rgba(53,208,127,0.1);  } .et-meta-icon.price svg { stroke: #35D07F; }
  .et-meta-icon.cap   { background: rgba(248,113,113,0.1); } .et-meta-icon.cap svg   { stroke: #f87171; }
  .et-meta-icon.shield{ background: rgba(34,211,238,0.1);  } .et-meta-icon.shield svg{ stroke: #22D3EE; }

  .et-meta-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ec-dimmed); margin-bottom: 2px; }
  .et-meta-val { font-size: 13px; font-weight: 500; color: var(--ec-muted); }
  .et-meta-val.et-price { font-family: var(--ec-font-display); font-size: 15px; font-weight: 800; color: var(--ec-green); }
  .et-meta-hint { font-size: 11px; color: var(--ec-dimmed); margin-top: 2px; }

  /* Refund strip */
  .et-refund-strip {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 500;
  }
  .et-refund-strip svg { fill: none; flex-shrink: 0; }
  .et-refund-strip.eligible   { background: rgba(53,208,127,0.07); border: 1px solid rgba(53,208,127,0.2); color: var(--ec-green); }
  .et-refund-strip.eligible svg { stroke: var(--ec-green); }
  .et-refund-strip.ineligible { background: rgba(248,250,252,0.03); border: 1px solid rgba(248,250,252,0.07); color: var(--ec-dimmed); }
  .et-refund-strip.ineligible svg { stroke: var(--ec-dimmed); }

  /* CTA */
  .et-cta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 4px; border-top: 1px solid rgba(53,208,127,0.07); }
  .et-refund-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px; border: none; border-radius: 12px; cursor: pointer;
    font-family: var(--ec-font-body); font-size: 13px; font-weight: 600;
    transition: all 0.25s ease;
  }
  .et-refund-btn.active {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171;
  }
  .et-refund-btn.active:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); transform: translateY(-1px); }
  .et-refund-btn.disabled {
    background: rgba(248,250,252,0.03); border: 1px solid rgba(248,250,252,0.07);
    color: var(--ec-dimmed); cursor: not-allowed;
  }
  .et-no-refund-note { font-size: 12px; color: var(--ec-dimmed); font-style: italic; }

  /* Empty / centered */
  .et-centered {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 70vh; text-align: center; padding: 40px;
  }
  .et-empty-wrap {
    display: flex; flex-direction: column; align-items: center; text-align: center; padding: 80px 24px;
  }
  .et-empty-icon {
    width: 80px; height: 80px; border-radius: 22px;
    background: rgba(53,208,127,0.08); border: 1px solid rgba(53,208,127,0.18);
    display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
  }
  .et-empty-title { font-family: var(--ec-font-display); font-size: 24px; font-weight: 800; margin-bottom: 10px; }
  .et-empty-sub   { font-size: 14px; color: var(--ec-muted); max-width: 340px; line-height: 1.7; }

  /* Loader */
  .et-loader {
    width: 52px; height: 52px;
    border: 3px solid rgba(53,208,127,0.15); border-top-color: var(--ec-green);
    border-radius: 50%; animation: et-spin 0.9s linear infinite;
  }
  @keyframes et-spin { to { transform: rotate(360deg); } }

  /* Spinner */
  .et-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(248,113,113,0.25); border-top-color: #f87171;
    border-radius: 50%; animation: et-spin 0.7s linear infinite;
  }

  /* Debug panel */
  .et-debug-panel {
    margin-bottom: 20px;
    padding: 16px 20px;
    background: rgba(251,191,36,0.06);
    border: 1px solid rgba(251,191,36,0.25);
    border-radius: 14px;
    font-family: 'DM Mono', 'Fira Code', monospace;
  }
  .et-debug-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: #FBBF24; margin-bottom: 10px;
  }
  .et-debug-row {
    display: flex; gap: 12px; align-items: baseline;
    padding: 4px 0; border-bottom: 1px solid rgba(251,191,36,0.08);
  }
  .et-debug-row:last-child { border-bottom: none; }
  .et-debug-key { font-size: 11px; color: rgba(251,191,36,0.5); min-width: 200px; flex-shrink: 0; }
  .et-debug-val { font-size: 12px; color: #FBBF24; word-break: break-all; }

  /* Fade up */
  .fade-up { animation: fu 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes fu { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
`;

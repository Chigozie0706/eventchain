"use client";
import { useCallback, useEffect, useState } from "react";
import CreatorEventCard from "@/components/CreatorEventCard";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useBlockNumber,
  useWalletClient,
} from "wagmi";
import contractABI from "../../contract/abi.json";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";
import { getTokenByAddress } from "@/utils/tokens";
import { getReferralTag, submitReferral } from "@divvi/referral-sdk";
import { encodeFunctionData } from "viem";
import Link from "next/link";

interface Event {
  index: number;
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
  isCanceled: boolean;
  fundsReleased: boolean;
  paymentToken: string;
}

const CONTRACT_ADDRESS = "0xb9AD5b51fD436b0884A51259E351BA10f913Ef8d";

export default function MyEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();
  const { address: connectedAddress } = useAccount();
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const { data: walletClient } = useWalletClient();

  const { data: hash, isPending: isWriting } = useWriteContract();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const DIVVI_CONFIG = {
    user: connectedAddress as `0x${string}`,
    consumer: "0x5e23d5Be257d9140d4C5b12654111a4D4E18D9B2" as `0x${string}`,
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

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
    functionName: "getActiveEventsByCreator",
    account: connectedAddress,
  });

  const reportToDivvi = async (txHash: `0x${string}`) => {
    try {
      await submitReferral({ txHash, chainId: 42220 });
    } catch {}
  };

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (isError) setError("Failed to load your events");
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
      return json?.image ?? url; // new format has { image: "..." }
    } catch {
      return url; // old format — raw URL is the image directly
    }
  };

  useEffect(() => {
    if (isSuccess && data) {
      (async () => {
        try {
          if (!Array.isArray(data) || data.length !== 2)
            throw new Error("Bad format");
          const [indexes, eventData] = data as [bigint[], any[]];

          const parsed = eventData.map((event, idx) => {
            const t = getTokenByAddress(event.paymentToken);
            const decimals = t?.decimals ?? 18;
            return {
              index: Number(indexes[idx]),
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
              ticketPrice: Number(
                ethers.formatUnits(event.ticketPrice, decimals),
              ),
              fundsHeld: Number(ethers.formatUnits(event.fundsHeld, decimals)),
              isCanceled: event.isCanceled,
              fundsReleased: event.fundsReleased,
              paymentToken: event.paymentToken,
            };
          });

          // Render cards immediately, then resolve images in background per card
          setEvents(parsed);
          parsed.forEach(async (ev) => {
            const resolved = await resolveImageUrl(ev.eventCardImgUrl);
            setEvents((prev) =>
              prev.map((e) =>
                e.index === ev.index ? { ...e, eventCardImgUrl: resolved } : e,
              ),
            );
          });
        } catch {
          setError("Error processing your event data");
        }
      })();
    }
  }, [isSuccess, data]);

  useEffect(() => {
    refetch();
  }, [blockNumber, refetch]);

  const cancelEvent = useCallback(
    async (eventId: number) => {
      if (!connectedAddress || !walletClient) {
        toast.error("Please connect your wallet first");
        return;
      }
      setCancelingId(eventId);
      const toastId = toast.loading("Preparing cancellation…");
      try {
        const divviSuffix = getReferralTag(DIVVI_CONFIG);
        const encodedFn = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "cancelEvent",
          args: [eventId],
        });
        const dataWithDivvi = (encodedFn +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;
        toast.loading("Waiting for wallet confirmation…", { id: toastId });
        const txHash = await walletClient.sendTransaction({
          account: connectedAddress,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
        });
        toast.success("Cancellation submitted!", { id: toastId });
        await reportToDivvi(txHash);
        setTimeout(() => refetch(), 5000);
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel event", { id: toastId });
      } finally {
        setCancelingId(null);
      }
    },
    [connectedAddress, walletClient, refetch],
  );

  const deleteEvent = async (eventId: number) => {
    const toastId = toast.loading("Deleting event…");
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "deleteEventById",
        args: [eventId],
      });
      toast.success("Event deleted!", { id: toastId });
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete event",
        { id: toastId },
      );
    }
  };

  const claimFunds = useCallback(
    async (eventId: number) => {
      if (!connectedAddress || !walletClient) {
        toast.error("Please connect your wallet first");
        return;
      }
      // Find the event to get its payment token
      const event = events.find((e) => e.index === eventId);
      if (!event) {
        toast.error("Event not found");
        return;
      }
      const tokenAddress = (event.paymentToken ??
        "0x0000000000000000000000000000000000000000") as `0x${string}`;

      setClaimingId(eventId);
      const toastId = toast.loading("Preparing claim…");
      try {
        // Step 1: releaseFunds — moves funds from fundsHeld into pendingWithdrawals
        const divviSuffix = getReferralTag(DIVVI_CONFIG);
        const encodedFn = encodeFunctionData({
          abi: contractABI.abi,
          functionName: "releaseFunds",
          args: [eventId],
        });
        const dataWithDivvi = (encodedFn +
          (divviSuffix.startsWith("0x")
            ? divviSuffix.slice(2)
            : divviSuffix)) as `0x${string}`;
        toast.loading("Step 1/2 — Releasing funds…", { id: toastId });
        const txHash = await walletClient.sendTransaction({
          account: connectedAddress,
          to: CONTRACT_ADDRESS,
          data: dataWithDivvi,
        });
        await reportToDivvi(txHash);

        // Step 2: withdraw(token) — pulls the pending amount to the creator's wallet
        toast.loading("Step 2/2 — Withdrawing to your wallet…", {
          id: toastId,
        });
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: contractABI.abi,
          functionName: "withdraw",
          args: [tokenAddress],
        });

        toast.success("💰 Funds claimed and sent to your wallet!", {
          id: toastId,
        });
        setTimeout(() => refetch(), 3000);
      } catch (err: any) {
        toast.error(err.message || "Failed to claim funds", { id: toastId });
      } finally {
        setClaimingId(null);
      }
    },
    [connectedAddress, walletClient, refetch, events, writeContractAsync],
  );

  const activeCount = events.filter((e) => e.isActive && !e.isCanceled).length;
  const canceledCount = events.filter((e) => e.isCanceled).length;

  return (
    <>
      <style>{`

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

        .me-root {
          min-height: 100vh;
          background: var(--ec-bg);
          font-family: var(--ec-font-body);
          color: var(--ec-text);
          padding-top: 72px;
        }

        /* Ambient */
        .me-glow {
          position: fixed; top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 400px;
          background: radial-gradient(ellipse, rgba(53,208,127,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }
        .me-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(53,208,127,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,208,127,0.02) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none; z-index: 0;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 80%);
        }

        /* Page header */
        .me-header {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 0 auto;
          padding: 48px 24px 0;
          display: flex; align-items: flex-end;
          justify-content: space-between; flex-wrap: wrap; gap: 20px;
        }

        .me-eyebrow {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.15em;
          color: var(--ec-green); margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .me-eyebrow::before {
          content: ''; display: inline-block;
          width: 18px; height: 2px; background: var(--ec-green); border-radius: 2px;
        }

        .me-page-title {
          font-family: var(--ec-font-display);
          font-size: clamp(26px, 4vw, 44px); font-weight: 800;
          letter-spacing: -0.025em; line-height: 1.05;
        }

        /* Stats chips */
        .me-stat-chips {
          display: flex; gap: 10px; flex-wrap: wrap;
        }
        .me-chip {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 12px;
          font-size: 13px; font-weight: 500;
        }
        .me-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
        .me-chip-dot.green { background: var(--ec-green); }
        .me-chip-dot.red   { background: #f87171; }
        .me-chip-dot.muted { background: var(--ec-dimmed); }
        .me-chip-val { font-family: var(--ec-font-display); font-size: 15px; font-weight: 800; color: var(--ec-text); }

        /* Create btn */
        .me-create-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px;
          background: linear-gradient(135deg, var(--ec-green), #28b86d);
          border: none; border-radius: 12px; cursor: pointer;
          font-family: var(--ec-font-display); font-size: 13px; font-weight: 700;
          color: #020617; text-decoration: none;
          transition: all 0.25s ease;
        }
        .me-create-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(53,208,127,0.28); }
        .me-create-btn svg { width: 15px; height: 15px; stroke: #020617; fill: none; }

        /* Grid */
        .me-grid-wrap {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 36px auto 0;
          padding: 0 24px 80px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* Loading */
        .me-loading {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 60vh; gap: 16px;
        }
        .me-loader {
          width: 48px; height: 48px;
          border: 3px solid rgba(53,208,127,0.15);
          border-top-color: var(--ec-green);
          border-radius: 50%;
          animation: me-spin 0.9s linear infinite;
        }
        @keyframes me-spin { to { transform: rotate(360deg); } }
        .me-loading-text { font-size: 14px; color: var(--ec-dimmed); }

        /* Error */
        .me-error {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 60vh; padding: 40px; text-align: center;
        }
        .me-error-ico {
          width: 72px; height: 72px; border-radius: 50%;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        }
        .me-error-title { font-family: var(--ec-font-display); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .me-error-msg   { font-size: 14px; color: #fca5a5; }

        /* Empty */
        .me-empty {
          grid-column: 1/-1; text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column; align-items: center;
        }
        .me-empty-ico {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(53,208,127,0.07); border: 1px solid rgba(53,208,127,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px; margin-bottom: 20px;
        }
        .me-empty-title { font-family: var(--ec-font-display); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .me-empty-sub   { font-size: 14px; color: var(--ec-muted); margin-bottom: 24px; max-width: 320px; }

        /* Fade in */
        .me-fade-up { animation: me-fu 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes me-fu { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="me-root">
        <div className="me-glow" />
        <div className="me-grid" />

        {/* Loading */}
        {loading && (
          <div className="me-loading">
            <div className="me-loader" />
            <span className="me-loading-text">Loading your events…</span>
          </div>
        )}

        {/* Error */}
        {!loading && (isError || error) && (
          <div className="me-error">
            <div className="me-error-ico">
              <svg
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#ef4444"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="me-error-title">Failed to load events</h2>
            <p className="me-error-msg">{contractError?.message || error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !isError && !error && (
          <>
            <div className="me-header">
              <div>
                <div className="me-eyebrow">Your Dashboard</div>
                <h1 className="me-page-title">Created Events</h1>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div className="me-stat-chips">
                  <div className="me-chip">
                    <div className="me-chip-dot green" />
                    <span className="me-chip-val">{activeCount}</span>
                    <span style={{ color: "var(--ec-dimmed)", fontSize: 12 }}>
                      Active
                    </span>
                  </div>
                  <div className="me-chip">
                    <div className="me-chip-dot red" />
                    <span className="me-chip-val">{canceledCount}</span>
                    <span style={{ color: "var(--ec-dimmed)", fontSize: 12 }}>
                      Canceled
                    </span>
                  </div>
                  <div className="me-chip">
                    <div className="me-chip-dot muted" />
                    <span className="me-chip-val">{events.length}</span>
                    <span style={{ color: "var(--ec-dimmed)", fontSize: 12 }}>
                      Total
                    </span>
                  </div>
                </div>

                <Link href="/create_event">
                  <div className="me-create-btn">
                    <svg viewBox="0 0 24 24" strokeWidth="2.5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Event
                  </div>
                </Link>
              </div>
            </div>

            <div className="me-grid-wrap">
              {events.length > 0 ? (
                events.map((event, i) => (
                  <div
                    key={`${event.index}-${event.owner}`}
                    className="me-fade-up"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <CreatorEventCard
                      event={event}
                      onDelete={deleteEvent}
                      onCancel={cancelEvent}
                      onClaimFunds={claimFunds}
                      cancelLoading={cancelingId === event.index}
                      claimLoading={claimingId === event.index}
                      loading={isLoading}
                    />
                  </div>
                ))
              ) : (
                <div className="me-empty">
                  <div className="me-empty-ico">🎪</div>
                  <h3 className="me-empty-title">No events yet</h3>
                  <p className="me-empty-sub">
                    You haven't created any events. Start by creating your first
                    on-chain event.
                  </p>
                  <Link href="/create_event">
                    <div className="me-create-btn">
                      <svg viewBox="0 0 24 24" strokeWidth="2.5">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create Your First Event
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

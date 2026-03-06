"use client";
import { useEffect, useState } from "react";
import EventCard from "@/components/EventCard";
import { useAccount, useReadContract } from "wagmi";
import contractABI from "../../contract/abi.json";
import { createWalletClient, custom } from "viem";
import { celo } from "viem/chains";

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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "upcoming">("all");
  const [search, setSearch] = useState("");
  const { address, isConnected } = useAccount();

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
    functionName: "getAllEvents",
  });

  const getUserAddress = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      const walletClient = createWalletClient({
        transport: custom(window.ethereum),
        chain: celo,
      });
      await walletClient.getAddresses();
    }
  };
  useEffect(() => {
    getUserAddress();
  }, []);
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);
  useEffect(() => {
    if (isError) setError("Failed to load events");
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        if (!Array.isArray(data) || data.length !== 2)
          throw new Error("Bad format");
        const [indexes, eventData] = data as [bigint[], any[]];
        setEvents(
          eventData.map((event, idx) => ({
            index: Number(indexes[idx]),
            owner: event.owner,
            eventName: event.eventName,
            eventCardImgUrl: event.eventCardImgUrl,
            eventDetails: event.eventDetails,
            startDate: Number(event.startDate),
            startTime: Number(event.startTime),
            endDate: Number(event.startTime),
            endTime: Number(event.endTime),
            eventLocation: event.eventLocation,
            isActive: event.isActive,
            ticketPrice: Number(event.ticketPrice),
            fundsHeld: Number(event.fundsHeld),
            isCanceled: event.isCanceled,
            fundsReleased: event.fundsReleased,
            paymentToken: event.paymentToken,
          })),
        );
      } catch {
        setError("Error processing event data");
      }
    }
  }, [isSuccess, data]);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    await refetch();
  };

  const liveCount = events.filter((e) => e.isActive).length;

  const filteredEvents = events
    .filter((e) => {
      if (filter === "live") return e.isActive;
      if (filter === "upcoming") return !e.isActive;
      return true;
    })
    .filter((e) => e.eventName.toLowerCase().includes(search.toLowerCase()));

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

        .vep-root {
          min-height: 100vh;
          background: var(--ec-bg);
          font-family: var(--ec-font-body);
          color: var(--ec-text);
          padding-top: 72px;
          position: relative;
        }

        /* Ambient glow */
        .vep-glow {
          position: fixed; top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 500px;
          background: radial-gradient(ellipse, rgba(53,208,127,0.07) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        /* Grid bg */
        .vep-grid-bg {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(53,208,127,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,208,127,0.025) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none; z-index: 0;
          mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 0%, transparent 80%);
        }

        /* Page top bar */
        .vep-topbar {
          position: relative; z-index: 1;
          padding: 48px 24px 0;
          max-width: 1400px; margin: 0 auto;
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 24px;
          flex-wrap: wrap;
        }

        .vep-eyebrow {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.15em;
          color: var(--ec-green); margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .vep-eyebrow::before {
          content: ''; display: inline-block;
          width: 18px; height: 2px;
          background: var(--ec-green); border-radius: 2px;
        }
        .vep-page-title {
          font-family: var(--ec-font-display);
          font-size: clamp(28px, 4vw, 48px); font-weight: 800;
          line-height: 1.0; letter-spacing: -0.025em;
          color: var(--ec-text);
        }

        /* Wallet chip */
        .vep-wallet {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          background: rgba(53,208,127,0.07);
          border: 1px solid rgba(53,208,127,0.18);
          border-radius: 100px; font-size: 12px; color: var(--ec-green);
          margin-top: 8px;
        }
        .vep-wallet-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--ec-green); animation: ec-pulse-g 2s infinite;
        }
        @keyframes ec-pulse-g {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(53,208,127,0); }
        }

        /* Toolbar */
        .vep-toolbar {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 32px auto 0;
          padding: 0 24px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }

        .vep-filters {
          display: flex; gap: 6px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 12px; padding: 4px;
        }
        .vep-filter-btn {
          padding: 8px 20px; border: none; border-radius: 9px;
          font-family: var(--ec-font-body); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
          background: transparent; color: var(--ec-dimmed);
        }
        .vep-filter-btn.active {
          background: rgba(53,208,127,0.12);
          color: var(--ec-green);
          border: 1px solid rgba(53,208,127,0.25);
        }
        .vep-filter-btn:not(.active):hover { color: var(--ec-muted); background: rgba(255,255,255,0.04); }
        .vep-count-pill {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; border-radius: 100px;
          background: rgba(53,208,127,0.18); color: var(--ec-green);
          font-size: 10px; font-weight: 700; margin-left: 6px; padding: 0 4px;
        }

        /* Right controls */
        .vep-right-ctrl { display: flex; align-items: center; gap: 12px; }

        .vep-search-wrap { position: relative; }
        .vep-search {
          width: 220px; padding: 9px 14px 9px 38px;
          background: var(--ec-surface); border: 1px solid var(--ec-border);
          border-radius: 10px; font-family: var(--ec-font-body);
          font-size: 13px; color: var(--ec-text); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .vep-search::placeholder { color: var(--ec-dimmed); }
        .vep-search:focus {
          border-color: rgba(53,208,127,0.35);
          box-shadow: 0 0 0 3px rgba(53,208,127,0.07);
        }
        .vep-search-ico {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--ec-dimmed); pointer-events: none;
        }

        .vep-refresh {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px;
          background: var(--ec-surface); border: 1px solid var(--ec-border);
          border-radius: 10px; font-family: var(--ec-font-body);
          font-size: 13px; font-weight: 500; color: var(--ec-muted);
          cursor: pointer; transition: all 0.2s;
        }
        .vep-refresh:hover:not(:disabled) {
          background: rgba(53,208,127,0.07);
          border-color: rgba(53,208,127,0.25); color: var(--ec-green);
        }
        .vep-refresh:disabled { opacity: 0.4; cursor: not-allowed; }
        .vep-refresh svg { width: 14px; height: 14px; stroke: currentColor; fill: none; transition: transform 0.4s; }
        .vep-refresh:hover:not(:disabled) svg { transform: rotate(180deg); }
        .vep-spin { animation: vep-rotate 0.8s linear infinite; }
        @keyframes vep-rotate { to { transform: rotate(360deg); } }

        .vep-result-lbl {
          font-size: 12px; color: var(--ec-dimmed);
          font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em;
        }

        /* Grid */
        .vep-grid {
          position: relative; z-index: 1;
          max-width: 1400px; margin: 36px auto 0;
          padding: 0 24px 100px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* Skeleton */
        .vep-skel {
          border-radius: 20px; overflow: hidden;
          background: var(--ec-surface); border: 1px solid var(--ec-border);
        }
        .vep-skel-img {
          height: 210px;
          background: linear-gradient(90deg, var(--ec-surface) 25%, var(--ec-s2) 50%, var(--ec-surface) 75%);
          background-size: 200% 100%;
          animation: vep-shine 1.4s infinite;
        }
        .vep-skel-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .vep-skel-line {
          border-radius: 6px;
          background: linear-gradient(90deg, var(--ec-surface) 25%, var(--ec-s2) 50%, var(--ec-surface) 75%);
          background-size: 200% 100%;
          animation: vep-shine 1.4s infinite;
        }
        @keyframes vep-shine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* Error */
        .vep-error-wrap {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 60vh; padding: 40px;
        }
        .vep-error-ico {
          width: 80px; height: 80px; border-radius: 50%;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
          display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        }
        .vep-error-title { font-family: var(--ec-font-display); font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .vep-error-msg { font-size: 14px; color: #fca5a5; margin-bottom: 28px; }
        .vep-retry {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 28px;
          background: linear-gradient(135deg, var(--ec-green), #28b86d);
          border: none; border-radius: 12px; cursor: pointer;
          font-family: var(--ec-font-display); font-size: 14px; font-weight: 700;
          color: var(--ec-bg); transition: all 0.2s;
        }
        .vep-retry:hover { box-shadow: 0 8px 24px rgba(53,208,127,0.3); transform: translateY(-1px); }

        /* Empty */
        .vep-empty {
          grid-column: 1/-1; text-align: center; padding: 80px 24px;
        }
        .vep-empty-ico {
          width: 70px; height: 70px; border-radius: 18px;
          background: rgba(53,208,127,0.07); border: 1px solid rgba(53,208,127,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
        }
        .vep-empty-title { font-family: var(--ec-font-display); font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .vep-empty-sub { font-size: 14px; color: var(--ec-muted); }

        /* Stagger */
        .vep-fade-up { animation: vep-fu 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes vep-fu { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="vep-root">
        <div className="vep-glow" />
        <div className="vep-grid-bg" />

        {/* Error full-page */}
        {error && (
          <div className="vep-error-wrap">
            <div className="vep-error-ico">
              <svg
                width="32"
                height="32"
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
            <h2 className="vep-error-title">Something went wrong</h2>
            <p className="vep-error-msg">{error}</p>
            <button onClick={handleRefresh} className="vep-retry">
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Page header */}
            <div className="vep-topbar">
              <div>
                <div className="vep-eyebrow">On-Chain Ticketing</div>
                <h1 className="vep-page-title">
                  Featured &amp;
                  <br />
                  Upcoming Events
                </h1>
                {isConnected && address && (
                  <div className="vep-wallet">
                    <div className="vep-wallet-dot" />
                    {address.slice(0, 6)}…{address.slice(-4)}
                  </div>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="vep-toolbar">
              <div className="vep-filters">
                {(["all", "live", "upcoming"] as const).map((f) => (
                  <button
                    key={f}
                    className={`vep-filter-btn ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === "live" && liveCount > 0 && (
                      <span className="vep-count-pill">{liveCount}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="vep-right-ctrl">
                <span className="vep-result-lbl">
                  {filteredEvents.length} event
                  {filteredEvents.length !== 1 ? "s" : ""}
                </span>

                <div className="vep-search-wrap">
                  <svg
                    className="vep-search-ico"
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    className="vep-search"
                    placeholder="Search events…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="vep-refresh"
                >
                  <svg
                    className={loading ? "vep-spin" : ""}
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="vep-grid">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div className="vep-skel" key={i}>
                    <div
                      className="vep-skel-img"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                    <div className="vep-skel-body">
                      <div
                        className="vep-skel-line"
                        style={{ height: 10, width: "38%" }}
                      />
                      <div
                        className="vep-skel-line"
                        style={{ height: 18, width: "80%" }}
                      />
                      <div
                        className="vep-skel-line"
                        style={{ height: 18, width: "55%" }}
                      />
                      <div
                        className="vep-skel-line"
                        style={{ height: 10, width: "50%", marginTop: 6 }}
                      />
                      <div
                        className="vep-skel-line"
                        style={{ height: 10, width: "65%" }}
                      />
                      <div
                        className="vep-skel-line"
                        style={{
                          height: 44,
                          width: "100%",
                          marginTop: 12,
                          borderRadius: 12,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event, i) => (
                  <div
                    key={`${event.index}-${event.owner}`}
                    className="vep-fade-up"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <EventCard event={event} />
                  </div>
                ))
              ) : (
                <div className="vep-empty">
                  <div className="vep-empty-ico">🎭</div>
                  <h3 className="vep-empty-title">No events found</h3>
                  <p className="vep-empty-sub">
                    {search
                      ? `No results for "${search}"`
                      : filter !== "all"
                        ? `No ${filter} events right now.`
                        : "No upcoming events. Check back soon!"}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

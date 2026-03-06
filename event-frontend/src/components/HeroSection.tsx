"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import EventCard from "./EventCard";
import contractABI from "../contract/abi.json";
import { useReadContract } from "wagmi";

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
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
}

export default function HeroSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  const { data, isLoading, isError, isSuccess } = useReadContract({
    abi: contractABI.abi,
    address: "0xb9AD5b51fD436b0884A51259E351BA10f913Ef8d",
    functionName: "getAllEvents",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSuccess && data) {
      const [indexes, activeEvents] = data as [bigint[], any[]];
      const formattedEvents: Event[] = activeEvents.map((event, idx) => ({
        index: Number(indexes[idx]),
        owner: event.owner,
        eventName: event.eventName,
        eventCardImgUrl: event.eventCardImgUrl,
        eventDetails: event.eventDetails,
        startDate: Number(event.startDate),
        endDate: Number(event.endDate),
        startTime: Number(event.startTime),
        endTime: Number(event.endTime),
        eventLocation: event.eventLocation,
        isActive: event.isActive,
        ticketPrice: Number(event.ticketPrice),
        fundsHeld: Number(event.fundsHeld),
        minimumAge: Number(event.minimumAge),
        maxCapacity: Number(event.maxCapacity),
        isCanceled: event.isCanceled,
        fundsReleased: event.fundsReleased,
        exists: event.exists,
        refundPolicy: Number(event.refundPolicy),
        refundBufferHours: Number(event.refundBufferHours),
      }));
      setEvents(formattedEvents);
    }
  }, [isSuccess, data]);

  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const liveCount = events.filter((e) => e.isActive).length;

  return (
    <>
      <style>{`
        /* ── EventChain Design System ── */
        :root {
          --ec-bg:       #020617;
          --ec-surface:  #0F172A;
          --ec-surface2: #1E293B;
          --ec-border:   rgba(53,208,127,0.12);
          --ec-green:    #35D07F;
          --ec-cyan:     #22D3EE;
          --ec-text:     #F8FAFC;
          --ec-muted:    rgba(248,250,252,0.45);
          --ec-dimmed:   rgba(248,250,252,0.18);
        }


        .ec-wrap { font-family: var(--ec-font-body); background: var(--ec-bg); color: var(--ec-text); }

        /* ── HERO ── */
        .hero-section {
          position: relative;
          width: 100%;
          min-height: 92vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          overflow: hidden;
          isolation: isolate;
        }

        /* Banner image */
        .hero-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.18) saturate(0.8);
          z-index: -3;
        }

        /* Gradient overlay */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(53,208,127,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(34,211,238,0.07) 0%, transparent 60%),
            linear-gradient(180deg, rgba(2,6,23,0.2) 0%, rgba(2,6,23,0.85) 60%, #020617 100%);
          z-index: -2;
        }

        /* Grid pattern */
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(53,208,127,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,208,127,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: -1;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 0%, black 0%, transparent 70%);
        }

        /* Orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: -1;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(53,208,127,0.12), transparent 70%);
          top: -100px; left: -100px;
          animation: orb-drift 12s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(34,211,238,0.09), transparent 70%);
          bottom: 0; right: -80px;
          animation: orb-drift 9s ease-in-out infinite alternate-reverse;
        }
        @keyframes orb-drift {
          from { transform: translate(0, 0); }
          to   { transform: translate(30px, 20px); }
        }

        /* Hero content */
        .hero-content { position: relative; z-index: 1; max-width: 860px; }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 18px;
          background: rgba(53,208,127,0.08);
          border: 1px solid rgba(53,208,127,0.25);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ec-green);
          margin-bottom: 28px;
        }

        .badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--ec-green);
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 6px rgba(53,208,127,0); }
        }

        .hero-title {
          font-family: var(--ec-font-display);
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: var(--ec-text);
          margin-bottom: 24px;
        }

        .hero-title .gradient-word {
          background: linear-gradient(135deg, var(--ec-green) 0%, var(--ec-cyan) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }

        .hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          font-weight: 400;
          color: var(--ec-muted);
          max-width: 520px;
          margin: 0 auto 40px;
          line-height: 1.75;
        }

        /* CTA row */
        .hero-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          justify-content: center;
          margin-bottom: 56px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: linear-gradient(135deg, var(--ec-green) 0%, #28b86d 100%);
          border: none;
          border-radius: 14px;
          font-family: var(--ec-font-body);
          font-size: 15px;
          font-weight: 600;
          color: #020617;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(53,208,127,0.35);
          filter: brightness(1.07);
        }
        .btn-primary svg { width: 18px; height: 18px; transition: transform 0.2s; }
        .btn-primary:hover svg { transform: translateX(3px); }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          background: rgba(248,250,252,0.05);
          border: 1px solid rgba(248,250,252,0.12);
          border-radius: 14px;
          font-family: var(--ec-font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--ec-text);
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          backdrop-filter: blur(8px);
        }
        .btn-ghost:hover {
          background: rgba(53,208,127,0.08);
          border-color: rgba(53,208,127,0.3);
          color: var(--ec-green);
          transform: translateY(-2px);
        }

        /* Hero mini-stats row */
        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .hstat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 28px;
        }
        .hstat:not(:last-child) {
          border-right: 1px solid var(--ec-dimmed);
        }
        .hstat-val {
          font-family: var(--ec-font-display);
          font-size: 30px;
          font-weight: 800;
          color: var(--ec-text);
          line-height: 1;
        }
        .hstat-val.green { color: var(--ec-green); }
        .hstat-val.cyan  { color: var(--ec-cyan); }
        .hstat-lbl {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ec-dimmed);
          margin-top: 4px;
        }

        /* Scroll cue */
        .scroll-cue {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          animation: bounce 2s ease-in-out infinite;
          color: var(--ec-dimmed);
          cursor: pointer;
        }
        .scroll-cue span { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; }
        @keyframes bounce {
          0%,100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(6px); }
        }

        /* ── STATS BELT ── */
        .stats-belt {
          background: var(--ec-surface);
          border-top: 1px solid var(--ec-border);
          border-bottom: 1px solid var(--ec-border);
          padding: 40px 24px;
        }

        .stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }

        @media (max-width: 640px) {
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-block {
          text-align: center;
          padding: 8px 24px;
          position: relative;
        }
        .stat-block:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: var(--ec-border);
        }

        .stat-num {
          font-family: var(--ec-font-display);
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, var(--ec-green), var(--ec-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-desc {
          font-size: 13px;
          font-weight: 500;
          color: var(--ec-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── EVENTS SECTION ── */
        .events-section {
          background: var(--ec-bg);
          padding: 80px 24px 100px;
        }

        .events-inner { max-width: 1400px; margin: 0 auto; }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .section-eyebrow {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--ec-green);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-eyebrow::before {
          content: '';
          display: inline-block;
          width: 20px; height: 2px;
          background: var(--ec-green);
          border-radius: 2px;
        }

        .section-title {
          font-family: var(--ec-font-display);
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          color: var(--ec-text);
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        /* Search */
        .search-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .search-input {
          width: 260px;
          padding: 11px 16px 11px 44px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 12px;
          font-family: var(--ec-font-body);
          font-size: 14px;
          color: var(--ec-text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: var(--ec-dimmed); }
        .search-input:focus {
          border-color: rgba(53,208,127,0.4);
          box-shadow: 0 0 0 3px rgba(53,208,127,0.08);
        }
        .search-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--ec-dimmed);
          pointer-events: none;
        }

        /* Grid */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        /* Skeletons */
        .skel-card {
          border-radius: 20px;
          overflow: hidden;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
        }
        .skel-img {
          height: 220px;
          background: linear-gradient(90deg, var(--ec-surface) 25%, var(--ec-surface2) 50%, var(--ec-surface) 75%);
          background-size: 200% 100%;
          animation: skel-shine 1.4s infinite;
        }
        .skel-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .skel-line {
          border-radius: 6px;
          background: linear-gradient(90deg, var(--ec-surface) 25%, var(--ec-surface2) 50%, var(--ec-surface) 75%);
          background-size: 200% 100%;
          animation: skel-shine 1.4s infinite;
        }
        @keyframes skel-shine {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px 28px;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 14px;
          color: #fca5a5;
          font-size: 14px;
          font-weight: 500;
          max-width: 480px;
          margin: 60px auto;
        }

        /* Empty */
        .empty-state {
          grid-column: 1/-1;
          text-align: center;
          padding: 80px 24px;
        }
        .empty-icon {
          width: 72px; height: 72px;
          border-radius: 20px;
          background: rgba(53,208,127,0.07);
          border: 1px solid rgba(53,208,127,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          margin: 0 auto 20px;
        }
        .empty-title {
          font-family: var(--ec-font-display);
          font-size: 22px; font-weight: 700;
          color: var(--ec-text);
          margin-bottom: 8px;
        }
        .empty-sub { font-size: 14px; color: var(--ec-muted); margin-bottom: 24px; }

        .btn-sm {
          padding: 9px 22px;
          background: rgba(53,208,127,0.1);
          border: 1px solid rgba(53,208,127,0.25);
          border-radius: 10px;
          font-family: var(--ec-font-body);
          font-size: 13px; font-weight: 600;
          color: var(--ec-green);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-sm:hover { background: rgba(53,208,127,0.18); }

        /* View all */
        .view-all-wrap { text-align: center; margin-top: 52px; }

        .btn-outline-green {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 36px;
          background: transparent;
          border: 1px solid rgba(53,208,127,0.35);
          border-radius: 14px;
          font-family: var(--ec-font-body);
          font-size: 15px; font-weight: 600;
          color: var(--ec-green);
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }
        .btn-outline-green:hover {
          background: rgba(53,208,127,0.08);
          border-color: var(--ec-green);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(53,208,127,0.15);
        }

        /* Fade in */
        .fade-up {
          animation: fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div className="ec-wrap">
        {/* ── HERO ── */}
        <section className="hero-section">
          <img src="/images/banner.png" alt="" className="hero-bg-img" />
          <div className="hero-overlay" />
          <div className="hero-grid" />
          <div className="orb orb-1" />
          <div className="orb orb-2" />

          <div className="hero-content">
            <div className="hero-badge">
              <div className="badge-dot" />
              {liveCount > 0
                ? `${liveCount} Live Events`
                : "Blockchain Powered"}
            </div>

            <h1 className="hero-title">
              Experience Events
              <span className="gradient-word">On-Chain.</span>
            </h1>

            <p className="hero-sub">
              Discover concerts, workshops & conferences. Buy tickets with
              crypto, get instant refunds — all secured on the Celo blockchain.
            </p>

            <div className="hero-ctas">
              <Link href="/create_event">
                <div className="btn-primary">
                  Create an Event
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </Link>
              <Link href="/view_events">
                <div className="btn-ghost">
                  Explore Events
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </Link>
            </div>

            {!isLoading && (
              <div className="hero-stats">
                <div className="hstat">
                  <span className="hstat-val">{events.length}</span>
                  <span className="hstat-lbl">Total Events</span>
                </div>
                <div className="hstat">
                  <span className="hstat-val green">{liveCount}</span>
                  <span className="hstat-lbl">Live Now</span>
                </div>
                <div className="hstat">
                  <span className="hstat-val cyan">CELO</span>
                  <span className="hstat-lbl">Network</span>
                </div>
              </div>
            )}
          </div>

          <div className="scroll-cue">
            <span>Scroll</span>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </section>

        {/* ── STATS BELT ── */}
        <section className="stats-belt">
          <div className="stats-inner">
            {[
              { num: `${events.length}+`, desc: "Active Events" },
              { num: "1000+", desc: "Happy Attendees" },
              { num: "24/7", desc: "Blockchain Secured" },
              { num: "100%", desc: "Transparent" },
            ].map((s) => (
              <div key={s.desc} className="stat-block">
                <div className="stat-num">{s.num}</div>
                <div className="stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── EVENTS ── */}
        <section className="events-section">
          <div className="events-inner">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">On-Chain Events</div>
                <h2 className="section-title">Featured Events</h2>
              </div>

              <div className="search-wrap">
                <svg
                  className="search-icon"
                  width="16"
                  height="16"
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
                  className="search-input"
                  placeholder="Search events…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Skeleton */}
            {isLoading && (
              <div className="events-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div className="skel-card" key={i}>
                    <div
                      className="skel-img"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                    <div className="skel-body">
                      <div
                        className="skel-line"
                        style={{ height: 10, width: "38%" }}
                      />
                      <div
                        className="skel-line"
                        style={{ height: 18, width: "80%" }}
                      />
                      <div
                        className="skel-line"
                        style={{ height: 18, width: "55%" }}
                      />
                      <div
                        className="skel-line"
                        style={{ height: 10, width: "50%", marginTop: 8 }}
                      />
                      <div
                        className="skel-line"
                        style={{ height: 10, width: "65%" }}
                      />
                      <div
                        className="skel-line"
                        style={{
                          height: 44,
                          width: "100%",
                          marginTop: 12,
                          borderRadius: 12,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="error-box">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                Failed to load events. Please refresh.
              </div>
            )}

            {/* Grid */}
            {!isLoading && !isError && (
              <>
                <div className="events-grid">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, i) => (
                      <div
                        key={event.index}
                        className="fade-up"
                        style={{ animationDelay: `${i * 0.07}s` }}
                      >
                        <EventCard event={event} />
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🎭</div>
                      <h3 className="empty-title">No events found</h3>
                      <p className="empty-sub">
                        {searchTerm
                          ? `No results for "${searchTerm}"`
                          : "No upcoming events right now. Check back soon!"}
                      </p>
                      {searchTerm && (
                        <button
                          className="btn-sm"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {filteredEvents.length > 0 && (
                  <div className="view-all-wrap">
                    <Link href="/view_events">
                      <div className="btn-outline-green">
                        View all events
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

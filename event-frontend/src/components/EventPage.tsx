"use client";
import AttendeeList from "./AttendeeList";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { getTokenByAddress } from "@/utils/tokens";

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
  fundsHeld: bigint;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
  paymentToken: string;
}

export interface EventPageProps {
  event: Event;
  attendees: string[];
  buyTicket: () => void;
  requestRefund: () => void;
  loading: boolean;
  registering: boolean;
  refunding: boolean;
  id: string;
}

export default function EventPage({
  event,
  attendees,
  buyTicket,
  requestRefund,
  loading,
  registering,
  refunding,
  id,
}: EventPageProps) {
  const { address, isConnected } = useAccount();
  const [showRefundDetails, setShowRefundDetails] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [resolvedImg, setResolvedImg] = useState<string>("/default-event.jpg");

  const formatEventDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatEventTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formattedStartDate = formatEventDate(Number(event.startDate));
  const formattedEndDate = formatEventDate(Number(event.endDate));
  const formattedStartTime = formatEventTime(Number(event.startTime));
  const formattedEndTime = formatEventTime(Number(event.endTime));

  const tokenInfo = getTokenByAddress(event.paymentToken);
  const formattedPrice = formatUnits(
    event.ticketPrice,
    tokenInfo?.decimals || 18,
  );
  const tokenSymbol = tokenInfo?.symbol || "Unknown Token";

  const getRefundPolicyText = () => {
    switch (event.refundPolicy) {
      case 0:
        return "No refunds available for this event";
      case 1:
        return "Full refund available until event starts";
      case 2:
        return `Full refund available up to ${event.refundBufferHours} hours before event`;
      default:
        return "Refund policy not specified";
    }
  };

  useEffect(() => {
    if (!event.eventCardImgUrl) return;
    const url = event.eventCardImgUrl.startsWith("http")
      ? event.eventCardImgUrl
      : `https://ipfs.io/ipfs/${event.eventCardImgUrl}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setResolvedImg(data.image ? data.image : url))
      .catch(() => setResolvedImg(url));
  }, [event.eventCardImgUrl]);

  const getLocationShort = (location: string) => {
    const parts = location.split(",");
    return parts.length >= 2 ? parts.slice(-2).join(",").trim() : location;
  };

  const isRegistered = address && attendees.includes(address);
  const requiresAgeVerification = event.minimumAge > 0;
  const spotsLeft = Number(event.maxCapacity) - attendees.length;
  const capacityPct = Math.min(
    100,
    (attendees.length / Number(event.maxCapacity)) * 100,
  );

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

        .ep-root {
          min-height: 100vh;
          background: var(--ec-bg);
          font-family: var(--ec-font-body);
          color: var(--ec-text);
        }

        /* ── HERO ── */
        .ep-hero {
          position: relative;
          width: 100%;
          height: 58vh;
          overflow: hidden;
        }
        .ep-hero-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transform: scale(1.05);
          transition: transform 3s ease;
          filter: brightness(0.55) saturate(0.9);
        }
        .ep-hero:hover .ep-hero-img { transform: scale(1.0); }

        .ep-hero-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.15) 40%, rgba(2,6,23,0.92) 100%),
            radial-gradient(ellipse 70% 60% at 30% 50%, rgba(53,208,127,0.07) 0%, transparent 70%);
          z-index: 1;
        }

        /* Grid lines in hero */
        .ep-hero-grid {
          position: absolute; inset: 0; z-index: 1;
          background-image:
            linear-gradient(rgba(53,208,127,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,208,127,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%);
        }

        .ep-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          z-index: 2;
          padding: 0 24px 40px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .ep-status-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
          margin-bottom: 16px;
        }

        .ep-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          backdrop-filter: blur(10px);
        }
        .ep-badge.active  { background: rgba(53,208,127,0.15); border: 1px solid rgba(53,208,127,0.4); color: #35D07F; }
        .ep-badge.ended   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.3);  color: #fca5a5; }
        .ep-badge.spots   { background: rgba(248,250,252,0.08); border: 1px solid rgba(248,250,252,0.18); color: var(--ec-text); }
        .ep-badge.token   { background: rgba(34,211,238,0.1);  border: 1px solid rgba(34,211,238,0.3); color: #22D3EE; }

        .ep-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
          animation: ep-pulse 2s infinite;
        }
        @keyframes ep-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(53,208,127,0); }
        }

        .ep-hero-title {
          font-family: var(--ec-font-display);
          font-size: clamp(28px, 5vw, 64px);
          font-weight: 800; line-height: 1.0;
          letter-spacing: -0.025em;
          color: var(--ec-text);
          margin-bottom: 20px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.4);
        }

        .ep-hero-meta {
          display: flex; flex-wrap: wrap; gap: 10px;
        }
        .ep-hero-chip {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px;
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(53,208,127,0.15);
          border-radius: 10px; backdrop-filter: blur(12px);
          font-size: 13px; font-weight: 500; color: var(--ec-muted);
        }
        .ep-hero-chip svg { width: 15px; height: 15px; stroke: var(--ec-info); fill: none; flex-shrink: 0; }
        .ep-hero-chip.price svg { stroke: var(--ec-green); }

        /* ── MAIN LAYOUT ── */
        .ep-body {
          max-width: 1280px; margin: 0 auto;
          padding: 40px 24px 80px;
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 28px;
        }
        @media (max-width: 1024px) {
          .ep-body { grid-template-columns: 1fr; }
        }

        /* ── CARDS (left col) ── */
        .ep-card {
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 20px;
          transition: border-color 0.2s;
        }
        .ep-card:hover { border-color: rgba(53,208,127,0.22); }
        .ep-card:last-child { margin-bottom: 0; }

        .ep-card-title {
          font-family: var(--ec-font-display);
          font-size: 17px; font-weight: 700;
          color: var(--ec-text);
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .ep-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ep-card-icon svg { width: 18px; height: 18px; fill: none; stroke: currentColor; }
        .ep-card-icon.green { background: rgba(53,208,127,0.12); color: #35D07F; }
        .ep-card-icon.cyan  { background: rgba(34,211,238,0.12);  color: #22D3EE; }
        .ep-card-icon.amber { background: rgba(251,191,36,0.12);  color: #fbbf24; }
        .ep-card-icon.indigo{ background: rgba(129,140,248,0.12); color: #818cf8; }
        .ep-card-icon.red   { background: rgba(239,68,68,0.12);   color: #f87171; }

        .ep-about-text {
          font-size: 15px; line-height: 1.8;
          color: var(--ec-muted);
        }

        /* Date/time grid */
        .ep-dt-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .ep-dt-block {}
        .ep-dt-label {
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--ec-dimmed); margin-bottom: 6px;
        }
        .ep-dt-date {
          font-family: var(--ec-font-display);
          font-size: 15px; font-weight: 700;
          color: var(--ec-text); margin-bottom: 4px;
        }
        .ep-dt-time {
          font-size: 13px; font-weight: 500;
          color: var(--ec-green);
          display: flex; align-items: center; gap: 6px;
        }
        .ep-dt-time svg { width: 13px; height: 13px; stroke: currentColor; fill: none; }

        /* Map */
        .ep-location-addr {
          font-size: 14px; color: var(--ec-muted);
          margin-bottom: 16px; line-height: 1.6;
        }
        .ep-map-wrap {
          border-radius: 14px; overflow: hidden;
          height: 220px;
          border: 1px solid var(--ec-border);
        }
        .ep-map-wrap iframe { width: 100%; height: 100%; border: none; }

        /* Age */
        .ep-age-notice {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 20px;
          background: rgba(251,191,36,0.06);
          border: 1px solid rgba(251,191,36,0.18);
          border-radius: 12px;
        }
        .ep-age-notice svg { width: 18px; height: 18px; stroke: #fbbf24; fill: none; flex-shrink: 0; margin-top: 1px; }
        .ep-age-text { font-size: 14px; color: var(--ec-muted); line-height: 1.6; }
        .ep-age-text strong { color: #fbbf24; }

        /* Attendee capacity bar */
        .ep-cap-bar-wrap { margin-bottom: 20px; }
        .ep-cap-row {
          display: flex; justify-content: space-between;
          font-size: 12px; color: var(--ec-dimmed); margin-bottom: 8px;
        }
        .ep-cap-bar {
          height: 6px; background: var(--ec-s2);
          border-radius: 100px; overflow: hidden;
        }
        .ep-cap-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--ec-green), var(--ec-cyan));
          border-radius: 100px;
          transition: width 0.5s ease;
        }

        /* Refund accordion */
        .ep-refund-toggle {
          width: 100%; display: flex; align-items: center;
          justify-content: space-between;
          background: none; border: none; cursor: pointer; padding: 0;
        }
        .ep-refund-chevron {
          width: 22px; height: 22px;
          stroke: var(--ec-dimmed); fill: none;
          transition: transform 0.3s;
          flex-shrink: 0;
        }
        .ep-refund-chevron.open { transform: rotate(180deg); }

        .ep-refund-body {
          overflow: hidden; transition: max-height 0.35s ease, margin-top 0.35s ease;
        }

        .ep-refund-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 16px;
          background: var(--ec-s2);
          border-radius: 12px; margin-top: 12px;
        }
        .ep-refund-item svg { width: 16px; height: 16px; stroke: var(--ec-cyan); fill: none; flex-shrink: 0; margin-top: 2px; }
        .ep-refund-item-title { font-size: 13px; font-weight: 600; color: var(--ec-text); margin-bottom: 3px; }
        .ep-refund-item-desc  { font-size: 12px; color: var(--ec-muted); line-height: 1.6; }

        /* ── TICKET SIDEBAR ── */
        .ep-sidebar { position: sticky; top: 24px; height: fit-content; }

        .ep-ticket-card {
          background: linear-gradient(145deg, #0a1f14 0%, #0d2a1a 50%, #071520 100%);
          border: 1px solid rgba(53,208,127,0.25);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 0 60px rgba(53,208,127,0.06);
        }

        .ep-ticket-header {
          padding: 28px 28px 0;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .ep-ticket-title {
          font-family: var(--ec-font-display);
          font-size: 20px; font-weight: 800; color: var(--ec-text);
        }
        .ep-ticket-sparkle {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(53,208,127,0.12);
          border: 1px solid rgba(53,208,127,0.25);
          display: flex; align-items: center; justify-content: center;
        }
        .ep-ticket-sparkle svg { width: 18px; height: 18px; stroke: var(--ec-green); fill: none; }

        /* Price box */
        .ep-price-box {
          margin: 0 28px 24px;
          padding: 20px 22px;
          background: rgba(53,208,127,0.07);
          border: 1px solid rgba(53,208,127,0.18);
          border-radius: 16px;
        }
        .ep-price-label { font-size: 11px; font-weight: 500; color: var(--ec-dimmed); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .ep-price-val {
          font-family: var(--ec-font-display);
          font-size: 32px; font-weight: 800;
          background: linear-gradient(135deg, var(--ec-green), var(--ec-cyan));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          word-break: break-all; line-height: 1.1;
        }

        /* Stats rows */
        .ep-stats { padding: 0 28px 24px; display: flex; flex-direction: column; gap: 10px; }
        .ep-stat-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px;
          background: rgba(248,250,252,0.03);
          border: 1px solid rgba(248,250,252,0.05);
          border-radius: 10px;
        }
        .ep-stat-lbl { font-size: 12px; color: var(--ec-dimmed); font-weight: 500; }
        .ep-stat-val { font-size: 13px; font-weight: 600; color: var(--ec-text); display: flex; align-items: center; gap: 6px; }
        .ep-status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .ep-status-dot.active { background: var(--ec-green); animation: ep-pulse 2s infinite; }
        .ep-status-dot.ended  { background: #f87171; }

        /* CTA buttons */
        .ep-cta-wrap { padding: 0 28px 28px; display: flex; flex-direction: column; gap: 10px; }

        .ep-btn-primary {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, var(--ec-green) 0%, #28b86d 100%);
          border: none; border-radius: 14px; cursor: pointer;
          font-family: var(--ec-font-display); font-size: 15px; font-weight: 700;
          color: #020617; transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ep-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(53,208,127,0.3);
          filter: brightness(1.06);
        }
        .ep-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .ep-btn-ghost {
          width: 100%; padding: 13px;
          background: rgba(248,250,252,0.04);
          border: 1px solid rgba(248,250,252,0.1);
          border-radius: 14px; cursor: pointer;
          font-family: var(--ec-font-body); font-size: 14px; font-weight: 600;
          color: var(--ec-muted); transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ep-btn-ghost:hover:not(:disabled) {
          background: rgba(248,250,252,0.07);
          color: var(--ec-text);
        }
        .ep-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        .ep-btn-danger {
          width: 100%; padding: 13px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 14px; cursor: pointer;
          font-family: var(--ec-font-body); font-size: 14px; font-weight: 600;
          color: #fca5a5; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ep-btn-danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.4);
        }
        .ep-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }

        .ep-registered-state {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px;
          background: rgba(53,208,127,0.08);
          border: 1px solid rgba(53,208,127,0.25);
          border-radius: 14px;
          font-family: var(--ec-font-display); font-size: 14px; font-weight: 700;
          color: var(--ec-green);
        }
        .ep-registered-state svg { width: 18px; height: 18px; stroke: currentColor; fill: none; }

        /* Spinner */
        .ep-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(2,6,23,0.3);
          border-top-color: #020617;
          border-radius: 50%;
          animation: ep-rotate 0.7s linear infinite;
        }
        .ep-spin-light {
          width: 16px; height: 16px;
          border: 2px solid rgba(248,250,252,0.15);
          border-top-color: var(--ec-text);
          border-radius: 50%;
          animation: ep-rotate 0.7s linear infinite;
        }
        @keyframes ep-rotate { to { transform: rotate(360deg); } }

        /* Info strips below ticket card */
        .ep-info-strip {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 18px;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          border-radius: 16px;
          margin-top: 14px;
        }
        .ep-info-strip svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; fill: none; }
        .ep-info-strip.green svg { stroke: var(--ec-green); }
        .ep-info-strip.cyan  svg { stroke: var(--ec-cyan); }
        .ep-info-strip-title { font-size: 12px; font-weight: 600; color: var(--ec-text); margin-bottom: 3px; }
        .ep-info-strip-desc  { font-size: 11px; color: var(--ec-dimmed); line-height: 1.5; }
      `}</style>

      <div className="ep-root">
        {/* ── HERO ── */}
        <div className="ep-hero">
          <img
            className="ep-hero-img"
            src={imgError ? "/default-event.jpg" : resolvedImg}
            alt="Event Banner"
            onError={() => setImgError(true)}
          />
          <div className="ep-hero-overlay" />
          <div className="ep-hero-grid" />

          <div className="ep-hero-content">
            <div className="ep-status-row">
              <span
                className={`ep-badge ${event.isActive ? "active" : "ended"}`}
              >
                <span className="ep-badge-dot" />
                {event.isActive ? "Live Event" : "Event Ended"}
              </span>
              <span className="ep-badge spots">
                {attendees.length}/{Number(event.maxCapacity)} Spots
              </span>
              <span className="ep-badge token">{tokenSymbol}</span>
            </div>

            <h1 className="ep-hero-title">{event.eventName}</h1>

            <div className="ep-hero-meta">
              <div className="ep-hero-chip">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {formattedStartDate}
              </div>
              <div className="ep-hero-chip">
                <svg viewBox="0 0 24 24" strokeWidth="2">
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
                {getLocationShort(event.eventLocation)}
              </div>
              <div className="ep-hero-chip price">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                {formattedPrice} {tokenSymbol}
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="ep-body">
          {/* Left Column */}
          <div>
            {/* About */}
            <div className="ep-card">
              <h2 className="ep-card-title">
                <span className="ep-card-icon green">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                About This Event
              </h2>
              <p className="ep-about-text">{event.eventDetails}</p>
            </div>

            {/* Date & Time */}
            <div className="ep-card">
              <h2 className="ep-card-title">
                <span className="ep-card-icon cyan">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </span>
                Date &amp; Time
              </h2>
              <div className="ep-dt-grid">
                <div className="ep-dt-block">
                  <div className="ep-dt-label">Start</div>
                  <div className="ep-dt-date">{formattedStartDate}</div>
                  <div className="ep-dt-time">
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    {formattedStartTime}
                  </div>
                </div>
                <div className="ep-dt-block">
                  <div className="ep-dt-label">End</div>
                  <div className="ep-dt-date">{formattedEndDate}</div>
                  <div className="ep-dt-time">
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" d="M12 6v6l4 2" />
                    </svg>
                    {formattedEndTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="ep-card">
              <h2 className="ep-card-title">
                <span className="ep-card-icon cyan">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
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
                </span>
                Location
              </h2>
              <p className="ep-location-addr">{event.eventLocation}</p>
              <div className="ep-map-wrap">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(event.eventLocation)}&output=embed`}
                  loading="lazy"
                  title="Event Location Map"
                />
              </div>
            </div>

            {/* Age Restriction */}
            {requiresAgeVerification && (
              <div className="ep-card">
                <h2 className="ep-card-title">
                  <span className="ep-card-icon amber">
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </span>
                  Age Restriction
                </h2>
                <div className="ep-age-notice">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="ep-age-text">
                    This event requires attendees to be{" "}
                    <strong>{event.minimumAge}+ years old</strong>. Age
                    verification may be required at the venue.
                  </p>
                </div>
              </div>
            )}

            {/* Attendees */}
            <div className="ep-card">
              <h2 className="ep-card-title">
                <span className="ep-card-icon indigo">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                Attendees ({attendees.length}/{Number(event.maxCapacity)})
              </h2>
              <div className="ep-cap-bar-wrap">
                <div className="ep-cap-row">
                  <span>{attendees.length} registered</span>
                  <span>{spotsLeft} spots left</span>
                </div>
                <div className="ep-cap-bar">
                  <div
                    className="ep-cap-fill"
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
              </div>
              {/* <AttendeeList
                attendees={attendees}
                maxCapacity={Number(event.maxCapacity)}
              /> */}
            </div>

            {/* Refund Policy */}
            <div className="ep-card">
              <button
                className="ep-refund-toggle"
                onClick={() => setShowRefundDetails(!showRefundDetails)}
              >
                <h2 className="ep-card-title" style={{ margin: 0 }}>
                  <span className="ep-card-icon cyan">
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  Refund Policy
                </h2>
                <svg
                  className={`ep-refund-chevron ${showRefundDetails ? "open" : ""}`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className="ep-refund-body"
                style={{
                  maxHeight: showRefundDetails ? "400px" : "0px",
                  marginTop: showRefundDetails ? "16px" : "0",
                }}
              >
                <div className="ep-refund-item">
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div>
                    <div className="ep-refund-item-title">
                      {event.refundPolicy === 0
                        ? "No Refunds"
                        : "Refund Available"}
                    </div>
                    <div className="ep-refund-item-desc">
                      {getRefundPolicyText()}
                    </div>
                  </div>
                </div>
                {event.refundPolicy !== 0 && (
                  <div className="ep-refund-item">
                    <svg viewBox="0 0 24 24" strokeWidth="2">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="ep-refund-item-title">
                        Automatic Processing
                      </div>
                      <div className="ep-refund-item-desc">
                        Refunds are processed on-chain and returned to your
                        wallet in {tokenSymbol}.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="ep-sidebar">
            <div className="ep-ticket-card">
              <div className="ep-ticket-header">
                <span className="ep-ticket-title">Get Ticket</span>
                <div className="ep-ticket-sparkle">
                  <svg viewBox="0 0 24 24" strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                </div>
              </div>

              <div className="ep-price-box">
                <div className="ep-price-label">Price per ticket</div>
                <div className="ep-price-val">
                  {formattedPrice} {tokenSymbol}
                </div>
              </div>

              <div className="ep-stats">
                <div className="ep-stat-row">
                  <span className="ep-stat-lbl">Available Spots</span>
                  <span className="ep-stat-val">
                    {spotsLeft} / {Number(event.maxCapacity)}
                  </span>
                </div>
                <div className="ep-stat-row">
                  <span className="ep-stat-lbl">Status</span>
                  <span className="ep-stat-val">
                    <span
                      className={`ep-status-dot ${event.isActive ? "active" : "ended"}`}
                    />
                    {event.isActive ? "Active" : "Ended"}
                  </span>
                </div>
                <div className="ep-stat-row">
                  <span className="ep-stat-lbl">Network</span>
                  <span
                    className="ep-stat-val"
                    style={{ color: "var(--ec-cyan)" }}
                  >
                    Celo
                  </span>
                </div>
                <div className="ep-stat-row">
                  <span className="ep-stat-lbl">Token</span>
                  <span className="ep-stat-val">{tokenSymbol}</span>
                </div>
              </div>

              <div className="ep-cta-wrap">
                {!isConnected ? (
                  <button className="ep-btn-primary">Connect Wallet</button>
                ) : isRegistered ? (
                  <>
                    <div className="ep-registered-state">
                      <svg viewBox="0 0 24 24" strokeWidth="2.5">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      You're Registered!
                    </div>
                    {event.refundPolicy !== 0 && (
                      <button
                        onClick={requestRefund}
                        disabled={loading || refunding}
                        className="ep-btn-danger"
                      >
                        {refunding ? (
                          <>
                            <div className="ep-spin-light" /> Processing…
                          </>
                        ) : (
                          "Request Refund"
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={buyTicket}
                    disabled={
                      loading ||
                      registering ||
                      !event.isActive ||
                      attendees.length >= Number(event.maxCapacity)
                    }
                    className="ep-btn-primary"
                  >
                    {registering ? (
                      <>
                        <div className="ep-spin" /> Processing…
                      </>
                    ) : attendees.length >= Number(event.maxCapacity) ? (
                      "Sold Out"
                    ) : !event.isActive ? (
                      "Event Inactive"
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Info strips */}
            {!requiresAgeVerification && (
              <div className="ep-info-strip green">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <div className="ep-info-strip-title">All Ages Welcome</div>
                  <div className="ep-info-strip-desc">
                    No minimum age requirement. Everyone is welcome!
                  </div>
                </div>
              </div>
            )}

            <div className="ep-info-strip cyan">
              <svg viewBox="0 0 24 24" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <div className="ep-info-strip-title">
                  Secure Blockchain Ticketing
                </div>
                <div className="ep-info-strip-desc">
                  Your ticket is secured on Celo. Transparent refund policies.
                  Payments in {tokenSymbol}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { formatEventDate } from "../utils/format";
import { useEffect, useState } from "react";

interface Event {
  index: number;
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice?: number;
  maxCapacity?: number;
}

export default function EventCard({ event }: { event: Event }) {
  const shortAddress = `${event.owner.slice(0, 6)}...${event.owner.slice(-4)}`;
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!event.eventCardImgUrl) return;
    const url = event.eventCardImgUrl.startsWith("http")
      ? event.eventCardImgUrl
      : `https://ipfs.io/ipfs/${event.eventCardImgUrl}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => setImgSrc(data.image ?? null))
      .catch(() => setImgSrc(null));
  }, [event.eventCardImgUrl]);

  const displayImg = imgError || !imgSrc ? "/default-event.jpg" : imgSrc;

  const formatTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const dateObj = new Date(event.startDate * 1000);
  const dayNum = dateObj.getDate();
  const monthStr = dateObj.toLocaleString("en-US", { month: "short" });
  const yearStr = dateObj.getFullYear();

  return (
    <>
      <style>{`

        .ec-card {
          --ec-surface: #0F172A;
          --ec-s2:      #1E293B;
          --ec-border:  rgba(53,208,127,0.12);
          --ec-green:   #35D07F;
          --ec-cyan:    #22D3EE;
          --ec-text:    #F8FAFC;
          --ec-muted:   rgba(248,250,252,0.45);
          --ec-dimmed:  rgba(248,250,252,0.18);
          --ec-dark:    #020617;

          font-family: var(--ec-font-body);
          position: relative;
          width: 100%;
          max-width: 380px;
          border-radius: 20px;
          overflow: hidden;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, border-color 0.3s ease;
          cursor: pointer;
          margin: 0 auto;
        }
        .ec-card:hover {
          transform: translateY(-7px);
          box-shadow: 0 24px 56px rgba(0,0,0,0.5), 0 0 0 1px rgba(53,208,127,0.25), 0 0 60px rgba(53,208,127,0.06);
          border-color: rgba(53,208,127,0.35);
        }

        .ec-img-wrap {
          position: relative; width: 100%; height: 210px;
          overflow: hidden; background: var(--ec-s2);
        }
        .ec-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.88) saturate(1.05);
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.4s;
        }
        .ec-card:hover .ec-img { transform: scale(1.07); filter: brightness(0.7) saturate(1.1); }

        .ec-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(15,23,42,0.95) 100%);
          z-index: 1;
        }

        .ec-live {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px;
          background: rgba(53,208,127,0.1);
          border: 1px solid rgba(53,208,127,0.4);
          border-radius: 100px; backdrop-filter: blur(10px);
        }
        .ec-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #35D07F;
          animation: ec-pulse 2s infinite;
        }
        @keyframes ec-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(53,208,127,0); }
        }
        .ec-live-txt {
          font-family: var(--ec-font-display); font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; color: #35D07F;
        }

        .ec-date-chip {
          position: absolute; bottom: 12px; left: 12px; z-index: 3;
          background: rgba(15,23,42,0.75);
          border: 1px solid rgba(53,208,127,0.2);
          border-radius: 12px; padding: 7px 13px;
          backdrop-filter: blur(14px); text-align: center; min-width: 52px;
        }
        .ec-date-month {
          font-family: var(--ec-font-display); font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase; color: #35D07F;
        }
        .ec-date-day {
          font-family: var(--ec-font-display); font-size: 24px; font-weight: 800;
          color: #F8FAFC; line-height: 1; margin-top: 1px;
        }

        .ec-body { padding: 18px 20px 20px; background: var(--ec-surface); }

        .ec-owner-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
        }
        .ec-owner-tag {
          display: flex; align-items: center; gap: 7px; padding: 4px 10px;
          background: rgba(53,208,127,0.06); border: 1px solid rgba(53,208,127,0.12); border-radius: 100px;
        }
        .ec-owner-avatar {
          width: 19px; height: 19px; border-radius: 50%;
          background: linear-gradient(135deg, #35D07F, #22D3EE);
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 700; color: #020617;
          font-family: var(--ec-font-display); flex-shrink: 0;
        }
        .ec-owner-addr { font-size: 11px; color: rgba(248,250,252,0.4); }

        .ec-fav {
          background: none; border: none; cursor: pointer;
          color: rgba(248,250,252,0.2); padding: 4px; border-radius: 8px;
          transition: color 0.2s, transform 0.2s; display: flex; align-items: center;
        }
        .ec-fav:hover { color: #f87171; transform: scale(1.2); }

        .ec-title {
          font-family: var(--ec-font-display); font-size: 17px; font-weight: 700;
          color: #F8FAFC; line-height: 1.3; min-height: 3.3rem; margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .ec-meta {
          display: flex; flex-direction: column; gap: 8px;
          padding-bottom: 16px; margin-bottom: 16px;
          border-bottom: 1px solid rgba(53,208,127,0.08);
        }
        .ec-meta-row { display: flex; align-items: flex-start; gap: 10px; }
        .ec-meta-icon {
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ec-meta-icon.time { background: rgba(34,211,238,0.1); }
        .ec-meta-icon.loc  { background: rgba(34,211,238,0.1); }
        .ec-meta-icon.time svg { stroke: #22D3EE; fill: none; }
        .ec-meta-icon.loc  svg { stroke: #22D3EE; fill: none; }
        .ec-meta-lbl {
          font-size: 10px; font-weight: 500; text-transform: uppercase;
          letter-spacing: 0.1em; color: rgba(248,250,252,0.22); margin-bottom: 2px;
        }
        .ec-meta-val {
          font-size: 13px; color: rgba(248,250,252,0.7); font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;
        }

        .ec-cta {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 12px 16px;
          background: linear-gradient(135deg, #35D07F 0%, #28b86d 100%);
          border: none; border-radius: 13px; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1); text-decoration: none;
        }
        .ec-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(53,208,127,0.35); filter: brightness(1.06);
        }
        .ec-cta-left { display: flex; flex-direction: column; align-items: flex-start; }
        .ec-cta-eye {
          font-size: 10px; font-weight: 500; text-transform: uppercase;
          letter-spacing: 0.08em; color: rgba(2,6,23,0.55);
        }
        .ec-cta-main { font-family: var(--ec-font-display); font-size: 14px; font-weight: 700; color: #020617; }
        .ec-cta-arrow {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(2,6,23,0.15); display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s, background 0.2s; flex-shrink: 0;
        }
        .ec-cta:hover .ec-cta-arrow { transform: translateX(3px); background: rgba(2,6,23,0.25); }
        .ec-cta-arrow svg { width: 14px; height: 14px; stroke: #020617; fill: none; }

        .ec-shimmer {
          position: absolute; top: 0; left: -100%; width: 55%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(53,208,127,0.04), transparent);
          transition: left 0.55s ease; pointer-events: none; z-index: 10;
        }
        .ec-card:hover .ec-shimmer { left: 150%; }
      `}</style>

      <div className="ec-card">
        <div className="ec-shimmer" />

        <div className="ec-img-wrap">
          <img
            className="ec-img"
            src={displayImg}
            alt={event.eventName}
            onError={() => setImgError(true)}
          />
          <div className="ec-img-overlay" />
          {event.isActive && (
            <div className="ec-live">
              <div className="ec-live-dot" />
              <span className="ec-live-txt">Live</span>
            </div>
          )}
          <div className="ec-date-chip">
            <div className="ec-date-month">
              {monthStr} {yearStr}
            </div>
            <div className="ec-date-day">{dayNum}</div>
          </div>
        </div>

        <div className="ec-body">
          <div className="ec-owner-row">
            <div className="ec-owner-tag">
              <div className="ec-owner-avatar">
                {event.owner.slice(2, 4).toUpperCase()}
              </div>
              <span className="ec-owner-addr">{shortAddress}</span>
            </div>
            <button className="ec-fav" aria-label="Save">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                strokeWidth="2"
                fill="none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          <h3 className="ec-title">{event.eventName}</h3>

          <div className="ec-meta">
            <div className="ec-meta-row">
              <div className="ec-meta-icon time">
                <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <div className="ec-meta-lbl">Time</div>
                <div className="ec-meta-val">
                  {formatTime(event.startTime)} — {formatTime(event.endTime)}
                </div>
              </div>
            </div>

            <div className="ec-meta-row">
              <div className="ec-meta-icon loc">
                <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2">
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
                <div className="ec-meta-lbl">Venue</div>
                <div className="ec-meta-val">{event.eventLocation}</div>
              </div>
            </div>
          </div>

          <Link href={`/view_event_details/${event.index}`}>
            <div className="ec-cta">
              <div className="ec-cta-left">
                <span className="ec-cta-eye">Secure your spot</span>
                <span className="ec-cta-main">Book Ticket</span>
              </div>
              <div className="ec-cta-arrow">
                <svg viewBox="0 0 24 24" strokeWidth="2.5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}

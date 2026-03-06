import { useState } from "react";

interface CreatorEventCardProps {
  event: {
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
    isCanceled: boolean;
    fundsReleased: boolean;
    ticketPrice: number;
    fundsHeld: number;
    paymentToken: string;
  };
  onDelete: (eventId: number) => void;
  onCancel: (eventId: number) => Promise<void>;
  onClaimFunds: (eventId: number) => Promise<void>;
  loading: boolean;
  cancelLoading: boolean;
  claimLoading: boolean;
}

const mentoTokens: Record<string, string> = {
  "0x765de816845861e75a25fca122bb6898b8b1282a": "cUSD",
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": "cEUR",
  "0xe8537a3d056da446677b9e9d6c5db704eaab4787": "cREAL",
  "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": "USDT",
  "0x0000000000000000000000000000000000000000": "CELO",
};

const CreatorEventCard: React.FC<CreatorEventCardProps> = ({
  event,
  onDelete,
  onCancel,
  onClaimFunds,
  loading,
  cancelLoading,
  claimLoading,
}) => {
  const [imgError, setImgError] = useState(false);

  // ticketPrice is already decimal-adjusted in MyEvents — just format it
  const formattedTicketPrice = event.ticketPrice.toFixed(4);
  const normalizedToken = event.paymentToken?.trim().toLowerCase();
  const tokenSymbol = mentoTokens[normalizedToken] || event.paymentToken;

  const formattedStartDate = new Date(
    event.startDate * 1000,
  ).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedStartTime = new Date(
    event.startTime * 1000,
  ).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const formattedEndTime = new Date(event.endTime * 1000).toLocaleTimeString(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  );

  // URL is already resolved by MyEvents (handles metadata JSON / direct image)
  const getImageUrl = () => event.eventCardImgUrl || "/default-event.jpg";

  const statusColor = event.isCanceled
    ? "canceled"
    : event.isActive
      ? "active"
      : "inactive";

  return (
    <>
      <style>{`

        .cec-card {
          --ec-surface: #0F172A;
          --ec-s2:      #1E293B;
          --ec-border:  rgba(53,208,127,0.12);
          --ec-green:   #35D07F;
          --ec-cyan:    #22D3EE;
          --ec-text:    #F8FAFC;
          --ec-muted:   rgba(248,250,252,0.45);
          --ec-dimmed:  rgba(248,250,252,0.18);

          font-family: var(--ec-font-body);
          position: relative;
          width: 100%; max-width: 360px;
          border-radius: 20px; overflow: hidden;
          background: var(--ec-surface);
          border: 1px solid var(--ec-border);
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, border-color 0.25s;
          margin: 0 auto;
        }
        .cec-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(53,208,127,0.2);
          border-color: rgba(53,208,127,0.3);
        }
        .cec-card.canceled {
          opacity: 0.72;
          border-color: rgba(239,68,68,0.2);
        }

        /* Image */
        .cec-img-wrap {
          position: relative; width: 100%; height: 190px;
          overflow: hidden; background: var(--ec-s2);
        }
        .cec-img {
          width: 100%; height: 100%; object-fit: cover;
          filter: brightness(0.85);
          transition: transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.3s;
        }
        .cec-card:hover .cec-img { transform: scale(1.06); filter: brightness(0.65); }
        .cec-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 45%, rgba(15,23,42,0.95) 100%);
          z-index: 1;
        }

        /* Status badge */
        .cec-status {
          position: absolute; top: 12px; left: 12px; z-index: 3;
          padding: 4px 12px; border-radius: 100px;
          font-family: var(--ec-font-display); font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          backdrop-filter: blur(10px);
          display: flex; align-items: center; gap: 5px;
        }
        .cec-status.active   { background: rgba(53,208,127,0.12); border: 1px solid rgba(53,208,127,0.4); color: #35D07F; }
        .cec-status.inactive { background: rgba(248,250,252,0.07); border: 1px solid rgba(248,250,252,0.15); color: rgba(248,250,252,0.5); }
        .cec-status.canceled { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.35); color: #f87171; }
        .cec-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .cec-status.active .cec-status-dot { animation: cec-pulse 2s infinite; }
        @keyframes cec-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(53,208,127,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(53,208,127,0); }
        }

        /* Action buttons top-right */
        .cec-actions {
          position: absolute; top: 10px; right: 10px; z-index: 4;
          display: flex; gap: 6px;
        }
        .cec-action-btn {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer;
          transition: all 0.2s ease; backdrop-filter: blur(10px);
        }
        .cec-action-btn.cancel {
          background: rgba(251,191,36,0.15);
          border: 1px solid rgba(251,191,36,0.35);
          color: #fbbf24;
        }
        .cec-action-btn.cancel:hover:not(:disabled) { background: rgba(251,191,36,0.25); transform: scale(1.1); }
        .cec-action-btn.delete {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #f87171;
        }
        .cec-action-btn.delete:hover:not(:disabled) { background: rgba(239,68,68,0.2); transform: scale(1.1); }
        .cec-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cec-action-btn svg { width: 14px; height: 14px; stroke: currentColor; fill: none; }

        /* Price chip floating bottom */
        .cec-price-chip {
          position: absolute; bottom: 12px; right: 12px; z-index: 3;
          padding: 5px 12px;
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(53,208,127,0.2);
          border-radius: 100px; backdrop-filter: blur(12px);
          font-family: var(--ec-font-display); font-size: 12px; font-weight: 700;
          color: var(--ec-green);
        }

        /* Body */
        .cec-body { padding: 18px 20px 20px; }

        .cec-name {
          font-family: var(--ec-font-display);
          font-size: 16px; font-weight: 700;
          color: var(--ec-text); line-height: 1.3;
          margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .cec-meta { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
        .cec-meta-row { display: flex; align-items: center; gap: 9px; }
        .cec-meta-icon {
          width: 26px; height: 26px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .cec-meta-icon.date  { background: rgba(34,211,238,0.1);  }
        .cec-meta-icon.time  { background: rgba(34,211,238,0.1);  }
        .cec-meta-icon.loc   { background: rgba(34,211,238,0.1);  }
        .cec-meta-icon svg { width: 13px; height: 13px; fill: none; }
        .cec-meta-icon.date svg { stroke: #22D3EE; }
        .cec-meta-icon.time svg { stroke: #22D3EE; }
        .cec-meta-icon.loc  svg { stroke: #22D3EE; }
        .cec-meta-val { font-size: 12px; color: var(--ec-muted); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }

        /* Divider */
        .cec-divider { height: 1px; background: rgba(53,208,127,0.07); margin-bottom: 14px; }

        /* Claim button */
        .cec-claim-btn {
          width: 100%; padding: 12px;
          background: linear-gradient(135deg, #35D07F, #28b86d);
          border: none; border-radius: 13px; cursor: pointer;
          font-family: var(--ec-font-display); font-size: 13px; font-weight: 700;
          color: #020617; transition: all 0.3s ease;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .cec-claim-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(53,208,127,0.3);
          filter: brightness(1.06);
        }
        .cec-claim-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Spinner */
        .cec-spin {
          width: 14px; height: 14px;
          border: 2px solid rgba(2,6,23,0.25);
          border-top-color: #020617;
          border-radius: 50%;
          animation: cec-rotate 0.7s linear infinite;
        }
        @keyframes cec-rotate { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`cec-card ${statusColor}`}>
        {/* Image */}
        <div className="cec-img-wrap">
          <img
            className="cec-img"
            src={imgError ? "/default-event.jpg" : getImageUrl()}
            alt={event.eventName}
            onError={() => setImgError(true)}
          />
          <div className="cec-img-overlay" />

          {/* Status badge */}
          <div className={`cec-status ${statusColor}`}>
            <div className="cec-status-dot" />
            {event.isCanceled
              ? "Canceled"
              : event.isActive
                ? "Active"
                : "Inactive"}
          </div>

          {/* Action buttons */}
          <div className="cec-actions">
            {event.isActive && !event.isCanceled && (
              <button
                className="cec-action-btn cancel"
                onClick={() => onCancel(event.index)}
                disabled={cancelLoading}
                aria-label="Cancel event"
                title="Cancel event"
              >
                {cancelLoading ? (
                  <div
                    className="cec-spin"
                    style={{ borderTopColor: "#fbbf24" }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Price floating chip */}
          <div className="cec-price-chip">
            {formattedTicketPrice} {tokenSymbol}
          </div>
        </div>

        {/* Body */}
        <div className="cec-body">
          <h3 className="cec-name">{event.eventName}</h3>

          <div className="cec-meta">
            <div className="cec-meta-row">
              <div className="cec-meta-icon date">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <span className="cec-meta-val">{formattedStartDate}</span>
            </div>
            <div className="cec-meta-row">
              <div className="cec-meta-icon time">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
              </div>
              <span className="cec-meta-val">
                {formattedStartTime} — {formattedEndTime}
              </span>
            </div>
            <div className="cec-meta-row">
              <div className="cec-meta-icon loc">
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
              </div>
              <span className="cec-meta-val">{event.eventLocation}</span>
            </div>
          </div>

          <div className="cec-divider" />

          {(() => {
            const now = Date.now() / 1000;
            const eventEnded = now > event.endDate;
            const canClaim =
              eventEnded &&
              !event.isCanceled &&
              !event.fundsReleased &&
              event.fundsHeld > 0;
            const tokenSymbol =
              mentoTokens[event.paymentToken?.trim().toLowerCase()] ?? "tokens";

            if (event.fundsReleased)
              return (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "var(--ec-dimmed)",
                  }}
                >
                  ✅ Funds already claimed
                </div>
              );
            if (event.isCanceled)
              return (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "var(--ec-dimmed)",
                  }}
                >
                  Event canceled — no funds to claim
                </div>
              );
            if (!eventEnded)
              return (
                <div
                  style={{
                    textAlign: "center",
                    padding: "10px 0",
                    fontSize: 12,
                    color: "var(--ec-dimmed)",
                  }}
                >
                  🕐 Claimable after event ends
                </div>
              );
            return (
              <button
                className="cec-claim-btn"
                onClick={() => onClaimFunds(event.index)}
                disabled={claimLoading || !canClaim}
              >
                {claimLoading ? (
                  <>
                    <div className="cec-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="#020617"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Claim {event.fundsHeld.toFixed(4)} {tokenSymbol}
                  </>
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default CreatorEventCard;

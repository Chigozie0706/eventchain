"use client";

import { useState, useEffect } from "react";
import { EventData } from "../types";
import { FormInput } from "@/components/FormInput";

export type Token = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
  handleTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tokenOptions: Token[];
}

export default function Tickets({
  eventData,
  setEventData,
  handleTokenChange,
  tokenOptions,
}: Props) {
  const [errors, setErrors] = useState({
    ticketPrice: "",
    maxCapacity: "",
    refundBufferHours: "",
  });

  useEffect(() => {
    const e = { ticketPrice: "", maxCapacity: "", refundBufferHours: "" };

    if (eventData.eventPrice) {
      const p = parseFloat(eventData.eventPrice);
      if (isNaN(p) || p < 0) e.ticketPrice = "Price must be 0 or greater";
      else if (p > 1000000) e.ticketPrice = "Price seems unusually high";
    }

    if (eventData.maxCapacity) {
      const c = parseInt(eventData.maxCapacity);
      if (isNaN(c) || c <= 0) e.maxCapacity = "Capacity must be greater than 0";
      else if (c > 100000) e.maxCapacity = "Capacity cannot exceed 100,000";
    }

    if (eventData.refundPolicy === "2" && eventData.refundBufferHours) {
      const h = parseInt(eventData.refundBufferHours);
      if (isNaN(h) || h <= 0)
        e.refundBufferHours = "Buffer must be greater than 0";
      else if (h > 720)
        e.refundBufferHours = "Buffer cannot exceed 720 hours (30 days)";
      else if (eventData.startDate && eventData.startTime) {
        const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
        const hrsUntil = (start.getTime() - Date.now()) / 3600000;
        if (h >= hrsUntil)
          e.refundBufferHours = "Buffer exceeds time until event";
      }
    }

    setErrors(e);
  }, [
    eventData.eventPrice,
    eventData.maxCapacity,
    eventData.refundBufferHours,
    eventData.refundPolicy,
    eventData.startDate,
    eventData.startTime,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        .ec-tk-error {
          font-size: 11px; color: #F87171;
          display: flex; align-items: center; gap: 5px;
          margin-top: 4px;
        }
        .ec-tk-error svg { width: 11px; height: 11px; stroke: currentColor; fill: none; flex-shrink: 0; }

        /* Token selector chips */
        .ec-token-chips {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .ec-token-chip {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px;
          border-radius: 100px;
          border: 1px solid rgba(53, 208, 127, 0.18);
          background: transparent;
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 12px; font-weight: 700;
          color: rgba(248, 250, 252, 0.50);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ec-token-chip:hover {
          border-color: rgba(53, 208, 127, 0.40);
          color: rgba(248, 250, 252, 0.80);
          background: rgba(53, 208, 127, 0.05);
        }
        .ec-token-chip.selected {
          border-color: #35D07F;
          background: rgba(53, 208, 127, 0.10);
          color: #4DDBA0;
          box-shadow: 0 0 0 1px rgba(53,208,127,0.2);
        }
        .ec-token-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #35D07F;
        }

        /* Refund policy tiles */
        .ec-refund-tiles {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .ec-refund-tile {
          display: flex; flex-direction: column; gap: 4px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(53, 208, 127, 0.13);
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .ec-refund-tile:hover {
          border-color: rgba(53, 208, 127, 0.30);
          background: rgba(53, 208, 127, 0.04);
        }
        .ec-refund-tile.selected {
          border-color: rgba(53, 208, 127, 0.55);
          background: rgba(53, 208, 127, 0.08);
        }
        .ec-refund-tile-label {
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 12px; font-weight: 700;
          color: rgba(248, 250, 252, 0.70);
        }
        .ec-refund-tile.selected .ec-refund-tile-label { color: #4DDBA0; }
        .ec-refund-tile-desc {
          font-size: 11px;
          color: rgba(248, 250, 252, 0.35);
          line-height: 1.4;
        }

        /* Info guide box */
        .ec-tk-guide {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 16px;
          background: rgba(34, 211, 238, 0.06);
          border: 1px solid rgba(34, 211, 238, 0.18);
          border-radius: 12px;
        }
        .ec-tk-guide-icon {
          width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px;
          stroke: #22D3EE; fill: none;
        }
        .ec-tk-guide-title {
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 12px; font-weight: 700;
          color: #22D3EE;
          margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .ec-tk-guide-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 3px;
        }
        .ec-tk-guide-list li {
          font-size: 12px;
          color: rgba(34, 211, 238, 0.65);
          display: flex; align-items: flex-start; gap: 6px;
        }
        .ec-tk-guide-list li::before {
          content: '';
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(34,211,238,0.45); flex-shrink: 0; margin-top: 5px;
        }
      `}</style>

      {/* Token selector */}
      <FormInput label="Payment Token" required>
        <div className="ec-token-chips">
          {tokenOptions.map((token) => (
            <button
              key={token.address}
              type="button"
              className={`ec-token-chip ${eventData.paymentToken === token.address ? "selected" : ""}`}
              onClick={() =>
                handleTokenChange({
                  target: { value: token.address },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              {eventData.paymentToken === token.address && (
                <span className="ec-token-dot" />
              )}
              {token.symbol}
            </button>
          ))}
        </div>
      </FormInput>

      {/* Price + Capacity */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <FormInput label="Ticket Price" required>
          <>
            <input
              type="number"
              name="ticketPrice"
              value={eventData.eventPrice}
              min="0"
              step="0.001"
              onChange={(e) =>
                setEventData({ ...eventData, eventPrice: e.target.value })
              }
              placeholder="0.00"
              className={errors.ticketPrice ? "ec-input-error" : ""}
            />
            {errors.ticketPrice && (
              <p className="ec-tk-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.ticketPrice}
              </p>
            )}
          </>
        </FormInput>

        <FormInput label="Max Capacity" required>
          <>
            <input
              type="number"
              name="maxCapacity"
              value={eventData.maxCapacity}
              min="1"
              max="100000"
              onChange={(e) =>
                setEventData({ ...eventData, maxCapacity: e.target.value })
              }
              placeholder="100"
              className={errors.maxCapacity ? "ec-input-error" : ""}
            />
            {errors.maxCapacity && (
              <p className="ec-tk-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.maxCapacity}
              </p>
            )}
          </>
        </FormInput>
      </div>

      {/* Refund policy tiles */}
      <FormInput label="Refund Policy" required>
        <div className="ec-refund-tiles">
          {[
            {
              value: "0",
              label: "No Refunds",
              desc: "Tickets are non-refundable",
            },
            {
              value: "1",
              label: "Before Start",
              desc: "Refund anytime before event",
            },
            {
              value: "2",
              label: "Custom Buffer",
              desc: "Refund until X hours before",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`ec-refund-tile ${eventData.refundPolicy === opt.value ? "selected" : ""}`}
              onClick={() =>
                setEventData({ ...eventData, refundPolicy: opt.value })
              }
            >
              <span className="ec-refund-tile-label">{opt.label}</span>
              <span className="ec-refund-tile-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </FormInput>

      {/* Buffer hours */}
      {eventData.refundPolicy === "2" && (
        <FormInput
          label="Refund Buffer (Hours)"
          required
          hint="Refunds allowed until this many hours before event start (max 720h / 30 days)"
        >
          <>
            <input
              type="number"
              name="refundBufferHours"
              value={eventData.refundBufferHours}
              min="1"
              max="720"
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  refundBufferHours: e.target.value,
                })
              }
              placeholder="24"
              className={errors.refundBufferHours ? "ec-input-error" : ""}
            />
            {errors.refundBufferHours && (
              <p className="ec-tk-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.refundBufferHours}
              </p>
            )}
          </>
        </FormInput>
      )}

      {/* Guide */}
      <div className="ec-tk-guide">
        <svg className="ec-tk-guide-icon" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
        </svg>
        <div>
          <div className="ec-tk-guide-title">Refund Policy Guide</div>
          <ul className="ec-tk-guide-list">
            <li>
              <strong>No Refunds:</strong> Tickets cannot be refunded after
              purchase
            </li>
            <li>
              <strong>Before Start:</strong> Attendees can refund at any time
              before the event begins
            </li>
            <li>
              <strong>Custom Buffer:</strong> Refunds are allowed until X hours
              before the event starts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

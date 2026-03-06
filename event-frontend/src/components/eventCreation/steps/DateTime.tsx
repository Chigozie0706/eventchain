"use client";

import { useState, useEffect } from "react";
import { EventData } from "../types";
import { FormInput } from "@/components/FormInput";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
}

export default function DateTime({ eventData, setEventData }: Props) {
  const [errors, setErrors] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  useEffect(() => {
    const e = { startDate: "", startTime: "", endDate: "", endTime: "" };

    if (
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime
    ) {
      const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const end = new Date(`${eventData.endDate}T${eventData.endTime}`);
      const now = new Date();

      if (start.getTime() < now.getTime())
        e.startDate = "Start date must be in the future";
      if (end.getTime() <= start.getTime())
        e.endDate = "End date must be after start date";
      const hrs = (end.getTime() - start.getTime()) / 3600000;
      if (hrs < 1) e.endTime = "Event must be at least 1 hour long";
      if (hrs / 24 > 365) e.endDate = "Event duration cannot exceed 365 days";
    }
    setErrors(e);
  }, [
    eventData.startDate,
    eventData.startTime,
    eventData.endDate,
    eventData.endTime,
  ]);

  const hasError = Object.values(errors).some(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        .ec-dt-error {
          font-size: 11px; color: #F87171;
          display: flex; align-items: center; gap: 5px;
          margin-top: 4px;
        }
        .ec-dt-error svg { width: 11px; height: 11px; stroke: currentColor; fill: none; flex-shrink: 0; }

        .ec-dt-notice {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 14px 16px;
          background: rgba(251, 191, 36, 0.07);
          border: 1px solid rgba(251, 191, 36, 0.22);
          border-radius: 12px;
        }
        .ec-dt-notice-icon {
          width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px;
          stroke: #FBBF24; fill: none;
        }
        .ec-dt-notice-title {
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 12px; font-weight: 700;
          color: #FBBF24;
          margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .ec-dt-notice-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 3px;
        }
        .ec-dt-notice-list li {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: rgba(251, 191, 36, 0.75);
          display: flex; align-items: center; gap: 6px;
        }
        .ec-dt-notice-list li::before {
          content: '';
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(251,191,36,0.5); flex-shrink: 0;
        }
      `}</style>

      {/* Start row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <FormInput label="Start Date" required>
          <>
            <input
              type="date"
              name="startDate"
              value={eventData.startDate}
              onChange={(e) =>
                setEventData({ ...eventData, startDate: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className={errors.startDate ? "ec-input-error" : ""}
            />
            {errors.startDate && (
              <p className="ec-dt-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.startDate}
              </p>
            )}
          </>
        </FormInput>

        <FormInput label="Start Time" required>
          <>
            <input
              type="time"
              name="startTime"
              value={eventData.startTime}
              onChange={(e) =>
                setEventData({ ...eventData, startTime: e.target.value })
              }
              className={errors.startTime ? "ec-input-error" : ""}
            />
            {errors.startTime && (
              <p className="ec-dt-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.startTime}
              </p>
            )}
          </>
        </FormInput>
      </div>

      {/* End row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        <FormInput label="End Date" required>
          <>
            <input
              type="date"
              name="endDate"
              value={eventData.endDate}
              onChange={(e) =>
                setEventData({ ...eventData, endDate: e.target.value })
              }
              min={
                eventData.startDate || new Date().toISOString().split("T")[0]
              }
              className={errors.endDate ? "ec-input-error" : ""}
            />
            {errors.endDate && (
              <p className="ec-dt-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.endDate}
              </p>
            )}
          </>
        </FormInput>

        <FormInput label="End Time" required>
          <>
            <input
              type="time"
              name="endTime"
              value={eventData.endTime}
              onChange={(e) =>
                setEventData({ ...eventData, endTime: e.target.value })
              }
              className={errors.endTime ? "ec-input-error" : ""}
            />
            {errors.endTime && (
              <p className="ec-dt-error">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
                </svg>
                {errors.endTime}
              </p>
            )}
          </>
        </FormInput>
      </div>

      {/* Requirements notice */}
      <div className="ec-dt-notice">
        <svg className="ec-dt-notice-icon" viewBox="0 0 24 24" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div>
          <div className="ec-dt-notice-title">Duration Requirements</div>
          <ul className="ec-dt-notice-list">
            <li>Minimum event duration: 1 hour</li>
            <li>Maximum event duration: 365 days</li>
            <li>Start date must be in the future</li>
            <li>End date/time must be after start</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

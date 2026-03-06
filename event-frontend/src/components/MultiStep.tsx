"use client";

import { useState } from "react";
import Progress from "./Progress";
import EventDetails from "./eventCreation/steps/EventDetails";
import Location from "./eventCreation/steps/Location";
import Tickets from "./eventCreation/steps/Tickets";
import DateTime from "./eventCreation/steps/DateTime";
import { EventData } from "./eventCreation/types";

export type Token = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

interface MultiStepProps {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  preview: string | null;
  loading: boolean;
  setPreview: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  tokenOptions: Token[];
  createEvent: () => Promise<void>;
}

const STEP_META = [
  {
    label: "Event Details",
    eyebrow: "Step 1 of 4",
    desc: "Tell us about your event",
  },
  {
    label: "Location",
    eyebrow: "Step 2 of 4",
    desc: "Where will your event take place?",
  },
  {
    label: "Date & Time",
    eyebrow: "Step 3 of 4",
    desc: "Set your event schedule",
  },
  {
    label: "Tickets",
    eyebrow: "Step 4 of 4",
    desc: "Configure pricing and capacity",
  },
];

export function MultiStep({
  eventData,
  setEventData,
  file,
  setFile,
  preview,
  setPreview,
  error,
  setError,
  handleFileChange,
  handleDrop,
  handleDragOver,
  handleTokenChange,
  tokenOptions,
  createEvent,
  loading,
}: MultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const totalSteps = 4;

  const animateStep = (cb: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      cb();
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () =>
    animateStep(() => setCurrentStep((p) => Math.min(p + 1, totalSteps)));
  const handlePrev = () =>
    animateStep(() => setCurrentStep((p) => Math.max(p - 1, 1)));
  const handleStepClick = (step: number) => setCurrentStep(step);

  const meta = STEP_META[currentStep - 1];

  const renderStep = () => {
    const cls = `ms-step-content ${isAnimating ? "ms-step-out" : "ms-step-in"}`;
    switch (currentStep) {
      case 1:
        return (
          <div className={cls}>
            <EventDetails
              eventData={eventData}
              setEventData={setEventData}
              file={file}
              setFile={setFile}
              preview={preview}
              setPreview={setPreview}
              error={error}
              setError={setError}
              handleFileChange={handleFileChange}
              handleDrop={handleDrop}
              handleDragOver={handleDragOver}
            />
          </div>
        );
      case 2:
        return (
          <div className={cls}>
            <Location eventData={eventData} setEventData={setEventData} />
          </div>
        );
      case 3:
        return (
          <div className={cls}>
            <DateTime eventData={eventData} setEventData={setEventData} />
          </div>
        );
      case 4:
        return (
          <div className={cls}>
            <Tickets
              eventData={eventData}
              setEventData={setEventData}
              handleTokenChange={handleTokenChange}
              tokenOptions={tokenOptions}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="ms-root">
      <style>{`
        .ms-root {
          width: 100%;
          min-height: 100vh;
          background: #020617;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 80px 16px 60px;
          position: relative;
        }

        /* Ambient glow */
        .ms-root::before {
          content: '';
          position: fixed;
          top: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 500px;
          background: radial-gradient(ellipse, rgba(53,208,127,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Grid overlay */
        .ms-root::after {
          content: '';
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(53,208,127,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53,208,127,0.04) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none; z-index: 0;
          mask-image: radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 80%);
        }

        /* Card */
        .ms-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 680px;
          background: #0C1A2E;
          border: 1px solid rgba(53, 208, 127, 0.13);
          border-radius: 24px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(53,208,127,0.06);
          overflow: hidden;
          animation: ms-card-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes ms-card-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Card header */
        .ms-header {
          padding: 32px 36px 28px;
          border-bottom: 1px solid rgba(53, 208, 127, 0.08);
          background: linear-gradient(180deg,
            rgba(53,208,127,0.04) 0%,
            transparent 100%);
        }

        .ms-eyebrow {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: #35D07F;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 6px;
        }
        .ms-eyebrow::before {
          content: '';
          display: inline-block;
          width: 18px; height: 2px;
          background: #35D07F; border-radius: 2px;
        }

        .ms-title {
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.1;
          color: #F8FAFC;
          margin-bottom: 4px;
        }

        .ms-desc {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          color: rgba(248,250,252,0.45);
        }

        /* Progress inside header */
        .ms-progress-wrap {
          margin-top: 28px;
        }

        /* Body */
        .ms-body {
          padding: 32px 36px;
          min-height: 400px;
        }

        /* Step animations */
        .ms-step-content { width: 100%; }
        .ms-step-in {
          animation: ms-step-enter 0.25s cubic-bezier(0.16,1,0.3,1) both;
        }
        .ms-step-out {
          animation: ms-step-leave 0.18s ease-in both;
        }
        @keyframes ms-step-enter {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes ms-step-leave {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-12px); }
        }

        /* Footer */
        .ms-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 36px 28px;
          border-top: 1px solid rgba(53, 208, 127, 0.07);
        }

        .ms-step-counter {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 12px; font-weight: 500;
          color: rgba(248, 250, 252, 0.28);
        }

        /* Prev button */
        .ms-btn-prev {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 20px;
          background: rgba(248,250,252,0.04);
          border: 1px solid rgba(248,250,252,0.10);
          border-radius: 12px;
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 13px; font-weight: 600;
          color: rgba(248,250,252,0.45);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ms-btn-prev:hover:not(:disabled) {
          background: rgba(248,250,252,0.07);
          border-color: rgba(248,250,252,0.18);
          color: rgba(248,250,252,0.70);
          transform: translateX(-2px);
        }
        .ms-btn-prev:disabled { opacity: 0.25; cursor: not-allowed; }
        .ms-btn-prev svg { width: 14px; height: 14px; stroke: currentColor; fill: none; }

        /* Next button */
        .ms-btn-next {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #35D07F 0%, #28B86D 100%);
          border: none;
          border-radius: 12px;
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 14px; font-weight: 700;
          color: #020617;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .ms-btn-next:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(53,208,127,0.30);
          filter: brightness(1.06);
        }
        .ms-btn-next svg { width: 14px; height: 14px; stroke: currentColor; fill: none; }

        /* Create button */
        .ms-btn-create {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #35D07F 0%, #28B86D 100%);
          border: none;
          border-radius: 12px;
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 14px; font-weight: 700;
          color: #020617;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .ms-btn-create:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(53,208,127,0.35);
          filter: brightness(1.06);
        }
        .ms-btn-create:disabled { opacity: 0.55; cursor: not-allowed; }
        .ms-btn-create svg { width: 15px; height: 15px; stroke: currentColor; fill: none; }

        /* Loading spinner */
        .ms-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(2,6,23,0.25);
          border-top-color: #020617;
          border-radius: 50%;
          animation: ms-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes ms-spin { to { transform: rotate(360deg); } }

        /* Mobile */
        @media (max-width: 640px) {
          .ms-root { padding: 72px 12px 40px; }
          .ms-header, .ms-body, .ms-footer { padding-left: 20px; padding-right: 20px; }
          .ms-title { font-size: 22px; }
          .ms-card { border-radius: 18px; }
        }
      `}</style>

      <div className="ms-card">
        {/* Header */}
        <div className="ms-header">
          <div className="ms-eyebrow">{meta.eyebrow}</div>
          <h1 className="ms-title">{meta.label}</h1>
          <p className="ms-desc">{meta.desc}</p>
          <div className="ms-progress-wrap">
            <Progress
              totalSteps={totalSteps}
              currentStep={currentStep}
              labels={STEP_META.map((s) => s.label)}
              onStepClick={handleStepClick}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="ms-body">{renderStep()}</div>

        {/* Footer nav */}
        <div className="ms-footer">
          <button
            className="ms-btn-prev"
            onClick={handlePrev}
            disabled={currentStep === 1}
          >
            <svg viewBox="0 0 24 24" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <span className="ms-step-counter">
            {currentStep} / {totalSteps}
          </span>

          {currentStep < totalSteps ? (
            <button className="ms-btn-next" onClick={handleNext}>
              Continue
              <svg viewBox="0 0 24 24" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <button
              className="ms-btn-create"
              onClick={createEvent}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="ms-spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Event
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

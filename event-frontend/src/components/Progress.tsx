"use client";

interface ProgressProps {
  totalSteps: number;
  currentStep: number;
  labels: string[];
  onStepClick: (step: number) => void;
}

export default function Progress({
  totalSteps,
  currentStep,
  labels,
  onStepClick,
}: ProgressProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="ec-progress">
      <style>{`
        .ec-progress {
          position: relative;
          width: 100%;
          margin-bottom: 44px;
          padding-top: 4px;
        }

        /* ── Track ── */
        .ec-progress-track {
          position: absolute;
          top: 22px;
          left: 0; right: 0;
          height: 2px;
          background: rgba(248, 250, 252, 0.07);
          border-radius: 2px;
          overflow: hidden;
        }
        .ec-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #35D07F, #22D3EE);
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 12px rgba(53, 208, 127, 0.4);
        }

        /* ── Steps row ── */
        .ec-progress-steps {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .ec-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          gap: 10px;
        }

        /* ── Circle ── */
        .ec-step-circle {
          position: relative;
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--ec-font-display, 'General Sans', sans-serif);
          font-size: 13px; font-weight: 700;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
          border: 2px solid transparent;
          background: #0C1A2E;
        }

        /* Pending */
        .ec-step-circle.pending {
          border-color: rgba(248, 250, 252, 0.10);
          color: rgba(248, 250, 252, 0.22);
        }

        /* Completed */
        .ec-step-circle.completed {
          background: rgba(53, 208, 127, 0.12);
          border-color: rgba(53, 208, 127, 0.45);
          color: #35D07F;
          cursor: pointer;
        }
        .ec-step-circle.completed:hover {
          background: rgba(53, 208, 127, 0.18);
          border-color: #35D07F;
          transform: scale(1.06);
          box-shadow: 0 0 20px rgba(53, 208, 127, 0.2);
        }

        /* Active */
        .ec-step-circle.active {
          background: #35D07F;
          border-color: #35D07F;
          color: #020617;
          box-shadow: 0 0 0 4px rgba(53, 208, 127, 0.15),
                      0 0 24px rgba(53, 208, 127, 0.25);
          transform: scale(1.08);
        }

        /* Active pulse ring */
        .ec-step-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(53, 208, 127, 0.4);
          animation: ec-step-ping 2s ease-out infinite;
        }
        @keyframes ec-step-ping {
          0%   { transform: scale(1);    opacity: 0.7; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        /* Check icon */
        .ec-step-check { width: 18px; height: 18px; stroke: #35D07F; fill: none; }

        /* ── Labels ── */
        .ec-step-label {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-align: center;
          transition: color 0.3s ease;
          white-space: nowrap;
        }
        .ec-step-label.pending   { color: rgba(248, 250, 252, 0.22); }
        .ec-step-label.completed { color: rgba(248, 250, 252, 0.50); }
        .ec-step-label.active    { color: #35D07F; }
      `}</style>

      {/* Track */}
      <div className="ec-progress-track">
        <div className="ec-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Steps */}
      <div className="ec-progress-steps">
        {labels.map((label, index) => {
          const stepNum = index + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          const isPending = currentStep < stepNum;
          const state = isCompleted
            ? "completed"
            : isActive
              ? "active"
              : "pending";

          return (
            <div key={index} className="ec-step">
              <button
                className={`ec-step-circle ${state}`}
                onClick={() => isCompleted && onStepClick(stepNum)}
                disabled={!isCompleted}
                aria-label={`Step ${stepNum}: ${label}`}
              >
                {isActive && <span className="ec-step-pulse" />}

                {isCompleted ? (
                  <svg
                    className="ec-step-check"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </button>

              <span className={`ec-step-label ${state}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

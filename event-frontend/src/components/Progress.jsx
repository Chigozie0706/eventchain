import { useState } from "react";

// Enhanced Progress Component
export default function Progress({
  totalSteps,
  currentStep,
  labels,
  onStepClick,
}) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="relative w-full mb-12">
      {/* Progress bar background */}
      <div className="absolute top-6 left-0 w-full h-1 bg-gray-200 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="relative flex justify-between">
        {labels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const isClickable = stepNumber < currentStep;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              {/* Circle */}
              <button
                onClick={() => isClickable && onStepClick(stepNumber)}
                disabled={!isClickable}
                className={`
                  relative w-12 h-12 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all duration-300 transform
                  ${
                    isClickable
                      ? "cursor-pointer hover:scale-110"
                      : "cursor-default"
                  }
                  ${
                    isCompleted
                      ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-100"
                      : isActive
                        ? "bg-white border-4 border-orange-500 text-orange-600 shadow-lg scale-110"
                        : "bg-white border-2 border-gray-300 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}

                {/* Active pulse animation */}
                {isActive && (
                  <span className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping opacity-75" />
                )}
              </button>

              {/* Label */}
              <span
                className={`
                  mt-3 text-xs font-medium text-center transition-colors duration-300
                  ${
                    isActive
                      ? "text-orange-600"
                      : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400"
                  }
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

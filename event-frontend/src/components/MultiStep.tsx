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
  createEvent,
  tokenOptions,
  loading,
}: MultiStepProps) {
  const [errors, setErrors] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const labels = ["Event Details", "Location", "Date & Time", "Tickets"];

  // Validation rules per step
  const validateStep = (step: number) => {
    const newErrors = {};

    switch (step) {
      case 1:
        break;
      case 2:
        break;
      case 3:
        break;
      case 4:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setIsAnimating(false);
      // setErrors({});
    }, 200);
  };

  const handleStepClick = (step: any) => {
    setCurrentStep(step);
    // setErrors({});
  };

  // Render step content
  const renderStepContent = () => {
    const contentClass = `transition-all duration-300 ${
      isAnimating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
    }`;

    switch (currentStep) {
      case 1:
        return (
          <div className={contentClass}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Event Details
            </h2>
            <p className="text-gray-600 mb-6">Tell us about your event</p>

            <div className="space-y-4">
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
                handleDrop={handleDragOver}
                handleDragOver={handleDragOver}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={contentClass}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Event Location
            </h2>
            <p className="text-gray-600 mb-6">
              Where will your event take place?
            </p>

            <Location eventData={eventData} setEventData={setEventData} />
          </div>
        );

      case 3:
        return (
          <div className={contentClass}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Date & Time
            </h2>
            <div className="space-y-4">
              <DateTime eventData={eventData} setEventData={setEventData} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className={contentClass}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Tickets & Capacity
            </h2>
            <p className="text-gray-600 mb-6">
              Set pricing and capacity limits
            </p>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <Progress
          totalSteps={totalSteps}
          currentStep={currentStep}
          labels={labels}
          onStepClick={handleStepClick}
        />

        <div className="mb-8 min-h-[400px]">{renderStepContent()}</div>
        {/* Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
            }`}
          >
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Next
            </button>
          ) : (
            <button
              onClick={createEvent}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Create Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

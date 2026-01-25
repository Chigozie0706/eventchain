"use client";

import { FormInput } from "@/components/FormInput";
import { EventData } from "../types";

interface Props {
  eventData: EventData;
  setEventData: React.Dispatch<React.SetStateAction<EventData>>;
  file: File | null;
  setFile: (file: File | null) => void;
  preview: string | null;
  setPreview: (url: string | null) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function EventDetails({
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
}: Props) {
  return (
    <>
      <div className="space-y-4">
        <FormInput label="Event Name" required>
          <input
            type="text"
            name="eventName"
            value={eventData.eventName}
            onChange={(e) =>
              setEventData({ ...eventData, eventName: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${"border-gray-300"}`}
            placeholder="e.g., Tech Conference 2026"
          />
        </FormInput>

        <FormInput label="Event Image " required>
          <div
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex justify-center text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        </FormInput>

        {preview && (
          <div className="mt-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto max-h-60 rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Remove image
            </button>
          </div>
        )}
      </div>

      <FormInput label="Event Details" required>
        <textarea
          name="eventDetails"
          value={eventData.eventDetails}
          onChange={(e) =>
            setEventData({ ...eventData, eventDetails: e.target.value })
          }
          placeholder="Describe your event in detail..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${"border-gray-300"}`}
        ></textarea>
      </FormInput>

      <FormInput label="Minimum Age" required>
        <input
          type="number"
          name="minimumAge"
          value={eventData.minimumAge}
          onChange={(e) =>
            setEventData({ ...eventData, minimumAge: e.target.value })
          }
          placeholder="Enter minimum age (0 for no restriction)"
          min="0"
          max="120"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${"border-gray-300"}`}
        />
      </FormInput>
    </>
  );
}

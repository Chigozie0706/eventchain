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

const CATEGORIES = [
  { value: "0", label: "Religious & Faith" },
  { value: "1", label: "Education" },
  { value: "2", label: "Business" },
  { value: "3", label: "Technology" },
  { value: "4", label: "Community" },
  { value: "5", label: "Family & Personal" },
  { value: "6", label: "Health & Wellness" },
  { value: "7", label: "Arts & Culture" },
  { value: "8", label: "Charity & Fundraising" },
];

const SUBCATEGORIES: Record<string, string[]> = {
  "0": [
    "Sunday Service",
    "Wedding",
    "Crusade",
    "Youth Program",
    "Prayer Meeting",
    "Bible Study",
    "Baptism",
    "Funeral Service",
    "Church Anniversary",
    "Revival",
    "Choir Concert",
    "Missions Trip",
    "Thanksgiving Service",
    "Naming Ceremony",
  ],
  "1": [
    "Seminar",
    "Workshop",
    "Conference",
    "Graduation",
    "Lecture",
    "Training",
    "Tutoring Session",
    "Debate",
    "Career Fair",
  ],
  "2": [
    "Networking",
    "Product Launch",
    "Corporate Meeting",
    "Trade Fair",
    "Pitch Event",
    "Entrepreneurs Forum",
    "Business Summit",
  ],
  "3": [
    "Hackathon",
    "Tech Talk",
    "Demo Day",
    "Developer Meetup",
    "AI Workshop",
    "Coding Bootcamp",
    "Tech Exhibition",
  ],
  "4": [
    "Town Hall",
    "Cultural Festival",
    "Sports Tournament",
    "Clean-up Event",
    "Church Outreach",
    "Food Drive",
    "Neighbourhood Meeting",
  ],
  "5": [
    "Birthday",
    "Baby Shower",
    "House Warming",
    "Naming Ceremony",
    "Thanksgiving Service",
    "Wedding Anniversary",
    "Graduation Party",
  ],
  "6": [
    "Fitness Class",
    "Medical Outreach",
    "Marathon",
    "Health Screening",
    "Sports Tournament",
    "First Aid Training",
  ],
  "7": [
    "Gospel Concert",
    "Art Exhibition",
    "Theatre",
    "Poetry Night",
    "Gospel Comedy Show",
    "Film Screening",
    "Photography Exhibition",
  ],
  "8": [
    "Church Fundraiser",
    "NGO Drive",
    "Awareness Campaign",
    "Charity Gala",
    "Food Bank",
    "Community Support Drive",
  ],
};

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

        <FormInput label="Event Category" required>
          <select
            name="category"
            value={eventData.category}
            onChange={(e) =>
              setEventData({
                ...eventData,
                category: e.target.value,
                subcategory: "", // reset subcategory when category changes
              })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </FormInput>

        <FormInput label="Event Subcategory" required>
          <>
            <select
              name="subcategory"
              value={eventData.subcategory}
              onChange={(e) =>
                setEventData({ ...eventData, subcategory: e.target.value })
              }
              disabled={!eventData.category}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                Select a subcategory
              </option>
              {(SUBCATEGORIES[eventData.category] ?? []).map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Used by our team to review and approve your event. Not shown
              publicly.
            </p>
          </>
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

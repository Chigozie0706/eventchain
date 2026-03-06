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
      <style>{`
        /* ── Drop zone ── */
        .ec-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px 20px;
          border: 2px dashed rgba(53, 208, 127, 0.25);
          border-radius: 14px;
          background: rgba(53, 208, 127, 0.03);
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
          text-align: center;
        }
        .ec-dropzone:hover {
          border-color: rgba(53, 208, 127, 0.50);
          background: rgba(53, 208, 127, 0.06);
        }
        .ec-dropzone-icon {
          width: 40px; height: 40px;
          stroke: rgba(53, 208, 127, 0.5);
          fill: none;
        }
        .ec-dropzone-title {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 14px; font-weight: 500;
          color: rgba(248, 250, 252, 0.60);
        }
        .ec-dropzone-title span {
          color: #35D07F;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .ec-dropzone-sub {
          font-size: 11px;
          color: rgba(248, 250, 252, 0.28);
        }
        .ec-dropzone-error {
          font-size: 11px;
          color: #F87171;
          margin-top: 4px;
        }

        /* ── Preview ── */
        .ec-preview-wrap {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(53, 208, 127, 0.18);
        }
        .ec-preview-wrap img {
          width: 100%;
          max-height: 220px;
          object-fit: cover;
          display: block;
        }
        .ec-preview-remove {
          position: absolute;
          top: 10px; right: 10px;
          display: flex; align-items: center; gap: 5px;
          padding: 5px 12px;
          background: rgba(248, 113, 113, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 100px;
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 11px; font-weight: 600;
          color: #F87171;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ec-preview-remove:hover {
          background: rgba(248, 113, 113, 0.22);
          border-color: rgba(248, 113, 113, 0.55);
        }
        .ec-preview-remove svg { width: 12px; height: 12px; stroke: currentColor; fill: none; }

        /* ── Subcategory hint ── */
        .ec-sub-hint {
          font-size: 11px;
          color: rgba(248, 250, 252, 0.28);
          margin-top: 4px;
          display: flex; align-items: center; gap: 5px;
        }
        .ec-sub-hint svg { width: 11px; height: 11px; stroke: rgba(34,211,238,0.5); fill: none; flex-shrink: 0; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <FormInput label="Event Name" required>
          <input
            type="text"
            name="eventName"
            value={eventData.eventName}
            onChange={(e) =>
              setEventData({ ...eventData, eventName: e.target.value })
            }
            placeholder="e.g., Tech Conference 2026"
          />
        </FormInput>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <FormInput label="Category" required>
            <select
              name="category"
              value={eventData.category}
              onChange={(e) =>
                setEventData({
                  ...eventData,
                  category: e.target.value,
                  subcategory: "",
                })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </FormInput>

          <FormInput label="Subcategory" required>
            <>
              <select
                name="subcategory"
                value={eventData.subcategory}
                onChange={(e) =>
                  setEventData({ ...eventData, subcategory: e.target.value })
                }
                disabled={!eventData.category}
                style={{ opacity: !eventData.category ? 0.45 : 1 }}
              >
                <option value="" disabled>
                  Select subcategory
                </option>
                {(SUBCATEGORIES[eventData.category] ?? []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <p className="ec-sub-hint">
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
                </svg>
                Used for admin review only — not shown publicly
              </p>
            </>
          </FormInput>
        </div>

        {/* Upload */}
        <FormInput label="Event Image" required>
          {preview ? (
            <div className="ec-preview-wrap">
              <img src={preview} alt="Preview" />
              <button
                className="ec-preview-remove"
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              >
                <svg viewBox="0 0 24 24" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Remove
              </button>
            </div>
          ) : (
            <div
              className="ec-dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <svg
                className="ec-dropzone-icon"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M12 3v9m0 0l-3-3m3 3l3-3"
                />
              </svg>
              <p className="ec-dropzone-title">
                Drop your image here or{" "}
                <label htmlFor="ec-file-upload">
                  <span>browse</span>
                  <input
                    id="ec-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              </p>
              <p className="ec-dropzone-sub">PNG, JPG, GIF — max 10 MB</p>
              {error && <p className="ec-dropzone-error">{error}</p>}
            </div>
          )}
        </FormInput>

        <FormInput label="Event Details" required>
          <textarea
            name="eventDetails"
            value={eventData.eventDetails}
            onChange={(e) =>
              setEventData({ ...eventData, eventDetails: e.target.value })
            }
            placeholder="Describe your event — agenda, speakers, what to expect…"
            rows={4}
          />
        </FormInput>

        <FormInput
          label="Minimum Age"
          required
          hint="Enter 0 for no age restriction"
        >
          <input
            type="number"
            name="minimumAge"
            value={eventData.minimumAge}
            onChange={(e) =>
              setEventData({ ...eventData, minimumAge: e.target.value })
            }
            placeholder="0"
            min="0"
            max="120"
          />
        </FormInput>
      </div>
    </>
  );
}

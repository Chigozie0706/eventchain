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

  // Validate dates and times whenever they change
  useEffect(() => {
    const newErrors = {
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    };

    if (
      eventData.startDate &&
      eventData.startTime &&
      eventData.endDate &&
      eventData.endTime
    ) {
      const startDateTime = new Date(
        `${eventData.startDate}T${eventData.startTime}`,
      );
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);
      const now = new Date();

      // Check if start date is in the past
      if (startDateTime.getTime() < now.getTime()) {
        newErrors.startDate = "Start date must be in the future";
      }

      // Check if end date is before start date
      if (endDateTime.getTime() <= startDateTime.getTime()) {
        newErrors.endDate = "End date must be after start date";
      }

      // Check minimum duration (1 hour)
      const durationHours =
        (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      if (durationHours < 1) {
        newErrors.endTime = "Event must be at least 1 hour long";
      }

      // Check maximum duration (365 days)
      const durationDays = durationHours / 24;
      if (durationDays > 365) {
        newErrors.endDate = "Event duration cannot exceed 365 days";
      }
    }

    setErrors(newErrors);
  }, [
    eventData.startDate,
    eventData.startTime,
    eventData.endDate,
    eventData.endTime,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Start Date" required>
          <input
            type="date"
            name="startDate"
            value={eventData.startDate}
            onChange={(e) =>
              setEventData({ ...eventData, startDate: e.target.value })
            }
            min={new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
              errors.startDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.startDate && (
            <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
          )}
        </FormInput>

        <FormInput label="Start Time" required>
          <input
            type="time"
            name="startTime"
            value={eventData.startTime}
            onChange={(e) =>
              setEventData({ ...eventData, startTime: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
              errors.startTime ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.startTime && (
            <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
          )}
        </FormInput>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="End Date" required>
          <input
            type="date"
            name="endDate"
            value={eventData.endDate}
            onChange={(e) =>
              setEventData({ ...eventData, endDate: e.target.value })
            }
            min={eventData.startDate || new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
              errors.endDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.endDate && (
            <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
          )}
        </FormInput>

        <FormInput label="End Time" required>
          <input
            type="time"
            name="endTime"
            value={eventData.endTime}
            onChange={(e) =>
              setEventData({ ...eventData, endTime: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
              errors.endTime ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.endTime && (
            <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
          )}
        </FormInput>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">
          ⚠️ Event Duration Requirements
        </h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Minimum duration: 1 hour</li>
          <li>• Maximum duration: 365 days</li>
          <li>• Start date must be in the future</li>
          <li>• End date/time must be after start date/time</li>
        </ul>
      </div>
    </div>
  );
}

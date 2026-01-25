"use client";
import React from "react";
import blockies from "ethereum-blockies";
import { Star } from "lucide-react";

interface AttendeeListProps {
  attendees: string[];
  maxCapacity: number;
}

const AttendeeList: React.FC<AttendeeListProps> = ({
  attendees,
  maxCapacity,
}) => {
  const displayCount = 8;
  const hasMore = attendees.length > displayCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {attendees.length} / {maxCapacity} spots filled
        </span>
        <span className="text-emerald-600 font-semibold">
          {Math.round((Number(attendees.length) / maxCapacity) * 100)}% capacity
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
          style={{
            width: `${(attendees.length / maxCapacity) * 100}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 mt-4">
        {attendees.slice(0, displayCount).map((addr, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
              {addr.slice(2, 4).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-mono text-gray-800">
                {addr.slice(0, 6)}...{addr.slice(-4)}
              </p>
            </div>
            <Star className="w-4 h-4 text-yellow-500" />
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="w-full py-2 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
          View all {attendees.length} attendees
        </button>
      )}
    </div>
  );
};

export default AttendeeList;

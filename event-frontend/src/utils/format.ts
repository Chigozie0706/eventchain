// utils/format.ts
import { formatUnits } from "viem";
import { getTokenByAddress, getTokenDecimals } from "./tokens";

/**
 * Format a date timestamp to a readable string
 */
export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString();
}

/**
 * Format a date timestamp with more detail
 */
export function formatEventDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format time in seconds since midnight to HH:MM AM/PM
 */
export function formatTime(seconds: bigint | number): string {
  const hours = Math.floor(Number(seconds) / 3600);
  const minutes = Math.floor((Number(seconds) % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Format time in seconds since midnight to 12-hour format
 */
export function formatEventTime(secondsSinceMidnight: number): string {
  const hours = Math.floor(secondsSinceMidnight / 3600);
  const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Format price with proper token decimals
 * @param price - The price in smallest unit (wei for 18 decimals, smallest for others)
 * @param tokenAddress - The token contract address
 * @returns Formatted price string
 */
export function formatPrice(price: bigint, tokenAddress: string = ""): string {
  const decimals = getTokenDecimals(tokenAddress);
  const formatted = formatUnits(price, decimals);

  // Parse to number and format based on token
  const num = parseFloat(formatted);

  // For USDT (6 decimals), show up to 6 decimal places
  if (decimals === 6) {
    return num.toFixed(6);
  }

  // For 18 decimal tokens, show reasonable precision
  if (num === 0) return "0";
  if (num < 0.0001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);
  return num.toFixed(2);
}

/**
 * Format price with token symbol
 */
export function formatPriceWithSymbol(
  price: bigint,
  tokenAddress: string
): string {
  const token = getTokenByAddress(tokenAddress);
  const formattedPrice = formatPrice(price, tokenAddress);
  const symbol = token?.symbol || "Unknown";

  return `${formattedPrice} ${symbol}`;
}

/**
 * Format a large number with commas
 */
export function formatNumber(num: number | bigint): string {
  return Number(num).toLocaleString();
}

/**
 * Format wallet address to shortened version (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  let value: number;
  let unit: string;

  if (absDiff < minute) {
    return "just now";
  } else if (absDiff < hour) {
    value = Math.floor(absDiff / minute);
    unit = value === 1 ? "minute" : "minutes";
  } else if (absDiff < day) {
    value = Math.floor(absDiff / hour);
    unit = value === 1 ? "hour" : "hours";
  } else if (absDiff < week) {
    value = Math.floor(absDiff / day);
    unit = value === 1 ? "day" : "days";
  } else if (absDiff < month) {
    value = Math.floor(absDiff / week);
    unit = value === 1 ? "week" : "weeks";
  } else if (absDiff < year) {
    value = Math.floor(absDiff / month);
    unit = value === 1 ? "month" : "months";
  } else {
    value = Math.floor(absDiff / year);
    unit = value === 1 ? "year" : "years";
  }

  return diff < 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
}

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Format refund policy enum to readable text
 */
export function formatRefundPolicy(policy: number): string {
  switch (policy) {
    case 0:
      return "No Refunds";
    case 1:
      return "Refund Before Start";
    case 2:
      return "Custom Buffer";
    default:
      return "Unknown";
  }
}
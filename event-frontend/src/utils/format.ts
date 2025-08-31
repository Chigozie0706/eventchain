// utils/format.ts
import { formatEther } from "viem";

// Token information - should match your tokens.ts
const tokenDecimals: Record<string, number> = {
  "0x0000000000000000000000000000000000000000": 18, // CELO
  "0x765de816845861e75a25fca122bb6898b8b1282a": 18, // cUSD
  "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73": 18, // cEUR
  "0xe8537a3d056da446677b9e9d6c5db704eaab4787": 18, // cREAL
  "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a": 18, // G$
  "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e": 6,  // USDT (6 decimals!)
};

export function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString();
}

export function formatTime(seconds: bigint): string {
  const hours = Math.floor(Number(seconds) / 3600);
  const minutes = Math.floor((Number(seconds) % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}


export function formatPrice(price: bigint, tokenAddress: string = ""): string {
  const normalizedAddress = tokenAddress.toLowerCase();
  const decimals = tokenDecimals[normalizedAddress] || 18;
  
  // Convert from contract's 18 decimal storage to token's actual decimals
  if (decimals !== 18) {
    const conversionFactor = BigInt(10 ** (18 - decimals));
    const adjustedPrice = price / conversionFactor;
    return (Number(adjustedPrice) / (10 ** decimals)).toFixed(decimals);
  }
  
  // For 18 decimal tokens, use standard ether formatting
  return formatEther(price);
}

export function formatEventDate(timestamp: number | bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  export function formatEventTime(secondsSinceMidnight: number): string {
    const hours = Math.floor(secondsSinceMidnight / 3600);
    const minutes = Math.floor((secondsSinceMidnight % 3600) / 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
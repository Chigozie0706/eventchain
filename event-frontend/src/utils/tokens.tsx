// utils/tokens.ts

export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  name: string;
}

// Normalize all addresses to lowercase for consistent comparison
export const tokenOptions: Token[] = [
  {
    symbol: "CELO",
    name: "Celo Native Asset",
    address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cUSD",
    name: "Celo Dollar",
    address:
      "0x765de816845861e75a25fca122bb6898b8b1282a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cEUR",
    name: "Celo Euro",
    address:
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cREAL",
    name: "Celo Real",
    address:
      "0xe8537a3d056da446677b9e9d6c5db704eaab4787".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "G$",
    name: "GoodDollar",
    address:
      "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address:
      "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e".toLowerCase() as `0x${string}`,
    decimals: 6, // USDT has 6 decimals!
  },
];

/**
 * Normalize address to lowercase for consistent comparison
 */
export const normalizeAddress = (address: string): `0x${string}` => {
  const lowercased = address.toLowerCase();

  // Ensure zero address is always properly formatted
  if (
    lowercased === "0x0000000000000000000000000000000000000000" ||
    lowercased === "0x0"
  ) {
    return "0x0000000000000000000000000000000000000000" as `0x${string}`;
  }

  return lowercased as `0x${string}`;
};

/**
 * Get token information by address (case-insensitive)
 */
export const getTokenByAddress = (address: string): Token | undefined => {
  const normalizedAddr = normalizeAddress(address);
  return tokenOptions.find((token) => token.address === normalizedAddr);
};

/**
 * Get token information by symbol (case-insensitive)
 */
export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return tokenOptions.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase(),
  );
};

/**
 * Check if an address is a valid token
 */
export const isValidToken = (address: string): boolean => {
  return !!getTokenByAddress(address);
};

/**
 * Get all supported token addresses
 */
export const getSupportedTokenAddresses = (): `0x${string}`[] => {
  return tokenOptions.map((token) => token.address);
};

/**
 * Get token decimals by address
 */
export const getTokenDecimals = (address: string): number => {
  const token = getTokenByAddress(address);
  return token?.decimals || 18; // Default to 18 if not found
};

/**
 * Check if token is native CELO
 */
export const isNativeCelo = (address: string): boolean => {
  const normalized = normalizeAddress(address);
  return normalized === "0x0000000000000000000000000000000000000000";
};

/**
 * Check if token is G$ (GoodDollar)
 */
export const isGDollar = (address: string): boolean => {
  const normalized = normalizeAddress(address);
  return normalized === "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a";
};

/**
 * Check if token is USDT
 */
export const isUSDT = (address: string): boolean => {
  const normalized = normalizeAddress(address);
  return normalized === "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e";
};

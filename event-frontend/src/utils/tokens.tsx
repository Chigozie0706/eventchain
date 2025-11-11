// utils/tokens.ts

export interface Token {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
}

// Normalize all addresses to lowercase
export const tokenOptions: Token[] = [
  {
    symbol: "CELO",
    address:
      "0x0000000000000000000000000000000000000000".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cUSD",
    address:
      "0x765de816845861e75a25fca122bb6898b8b1282a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cEUR",
    address:
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "cREAL",
    address:
      "0xe8537a3d056da446677b9e9d6c5db704eaab4787".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "G$",
    address:
      "0x62b8b11039fcfe5ab0c56e502b1c372a3d2a9c7a".toLowerCase() as `0x${string}`,
    decimals: 18,
  },
  {
    symbol: "USDT",
    address:
      "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e".toLowerCase() as `0x${string}`,
    decimals: 6,
  },
];

// Helper function to normalize any address to lowercase
export const normalizeAddress = (address: string): `0x${string}` => {
  return address.toLowerCase() as `0x${string}`;
};

// Get token by address (case-insensitive)
export const getTokenByAddress = (address: string): Token | undefined => {
  const normalizedAddr = normalizeAddress(address);
  return tokenOptions.find((token) => token.address === normalizedAddr);
};

// Get token by symbol
export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return tokenOptions.find(
    (token) => token.symbol.toUpperCase() === symbol.toUpperCase()
  );
};

"use client";

import {
  ConnectButton,
  useActiveAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { createThirdwebClient, getContract } from "thirdweb";
import { getBalance, transfer } from "thirdweb/extensions/erc20";
import { createContext, useContext, useEffect, useState } from "react";
import { celoAlfajoresTestnet } from "thirdweb/chains";
import toast from "react-hot-toast";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const contractAddress = "0xA108d65A028039a96d5Cda9f6663EFC5c601e911";
const mentoTokens = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD",
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR",
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL",
};

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const account = useActiveAccount();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const [balances, setBalances] = useState({});
  const [mentoTokenContracts, setMentoTokenContracts] = useState({});

  const { contract: readOnlyContract } = useThirdwebContract({
    client,
    address: contractAddress,
    chain: celoAlfajoresTestnet,
  });

  useEffect(() => {
    const setupTokens = async () => {
      if (!account) return;

      const contracts = {};
      const balancesMap = {};

      for (const [address, symbol] of Object.entries(mentoTokens)) {
        const tokenContract = getContract({
          client,
          address,
          chain: celoAlfajores,
        });
        contracts[address] = tokenContract;

        try {
          const balance = await getBalance({
            contract: tokenContract,
            address: account.address,
          });
          balancesMap[symbol] = balance.displayValue;
        } catch (err) {
          console.error(`Failed to fetch balance for ${symbol}`, err);
        }
      }

      setMentoTokenContracts(contracts);
      setBalances(balancesMap);
    };

    setupTokens();
  }, [account]);

  const connectWallet = async () => {
    try {
      await connect();
      toast.success("Wallet connected");
    } catch (err) {
      console.error("Connect failed", err);
      toast.error("Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setBalances({});
    setMentoTokenContracts({});
    toast.success("Wallet disconnected");
  };

  return (
    <ContractContext.Provider
      value={{
        account,
        client,
        contract: readOnlyContract,
        connectWallet,
        disconnectWallet,
        mentoTokens,
        mentoTokenContracts,
        balances,
        setBalances,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};

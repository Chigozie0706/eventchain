# **EventChain - Decentralized Event Ticketing Platform**

EventChain is a **decentralized event ticketing system** that allows users to create, manage, and participate in events using blockchain technology. It supports **multiple payment tokens** (cUSD, cEUR, cREAL on Celo) and ensures **secure, transparent, and verifiable** ticket purchases.

---

## **Features**

- **Create Events** – Event organizers can create events with details like name, date, location, and ticket price.
- **Multi-Token Payments** – Supports Mento stable assets (cUSD, cEUR, cREAL) for ticket purchases.
- **Secure Ticket Purchases** – Users can buy tickets with ERC-20 tokens, ensuring trustless transactions.
- **Refund Mechanism** – Users can request refunds if an event is canceled or within a specific refund window.
- **Event Cancellation** – Organizers can cancel events, triggering automated refund processing.
- **Event Discovery** – Users can browse and find active events, including those they have attended.
- **Funds Release** – Organizers receive ticket sale revenue after the event ends.

---

## **Smart Contract Details**

### **Contract: `EventChain.sol`**

#### **Supported Payment Tokens**

The contract allows ticket purchases using the following Mento stablecoins on the **Celo blockchain**:

- **cUSD (Celo Dollar)** – `0x874069fa1eb16d44d622f2e0ca25eea172369bc1`
- **cEUR (Celo Euro)** – `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F`
- **cREAL (Celo Real)** – `0xE4D517785D091D3c54818832dB6094bcc2744545`

#### **Events and Functions**

| Function                 | Description                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `createEvent(...)`       | Allows users to create an event with details like name, date, location, and ticket price.  |
| `buyTicket(eventId)`     | Enables users to purchase event tickets using supported tokens.                            |
| `cancelEvent(eventId)`   | Allows the event organizer to cancel an event.                                             |
| `requestRefund(eventId)` | Users can request a refund if the event is canceled or if the refund window is still open. |
| `releaseFunds(eventId)`  | Transfers collected ticket funds to the event organizer after the event ends.              |
| `getAllEvents()`         | Retrieves all active events.                                                               |
| `getUserEvents()`        | Fetches events that the caller has purchased tickets for.                                  |

---

## **Deployment**

The smart contract is deployed using **Hardhat Ignition**.

### **Deployment Script: `EventChainModule.js`**

```javascript
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

const _supportedTokens = [
  ethers.getAddress("0x874069fa1eb16d44d622f2e0ca25eea172369bc1"), // cUSD
  ethers.getAddress("0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F"), // cEUR
  ethers.getAddress("0xE4D517785D091D3c54818832dB6094bcc2744545"), // cREAL
];

module.exports = buildModule("EventChainModule", (m) => {
  const eventChain = m.contract("EventChain", [_supportedTokens]);
  return { eventChain };
});
```

### **Steps to Deploy**

1. **Install dependencies**

   ```sh
   npm install
   ```

2. **Compile the contract**

   ```sh
   yarn hardhat compile
   ```

3. **Deploy to Celo Testnet/Mainnet**
   ```sh
   npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_alfajores
   ```

---

## **How It Works**

1. **Organizer creates an event** specifying event details and a payment token.
2. **Users buy tickets** using supported ERC-20 tokens.
3. **Organizer cancels the event** (if necessary), and refunds are issued automatically.
4. **Event ends**, and funds are released to the organizer.

---

## **Future Enhancements**

🔹 Dynamic token support (allow new tokens to be added).  
🔹 NFT-based ticketing for verifiable ownership.  
🔹 Integration with a frontend for a seamless user experience.

---

## **License**

This project is licensed under the **MIT License**.

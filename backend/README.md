# **EventChain - Decentralized Event Ticketing Platform**

[![Celo Blockchain](https://img.shields.io/badge/Celo-Blockchain-yellow)](https://celo.org/)  
[![Solidity](https://img.shields.io/badge/Solidity-✔️-blue)](https://soliditylang.org/)  
[![Hardhat Ignition](https://img.shields.io/badge/Hardhat-Ignition-orange)](https://hardhat.org/)

**EventChain** is a **decentralized event ticketing system** that allows users to create, manage, and participate in events using **blockchain technology**. It supports **multiple payment tokens** (cUSD, cEUR, cREAL on Celo) and ensures **secure, transparent, and verifiable** ticket purchases.

**Frontend Repo:** [eventchain-frontend](https://github.com/Chigozie0706/eventchain/tree/main/event-frontend)  
**Live Demo:** [EventChain on Alfajores](https://eventchain.vercel.app)

---

## **Features**

**Create Events** – Organizers set event details, ticket prices, and supply.  
**Multi-Token Payments** – Users pay with Mento stable assets (cUSD, cEUR, cREAL).  
**Secure Ticket Purchases** – ERC-20 based transactions with smart contract validation.  
**Refund Mechanism** – Automated refunds for canceled events.  
**Event Cancellation** – Organizers can cancel events and trigger refunds.  
**Event Discovery** – Users can browse and track their attended events.  
**Funds Release** – Ticket revenue is released to organizers after event completion.

---

## **Smart Contract Overview**

### **Contract: `EventChain.sol`**

This Solidity smart contract is deployed on the **Celo blockchain** and manages event creation, ticket sales, refunds, and fund distribution.

### **Supported Payment Tokens**

EventChain accepts the following **Mento stablecoins** for ticket purchases:

| Token       | Symbol | Contract Address                             |
| ----------- | ------ | -------------------------------------------- |
| Celo Dollar | cUSD   | `0x874069fa1eb16d44d622f2e0ca25eea172369bc1` |
| Celo Euro   | cEUR   | `0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F` |
| Celo Real   | cREAL  | `0xE4D517785D091D3c54818832dB6094bcc2744545` |

---

## **Smart Contract Functions**

| Function                                                      | Description                                         |
| ------------------------------------------------------------- | --------------------------------------------------- |
| `createEvent(name, date, location, price, token, maxTickets)` | Creates a new event with ticket details.            |
| `buyTicket(eventId, amount)`                                  | Allows users to buy tickets using supported tokens. |
| `cancelEvent(eventId)`                                        | Enables event organizers to cancel events.          |
| `requestRefund(eventId)`                                      | Users can request a refund for canceled events.     |
| `releaseFunds(eventId)`                                       | Transfers ticket sales revenue to the organizer.    |
| `getAllEvents()`                                              | Fetches all active events.                          |
| `getUserEvents(address)`                                      | Retrieves events where the user holds tickets.      |

---

## **Deployment**

The smart contract is deployed using **Hardhat Ignition**, which simplifies contract deployment and management.

### **Deployment Script: `EventChain.js`**

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

---

## **Installation & Setup**

### **1 Prerequisites**

- **[Node.js](https://nodejs.org/)** (v16+ recommended)
- **[Hardhat](https://hardhat.org/)**
- **[pnpm](https://pnpm.io/)** (or npm/yarn)
- **Celo Wallet** (e.g., MetaMask, Valora)

### **2 Clone the Repository**

```sh
git clone https://github.com/Chigozie0706/eventchain.git
cd backend
```

### **3 Install Dependencies**

```sh
npm install  # Or use pnpm install / yarn install
```

### **4 Compile the Smart Contract**

```sh
yarn hardhat compile
```

### **5 Deploy to Celo Testnet/Mainnet**

```sh
npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_alfajores
```

Once deployed, note the **contract address, abi** and update the frontend file accordingly.

---

## **How It Works**

1 **Organizer creates an event** specifying event details and a payment token.  
2 **Users buy tickets** using supported `IERC20` - `ERC-20` tokens.  
3 **Organizer cancels the event** (if necessary), and refunds are issued automatically.  
4 **Event ends**, and funds are released to the organizer.

---

## **Future Enhancements**

**Dynamic token support** – Allow new tokens to be added dynamically.  
**NFT-based ticketing** – Convert tickets into **NFTs** for verifiable ownership.  
**Integration with a frontend** – UI for a seamless user experience.

---

## **License**

This project is open-source and licensed under the **MIT License**.

---

## **Contributing**

We welcome contributions!

1. **Fork** the repository.
2. **Create a new branch** (`feature/new-feature`).
3. **Commit your changes**.
4. **Push** and open a **Pull Request**.

For major changes, open an issue first to discuss them.

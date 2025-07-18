# EventChain

EventChain is a decentralized ticketing platform built on the Celo blockchain. Users can create events, buy tickets, claim refunds, and now support on-chain causes like **Universal Basic Income** and **referral incentives** using **G$** and **Divvi**.

**[Live Demo](https://eventchain-git-main-chigozie0706s-projects.vercel.app/)**

**[GitHub Repository](https://github.com/Chigozie0706/eventchain)**

**[Link to presentattion](https://www.canva.com/design/DAGf-vn5bL4/GpTakYkJ6L9RTarjzrD4vg/view?utm_content=DAGf-vn5bL4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h596c558439)**

## ✨ Features

### ✅ Event Hosting & Ticketing

- Create events with name, location, image, price, and refund policy
- Set ticket count, purchase limits, and age restrictions
- Buy tickets using multiple Celo tokens: cUSD, cEUR, cREAL, and **G$**

### ✅ Refund Support

- Refunds allowed before a specified deadline
- Refunds are issued in the **same token** used for purchase

### ✅ Referral Attribution via Divvi

- **Divvi SDK** integrated for tracking referrals:
  - Users who share events earn attribution when friends buy
  - Actions like event creation, purchase, and refunds are tagged and reported
- Simple setup for dApp builders using `@divvi/sdk`

### ✅ GoodDollar UBI Pool Integration

- A portion of each ticket purchase (e.g. **1%**) is automatically donated to:

```sh
GoodDollar UBI Pool Address: 0x05Fc2cAe50EfF8f8f9580600A6fD708cDeA2Dfa2
```

- Promotes **on-chain universal basic income**
- Supports **G$** directly and encourages social good with every transaction

### ✅ Self Protocol Integration

- Enables identity and age verification using **Self.ID**
- Supports:
- Age-based ticket filtering
- Country restriction compliance
- OFAC blacklist screening
- Optional identity QR verification

### ✅ IPFS Image Uploads

- Upload event banners via IPFS
- Supports IPFS hashes and web URLs
- Graceful fallback to default image if upload fails

---

## 🔁 User Flow

1. **Connect wallet** (via RainbowKit)
2. **Create event** – name, location, date, price, etc.
3. **Buy tickets** – token selection, referral support, UBI pool donation
4. **Claim refund** – if eligible before the deadline
5. **Refer friends** – share event links to earn visibility (via Divvi)
6. **Organizers manage events** – update or cancel as needed

---

## 📦 Smart Contracts

Built with **Hardhat + Ignition** and deployed on Celo.

Key contracts:

- `EventChain.sol` — core event logic
- `TicketNFT.sol` — ERC721 tickets
- Uses `IERC20` for token payments and supports multiple currencies

---

## 📊 Referral Tracking (via Divvi)

We use:

```ts
import { tagTransaction, reportTransaction } from "@divvi/sdk";
```

All major interactions include:

- `eventId`
- `referrer`
- `timestamp`
- `transactionHash`

Divvi automatically attributes conversions and helps optimize distribution.

---

## 📤 GoodDollar Donation Logic

When a user purchases a ticket, 99% goes to the event organizer, and 1% goes to:

```solidity
address constant UBI_POOL_ADDRESS = 0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1;
```

This supports GoodDollar's **universal basic income** pool and helps fund verified UBI recipients.

---

## **Smart Contract Deployment**

Your **EventChain** smart contract is deployed on the **Celo Mainnet**.

| Contract   | Address                                    |
| ---------- | ------------------------------------------ |
| EventChain | 0x389be1692b18b14427E236F517Db769b3a27F075 |

<!-- **[View on Celo Explorer](https://alfajores.celoscan.io/address/0xBa26366767eA843A656853d348c763c41f9D67Ca)** -->

---

## **Screenshots**

[Screenshots](https://drive.google.com/drive/folders/13iZviAZX3R69zmZKudesQTtxaT5Hdkvy?usp=sharing)

---

## **Project Structure**

EventChain/
│── backend/ # Smart contracts (Hardhat + Solidity)
│── event-frontend/ # Next.js frontend for interacting with the contract
│── README.md # Project documentation

---

## **Running the Project**

### **1 compile the Smart Contract (Backend)**

```sh
cd backend
yarn hardhat compile
```

### **2 Deploy the Smart Contract**

```sh
npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_mainnet
```

### **3 Start the Frontend**

```sh
cd event-frontend
pnpm run dev   # Runs the Next.js app on http://localhost:3000
```

## ** Environment Variables**

Create a **.env** file in both the **backend** and **event-frontend** directories.

### **Backend (backend/.env)**

PRIVATE_KEY=your_metamask_wallet_private_key

### **Frontend (event-frontend/.env.local)**

```sh
NEXT_PUBLIC_SELF_APP_NAME="EventChain"
NEXT_PUBLIC_SELF_SCOPE="event-chain"
NEXT_PUBLIC_SELF_ENDPOINT="your-ngrok-or-server-url"
NEXT_PUBLIC_SELF_ENABLE_MOCK_PASSPORT="false" # true for development
```

Frontend is built with **Next.js** using **WAGMI**, **RainbowKit**, **viem**, and **Tailwind CSS**.

---

## 💬 Feedback or Suggestions?

Open an issue or connect with the creator [@chigoziejacob1](https://twitter.com/chigoziejacob1)

---

## **Contributing**

Pull requests are welcome! Follow these steps:

1. **Fork** the repository.
2. **Create a new branch** (feature/new-feature).
3. **Commit** your changes.
4. **Push** and open a **Pull Request**.

---

## **License**

This project is **open-source** under the **MIT License**.

```

```

# **EventChain**

A **decentralized event ticketing platform** built on the **Celo blockchain**, allowing users to create events, buy tickets, and request refunds in multiple tokens.

**[Live Demo](https://eventchain-git-main-chigozie0706s-projects.vercel.app/)**  
**[GitHub Repository](https://github.com/Chigozie0706/eventchain)**

---

## **Features**

**Decentralized Ticketing** – Secure and transparent event ticketing powered by **smart contracts**.  
**Multi-Token Payments** – Buy tickets using **cUSD, cEUR, cREAL**, and more.  
**Refund System** – Request refunds in the same token used for payment if an event is canceled.  
**Event Management** – Organizers can create, update, and deactivate events.  
**Celo Integration** – Uses Celo blockchain for payments and event validation.

---

## **Project Structure**

```
EventChain/
│── backend/          # Smart contracts (Hardhat + Solidity)
│── event-frontend/   # Next.js frontend for interacting with the contract
│── README.md         # Project documentation
```

---

## **Installation & Setup**

### **1 Clone the Repository**

```sh
git clone https://github.com/Chigozie0706/eventchain.git
cd eventchain
```

### **2 Install Dependencies**

#### **Backend**

```sh
cd backend
pnpm install  # Or use npm install / yarn install
```

#### **Frontend**

```sh
cd event-frontend
pnpm install
```

---

## ** Environment Variables**

Create a **`.env`** file in both the **backend** and **event-frontend** directories.

### **Backend (`backend/.env`)**

```sh
PRIVATE_KEY=your_metamask_wallet_private_key
```

## **Running the Project**

### **1 compile the Smart Contract (Backend)**

```sh
cd backend
yarn hardhat compile
```

### **2 Deploy the Smart Contract**

```sh
npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_alfajores
```

### **3 Start the Frontend**

```sh
cd event-frontend
pnpm run dev   # Runs the Next.js app on http://localhost:3000
```

---

## **Smart Contract Deployment**

Your **EventChain** smart contract is deployed on the **Celo Alfajores** testnet.

| Contract   | Address                                      |
| ---------- | -------------------------------------------- |
| EventChain | `0x556875cd1681947F2dd71f6BAC20b09c0deD5186` |

<!-- **[View on Celo Explorer](https://alfajores.celoscan.io/address/0xBa26366767eA843A656853d348c763c41f9D67Ca)** -->

---

## **Screenshots**

[Screenshots](https://drive.google.com/drive/folders/13iZviAZX3R69zmZKudesQTtxaT5Hdkvy?usp=sharing)

---

## **How It Works**

1 **Connect your wallet** (MetaMask / Celo Extension Wallet).  
2 **Create an event** with event name, date, location, and ticket price.  
3 **Buy tickets** using **cUSD, cEUR, cREAL**, or other supported tokens.  
4 **Request refunds** if the event is canceled.  
5 **Manage events** – Event creators can **deactivate** events anytime.

---

### **Architecture**

#### **Tech Stack**

- **Frontend:** Next.js (React + TypeScript)
- **Backend:** Solidity smart contract (Hardhat, Hardhat Ignition)
- **Blockchain:** Celo (Alfajores Testnet)
- **Wallet Integration:** MetaMask, Celo Extension Wallet

#### **Challenges & Implementation Notes**

- **Multi-token support:** Implementing refunds in the same token used for purchases was tricky. Solved by restricting users to pay with the same token for all tickets in a single event and tracking purchase history for refunds.
- **Celo blockchain integration:** Used `IERC20` for interacting with Celo stablecoins (cUSD, cEUR, cREAL).
- **Deployment automation:** Hardhat Ignition simplified contract deployment but required additional debugging for module dependencies.

#### **Future Enhancements**

- Support for **new ERC-20 tokens** beyond Mento stable assets.
- **NFT-based ticketing** for secure, transferable event tickets.
- **Gas fee optimizations** for cost-efficient transactions.
- **Frontend dashboard** for event organizers to track sales & refunds.

---

## **Contributing**

Pull requests are welcome! Follow these steps:

1. **Fork** the repository.
2. **Create a new branch** (`feature/new-feature`).
3. **Commit** your changes.
4. **Push** and open a **Pull Request**.

---

## **License**

This project is **open-source** under the **MIT License**.

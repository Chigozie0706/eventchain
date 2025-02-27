# EventChain

## Overview

[Demo](https://eventchain-git-main-chigozie0706s-projects.vercel.app/)

[Repository](https://github.com/Chigozie0706/eventchain)

EventChain is a decentralized event management smart contract deployed on the Celo blockchain. It allows users to create events, buy tickets using cUSD, and manage event participation in a transparent and immutable manner.

## Features

- **Event Creation**: Organizers can create events with details such as name, date, location, ticket price, and an image.
- **Event Listing**: Users can view all active events and details about specific events.
- **Ticket Purchase**: Users can buy tickets for events using cUSD, ensuring secure and traceable transactions.
- **Event Attendance**: Users can register as attendees for events they have purchased tickets for.
- **Event Management**: Event creators can deactivate their events.

## Contract Details

- **Frontend Framework**: Next.js
- **Network**: Celo
- **Token Used**: cUSD (Celo Dollar)
- **License**: MIT
- **Solidity Version**: ^0.8.3

## Deployed Contract Addresses on Celo

- **contract address**: 0xBa26366767eA843A656853d348c763c41f9D67Ca

- [Celo explorer](https://alfajores.celoscan.io/address/0xBa26366767eA843A656853d348c763c41f9D67Ca)

## Contracts Should Be Verified

[Celo explorer](https://alfajores.celoscan.io/address/0xBa26366767eA843A656853d348c763c41f9D67Ca)

## Screenshots

![Image](https://github.com/user-attachments/assets/b796ae16-92c8-4592-a55f-25cc575a3c10)
![Image](https://github.com/user-attachments/assets/c37491ec-c0d8-43cd-980e-8086c04e5994)
![Image](https://github.com/user-attachments/assets/1317079a-d067-4d99-ae08-0ca5c731e4e0)
![Image](https://github.com/user-attachments/assets/c89c9386-51ea-4116-b3d2-6acd2c463626)
![Image](https://github.com/user-attachments/assets/33a042eb-2f1e-4cfd-b3ed-00e90c318ae8)
![Image](https://github.com/user-attachments/assets/c784d079-1c17-4b95-a32d-6b396e21e19e)

## Functions

### 1. `createEvent`

```solidity
function createEvent(
    string memory _eventName,
    string memory _eventCardImgUrl,
    string memory _eventDetails,
    uint64 _eventDate,
    uint64 _startTime,
    uint64 _endTime,
    string memory _eventLocation,
    uint256 _ticketPrice
) public;
```

Allows users to create an event and store event details on-chain.

### 2. `getEventById`

```solidity
function getEventById(uint256 _index) public view returns (
    Event memory eventDetails,
    address[] memory attendees,
    Event[] memory createdEvents
);
```

Retrieves details of a specific event, including attendees and other events created by the organizer.

### 3. `deleteEventById`

```solidity
function deleteEventById(uint256 _index) public;
```

Allows the event creator to deactivate an event.

### 4. `addEventAttendees`

```solidity
function addEventAttendees(uint256 _index) public;
```

Registers a user as an attendee for a free event.

### 5. `buyTicket`

```solidity
function buyTicket(uint256 _index) public;
```

Handles the purchase of an event ticket using cUSD.

### 6. `getAttendees`

```solidity
function getAttendees(uint256 _index) public view returns (address[] memory);
```

Returns the list of attendees for a given event.

### 7. `getEventLength`

```solidity
function getEventLength() public view returns (uint256);
```

Returns the total number of events created.

### 8. `getEventsByCreator`

```solidity
function getEventsByCreator(address _creator) public view returns (Event[] memory);
```

Fetches all events created by a specific address.

### 9. `getAllEvents`

```solidity
function getAllEvents() public view returns (uint256[] memory, Event[] memory);
```

Returns all active events along with their indexes.

## How It Works

1. **Deploy the Contract**: Deploy `EventChain` to the Celo blockchain with the cUSD contract address as a parameter.
2. **Create Events**: Users can create events by calling `createEvent`.
3. **View Events**: Users can fetch event details using `getEventById` or list all events using `getAllEvents`.
4. **Buy Tickets**: Users can purchase tickets using `buyTicket`, which transfers cUSD to the event creator.
5. **Manage Attendance**: Attendees are registered upon ticket purchase.
6. **Deactivate Events**: Organizers can mark an event as inactive using `deleteEventById`.

## Requirements

- A Celo-compatible wallet
- cUSD tokens for purchasing tickets
- Solidity-compatible development environment (Remix, Hardhat, or Foundry)

## Installation & Deployment

### Cloning the Repository

1. Clone the repository:
   ```sh
   git clone https://github.com/Chigozie0706/eventchain.git
   cd eventchain
   ```

### Project Structure

The project is divided into two main folders:

- **backend**: Contains the smart contract and deployment scripts.
- **event-frontend**: Contains the Next.js frontend for interacting with the contract.

### Backend Deployment

1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Compile the contract:
   ```sh
   yarn hardhat compile
   ```
4. Deploy the contract to Celo Alfajores:
   ```sh
   npx hardhat ignition deploy ./ignition/modules/EventChain.js --network celo_alfajores
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```sh
   cd ../event-frontend
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```
3. Start the development server:
   ```sh
   yarn dev
   ```

- Note: you can use pnpm also

## License

This project is licensed under the MIT License.

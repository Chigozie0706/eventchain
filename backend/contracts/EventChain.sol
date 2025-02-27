// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

/**
 * @title EventChain
 * @dev A decentralized event management contract built on the Celo blockchain.
 *      Allows users to create, join, and manage events while providing
 *      secure ticket purchases via cUSD.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
/// @dev cUSD token interface for handling ticket payments.
contract EventChain {
    IERC20 public cUSDToken;


/**
 * @dev Deploys the contract and sets the cUSD token address.
 * @param _cUSDAddress The address of the cUSD token contract on Celo.
*/
    constructor(address _cUSDAddress) {
        cUSDToken = IERC20(_cUSDAddress);
    }


/**
 * @dev Represents an Event with details such as owner, name, time, location,
 *      ticket price, and active status.
*/
    struct Event {
        address owner;
        string eventName;
        string eventCardImgUrl;
        string eventDetails;
        uint64 eventDate;
        uint64 startTime;
        uint64 endTime;
        string eventLocation;
        bool isActive;
        uint256 ticketPrice;
    }

/// @dev Stores all events created on the platform.
    Event[] public events;

    mapping(uint256 => address[]) internal eventAttendees;
    mapping(address => Event[]) internal creatorEvents;
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;

    function createEvent(
        string memory _eventName,
        string memory _eventCardImgUrl,
        string memory _eventDetails,
        uint64 _eventDate,
        uint64 _startTime,
        uint64 _endTime,
        string memory _eventLocation,
        uint256 _ticketPrice
    ) public {
        Event memory newEvent = Event({
            owner: msg.sender,
            eventName: _eventName,
            eventCardImgUrl: _eventCardImgUrl,
            eventDetails: _eventDetails,
            eventDate: _eventDate,
            startTime: _startTime,
            endTime: _endTime,
            eventLocation: _eventLocation,
            ticketPrice: _ticketPrice,
            isActive: true
        });
        events.push(newEvent);
        creatorEvents[msg.sender].push(newEvent);
    }

    function getEventById(
        uint256 _index
    )
        public
        view
        returns (
            Event memory eventDetails,
            address[] memory attendees,
            Event[] memory createdEvents
        )
    {
        require(_index < events.length, "Event does not exist");
        return (
            events[_index],
            eventAttendees[_index],
            creatorEvents[events[_index].owner]
        );
    }

    function deleteEventById(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(msg.sender == events[_index].owner, "Not event owner");
        events[_index].isActive = false;
    }

    function addEventAttendees(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(
            events[_index].eventDate > block.timestamp,
            "Entry date expired"
        );
        require(events[_index].isActive, "Event is inactive");

        address[] storage attendees = eventAttendees[_index];
        for (uint256 i = 0; i < attendees.length; i++) {
            require(attendees[i] != msg.sender, "Already an attendee");
        }
        attendees.push(msg.sender);
    }

    function buyTicket(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(events[_index].eventDate > block.timestamp, "Event expired");
        require(events[_index].isActive, "Event is inactive");
        require(
            !hasPurchasedTicket[_index][msg.sender],
            "Ticket already purchased"
        );

        uint256 price = events[_index].ticketPrice;
        require(price > 0, "Free event, no purchase needed");

        // Transfer cUSD from buyer to event owner
        require(
            cUSDToken.transferFrom(msg.sender, events[_index].owner, price),
            "cUSD Payment failed"
        );

        // Mark the user as a ticket holder
        hasPurchasedTicket[_index][msg.sender] = true;
        eventAttendees[_index].push(msg.sender);
    }

    function getAttendees(
        uint256 _index
    ) public view returns (address[] memory) {
        require(_index < events.length, "Invalid event ID");
        return eventAttendees[_index];
    }

    function getEventLength() public view returns (uint256) {
        return events.length;
    }

    function getEventsByCreator(
        address _creator
    ) public view returns (Event[] memory) {
        return creatorEvents[_creator];
    }

    function getAllEvents()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint count = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                count++;
            }
        }

        uint256[] memory indexes = new uint256[](count);
        Event[] memory activeEvents = new Event[](count);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                indexes[j] = i; // Store index
                activeEvents[j] = events[i]; // Store event details
                j++;
            }
        }
        return (indexes, activeEvents);
    }

    function getActiveEventsByCreator() public view returns (uint256[] memory, Event[] memory) {
    uint count = 0;

    // Count active events
    for (uint i = 0; i < events.length; i++) {
        if (events[i].owner == msg.sender && events[i].isActive) {
            count++;
        }
    }

    // Store active event IDs and events
    uint256[] memory eventIds = new uint256[](count);
    Event[] memory activeEvents = new Event[](count);
    uint j = 0;
    for (uint i = 0; i < events.length; i++) {
        if (events[i].owner == msg.sender && events[i].isActive) {
            eventIds[j] = i; // Store event index
            activeEvents[j] = events[i]; // Store event details
            j++;
        }
    }
    return (eventIds, activeEvents);
}

}

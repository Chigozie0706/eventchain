// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

/**
 * @title EventChain
 * @dev A decentralized event management contract built on the Celo blockchain.
 *      Allows users to create, join, and manage events while providing
 *      secure ticket purchases via cUSD.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMentoExchange {
    function exchange(address sellToken, address buyToken, uint256 sellAmount, uint256 minBuyAmount) external returns (uint256);
}



contract EventChain {
    IMentoExchange public mentoExchange;
    mapping(address => bool) public supportedTokens; // Mento supported tokens (cUSD, cEUR, cCOP)

    constructor(address _mentoExchange, address[] memory _supportedTokens) {
        mentoExchange = IMentoExchange(_mentoExchange);
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }

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
        uint256 fundsHeld;  
        bool isCanceled;
        bool fundsReleased;
        address paymentToken;
    }

    Event[] public events;

    mapping(uint256 => address[]) internal eventAttendees;
    mapping(address => Event[]) internal creatorEvents;
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;

    // event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount);

    event TicketPurchased(uint256 indexed eventId, address indexed buyer, uint256 amount, address paymentToken);
    event EventCanceled(uint256 indexed eventId);
    event RefundIssued(uint256 indexed eventId, address indexed user, uint256 amount);
    event FundsReleased(uint256 indexed eventId, uint256 amount);

    modifier onlyOwner(uint256 _index) {
        require(events[_index].owner == msg.sender, "Not event owner");
        _;
    }

    function createEvent(
        string memory _eventName,
        string memory _eventCardImgUrl,
        string memory _eventDetails,
        uint64 _eventDate,
        uint64 _startTime,
        uint64 _endTime,
        string memory _eventLocation,
        uint256 _ticketPrice,
        address _paymentToken

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
            isActive: true,
            fundsHeld: 0,
            isCanceled: false,
            fundsReleased: false,
            paymentToken: _paymentToken

        });

        events.push(newEvent);
        creatorEvents[msg.sender].push(newEvent);
    }

function buyTicket(uint256 _index) public {
    require(_index < events.length, "Invalid event ID");
    require(events[_index].eventDate > block.timestamp, "Event expired");
    require(events[_index].isActive, "Event is inactive");
    require(!hasPurchasedTicket[_index][msg.sender], "Already purchased");

    uint256 price = events[_index].ticketPrice;
    address eventToken = events[_index].paymentToken;

    // Ensure the user has approved the contract to spend the event token
    require(
        IERC20(eventToken).allowance(msg.sender, address(this)) >= price,
        "Insufficient token allowance"
    );

    // Transfer payment to the contract
    require(
        IERC20(eventToken).transferFrom(msg.sender, address(this), price),
        "Payment failed"
    );

    // Update state
    hasPurchasedTicket[_index][msg.sender] = true;
    eventAttendees[_index].push(msg.sender);
    events[_index].fundsHeld += price;

    emit TicketPurchased(_index, msg.sender, price, eventToken);
}


    function cancelEvent(uint256 _index) public onlyOwner(_index) {
        require(_index < events.length, "Invalid event ID");
        require(events[_index].isActive, "Already canceled");

        events[_index].isActive = false;
        events[_index].isCanceled = true;

        emit EventCanceled(_index);
    }



function requestRefund(uint256 _index) public {
    require(_index < events.length, "Invalid event ID");
    require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

    if (!events[_index].isCanceled) {
        require(block.timestamp < events[_index].startTime - 5 hours, "Refund period has ended");
    }

    uint256 refundAmount = events[_index].ticketPrice;
    require(events[_index].fundsHeld >= refundAmount, "Insufficient funds in escrow");

    hasPurchasedTicket[_index][msg.sender] = false;
    events[_index].fundsHeld -= refundAmount;

    // Remove the user from the attendees list
    address[] storage attendees = eventAttendees[_index];
    for (uint256 i = 0; i < attendees.length; i++) {
        if (attendees[i] == msg.sender) {
            attendees[i] = attendees[attendees.length - 1]; // Move last attendee to the current index
            attendees.pop(); // Remove last attendee
            break;
        }
    }

   // require(cUSDToken.transfer(msg.sender, refundAmount), "Refund failed");

    require(IERC20(events[_index].paymentToken).transfer(msg.sender, refundAmount), "Refund failed");


    emit RefundIssued(_index, msg.sender, refundAmount);
}

    function releaseFunds(uint256 _index) public onlyOwner(_index) {
        require(_index < events.length, "Invalid event ID");
        require(block.timestamp > events[_index].eventDate, "Event has not occurred yet");
        require(!events[_index].isCanceled, "Cannot release funds for a canceled event");
        require(!events[_index].fundsReleased, "Funds already released");

        uint256 amountToRelease = events[_index].fundsHeld;
        events[_index].fundsHeld = 0;
        events[_index].fundsReleased = true;

        // require(cUSDToken.transfer(events[_index].owner, amountToRelease), "Fund transfer failed");

        // require(IERC20(events[_index].paymentToken).transfer(msg.sender, refundAmount), "Refund failed");


        emit FundsReleased(_index, amountToRelease);
    }

    function getEventById(
        uint256 _index
    ) public view returns (Event memory, address[] memory, Event[] memory) {
        require(_index < events.length, "Event does not exist");
        return (events[_index], eventAttendees[_index], creatorEvents[events[_index].owner]);
    }

    function getAttendees(uint256 _index) public view returns (address[] memory) {
        require(_index < events.length, "Invalid event ID");
        return eventAttendees[_index];
    }

    function getEventLength() public view returns (uint256) {
        return events.length;
    }

    function getEventsByCreator(address _creator) public view returns (Event[] memory) {
        return creatorEvents[_creator];
    }

    function getAllEvents() public view returns (uint256[] memory, Event[] memory) {
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
                indexes[j] = i;
                activeEvents[j] = events[i];
                j++;
            }
        }
        return (indexes, activeEvents);
    }

    function getActiveEventsByCreator() public view returns (uint256[] memory, Event[] memory) {
        uint count = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].owner == msg.sender && events[i].isActive) {
                count++;
            }
        }

        uint256[] memory eventIds = new uint256[](count);
        Event[] memory activeEvents = new Event[](count);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].owner == msg.sender && events[i].isActive) {
                eventIds[j] = i;
                activeEvents[j] = events[i];
                j++;
            }
        }
        return (eventIds, activeEvents);
    }
}

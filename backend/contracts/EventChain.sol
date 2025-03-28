// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title EventChain
 * @dev A decentralized event ticketing smart contract that supports multiple tokens.
 */

contract EventChain {
    /// @notice Mapping to track supported payment tokens (Mento stablecoins: cUSD, cEUR, cREAL)
    mapping(address => bool) public supportedTokens;

    /**
     * @dev Constructor to initialize supported tokens.
     * @param _supportedTokens List of token addresses to be supported.
     */
    constructor(address[] memory _supportedTokens) {
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens[_supportedTokens[i]] = true;
        }
    }

    /// @notice Structure to store event details
    struct Event {
        address owner;
        string eventName;
        string eventCardImgUrl;
        string eventDetails;
        uint64 startDate;
        uint64 endDate;
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

    /// @notice Array of all created events
    Event[] public events;

    /// @notice Mapping of event ID to list of attendees
    mapping(uint256 => address[]) internal eventAttendees;

    /// @notice Mapping of creator address to their events
    mapping(address => Event[]) internal creatorEvents;

    /// @notice Mapping to track if a user has purchased a ticket for an event
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;

    /// @notice Event emitted when a new event is created
    event EventCreated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );

    /// @notice Event emitted when an event is updated
    event EventUpdated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );

    /// @notice Event emitted when a ticket is purchased
    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 amount,
        address paymentToken
    );

    /// @notice Event emitted when an event is canceled
    event EventCanceled(uint256 indexed eventId);

    /// @notice Event emitted when a refund is issued
    event RefundIssued(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );

    /// @notice Event emitted when funds are released to the event owner
    event FundsReleased(uint256 indexed eventId, uint256 amount);

    /// @dev Modifier to check if the caller is the owner of the event
    modifier onlyOwner(uint256 _index) {
        require(events[_index].owner == msg.sender, "Not event owner");
        _;
    }

    /**
     * @notice Create a new event.
     * @param _eventName The name of the event.
     * @param _eventCardImgUrl Image URL for event display.
     * @param _eventDetails Description of the event.
     * @param _startDate Start date of the event.
     * @param _endDate End date of the event.
     * @param _startTime Start time of the event.
     * @param _endTime End time of the event.
     * @param _eventLocation Physical or virtual location of the event.
     * @param _ticketPrice Price of one ticket in the specified payment token.
     * @param _paymentToken Address of the token used for payment.
     */
    function createEvent(
        string memory _eventName,
        string memory _eventCardImgUrl,
        string memory _eventDetails,
        uint64 _startDate,
        uint64 _endDate,
        uint64 _startTime,
        uint64 _endTime,
        string memory _eventLocation,
        uint256 _ticketPrice,
        address _paymentToken
    ) public {
        require(supportedTokens[_paymentToken], "Unsupported payment token");
        require(_endDate >= _startDate, "End date must be after start date");

        Event memory newEvent = Event({
            owner: msg.sender,
            eventName: _eventName,
            eventCardImgUrl: _eventCardImgUrl,
            eventDetails: _eventDetails,
            startDate: _startDate,
            endDate: _endDate,
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

        emit EventCreated(events.length - 1, msg.sender, _eventName);
    }

    /**
     * @notice Purchase a ticket for an event.
     * @param _index The event ID to purchase a ticket for.
     */
    function buyTicket(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(events[_index].startDate > block.timestamp, "Event expired");
        require(events[_index].isActive, "Event is inactive");
        require(!hasPurchasedTicket[_index][msg.sender], "Already purchased");

        uint256 price = events[_index].ticketPrice;
        address eventToken = events[_index].paymentToken;

        require(
            IERC20(eventToken).allowance(msg.sender, address(this)) >= price,
            "Insufficient token allowance"
        );

        require(
            IERC20(eventToken).transferFrom(msg.sender, address(this), price),
            "Payment failed"
        );

        hasPurchasedTicket[_index][msg.sender] = true;
        eventAttendees[_index].push(msg.sender);
        events[_index].fundsHeld += price;

        emit TicketPurchased(_index, msg.sender, price, eventToken);
    }

    /**
     * @notice Cancel an event (only the owner can cancel it).
     * @param _index The event ID to cancel.
     */
    function cancelEvent(uint256 _index) public onlyOwner(_index) {
        require(_index < events.length, "Invalid event ID");
        require(events[_index].isActive, "Already canceled");

        events[_index].isActive = false;
        events[_index].isCanceled = true;

        emit EventCanceled(_index);
    }

    /**
     * @notice Request a refund for a canceled event or before the refund period ends.
     * @dev Transfers funds back to the ticket buyer.
     */
    function requestRefund(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

        if (!events[_index].isCanceled) {
            require(
                block.timestamp < events[_index].startDate - (5 * 1 hours),
                "Refund period has ended"
            );
        }

        uint256 refundAmount = events[_index].ticketPrice;
        require(
            events[_index].fundsHeld >= refundAmount,
            "Insufficient funds in escrow"
        );

        hasPurchasedTicket[_index][msg.sender] = false;
        events[_index].fundsHeld -= refundAmount;

        address[] storage attendees = eventAttendees[_index];
        for (uint256 i = 0; i < attendees.length; i++) {
            if (attendees[i] == msg.sender) {
                attendees[i] = attendees[attendees.length - 1];
                attendees.pop();
                break;
            }
        }

        require(
            IERC20(events[_index].paymentToken).transfer(
                msg.sender,
                refundAmount
            ),
            "Refund failed"
        );

        emit RefundIssued(_index, msg.sender, refundAmount);
    }

    /**
     * @notice Release event funds to the event owner after the event has ended.
     * @dev Transfers collected funds to the owner and emits FundsReleased event.
     */
    function releaseFunds(uint256 _index) public onlyOwner(_index) {
        require(_index < events.length, "Invalid event ID");
        require(
            block.timestamp > events[_index].endDate,
            "Event has not ended yet"
        );
        require(
            !events[_index].isCanceled,
            "Cannot release funds for a canceled event"
        );
        require(!events[_index].fundsReleased, "Funds already released");

        uint256 amountToRelease = events[_index].fundsHeld;
        events[_index].fundsHeld = 0;
        events[_index].fundsReleased = true;

        require(
            IERC20(events[_index].paymentToken).transfer(
                msg.sender,
                amountToRelease
            ),
            "Fund transfer failed"
        );

        emit FundsReleased(_index, amountToRelease);
    }

    /**
     * @notice Get details of an event by its ID.
     * @param _index The event ID.
     * @return The event details, list of attendees, and events created by the event owner.
     */
    function getEventById(
        uint256 _index
    ) public view returns (Event memory, address[] memory, Event[] memory) {
        require(_index < events.length, "Event does not exist");
        return (
            events[_index],
            eventAttendees[_index],
            creatorEvents[events[_index].owner]
        );
    }

    /**
     * @notice Get the list of attendees for a specific event.
     * @param _index The event ID.
     * @return An array of addresses of attendees.
     */
    function getAttendees(
        uint256 _index
    ) public view returns (address[] memory) {
        require(_index < events.length, "Invalid event ID");
        return eventAttendees[_index];
    }

    /**
     * @notice Get the total number of events created.
     * @return The total number of events.
     */
    function getEventLength() public view returns (uint256) {
        return events.length;
    }

    /**
     * @notice Get all events created by a specific creator.
     * @param _creator The address of the event creator.
     * @return An array of events created by the given address.
     */
    function getEventsByCreator(
        address _creator
    ) public view returns (Event[] memory) {
        return creatorEvents[_creator];
    }

    /**
     * @notice Get all active events.
     * @return An array of event IDs and corresponding active event details.
     */
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
                indexes[j] = i;
                activeEvents[j] = events[i];
                j++;
            }
        }
        return (indexes, activeEvents);
    }

    /**
     * @notice Get events that the caller has purchased tickets for.
     * @return An array of event IDs and corresponding event details.
     */
    function getUserEvents()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint count = 0;

        // Count the number of events the user has purchased a ticket for
        for (uint i = 0; i < events.length; i++) {
            if (hasPurchasedTicket[i][msg.sender]) {
                count++;
            }
        }

        // Create arrays with the correct size
        uint256[] memory eventIds = new uint256[](count);
        Event[] memory userEvents = new Event[](count);
        uint j = 0;

        // Populate the arrays with the user's events
        for (uint i = 0; i < events.length; i++) {
            if (hasPurchasedTicket[i][msg.sender]) {
                eventIds[j] = i;
                userEvents[j] = events[i];
                j++;
            }
        }

        return (eventIds, userEvents);
    }

    /**
     * @notice Get all active events created by the caller.
     * @return An array of event IDs and corresponding active event details.
     */
    function getActiveEventsByCreator()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
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

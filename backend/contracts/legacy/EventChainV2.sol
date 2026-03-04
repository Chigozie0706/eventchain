// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IEngagementRewards
 * @dev GoodDollar Engagement Rewards interface
 */
interface IEngagementRewards {
    function appClaim(
        address user,
        address inviter,
        uint256 validUntilBlock,
        bytes memory signature
    ) external returns (bool);

    function appClaim(
        address user,
        address inviter,
        uint256 validUntilBlock,
        bytes memory signature,
        uint8 userAndInviterPercentage,
        uint8 userPercentage
    ) external returns (bool);
}

/**
 * @title EventChain V2
 * @dev Decentralized event ticketing with GoodDollar rewards integration
 *
 * CHANGELOG V2:
 * - GoodDollar Engagement Rewards integration
 * - Users earn G$ for purchasing tickets
 * - NO REFERRAL SYSTEM (inviter always set to address(0))
 * - BACKWARD COMPATIBLE - Old buyTicket() still works!
 * - New buyTicketWithRewards() for GoodDollar features
 */
contract EventChainV2 is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant MAX_NAME_LENGTH = 100;
    uint256 public constant MAX_URL_LENGTH = 200;
    uint256 public constant MAX_DETAILS_LENGTH = 1000;
    uint256 public constant MAX_LOCATION_LENGTH = 150;
    uint256 public constant MAX_TICKET_PRICE = 1e24;
    uint256 public constant MIN_CAPACITY = 1;
    uint256 public constant MAX_CAPACITY = 100000;
    uint256 public constant MIN_EVENT_DURATION = 1 hours;
    uint256 public constant MAX_EVENT_DURATION = 365 days;
    uint256 public constant EMERGENCY_WITHDRAWAL_DELAY = 90 days;
    uint256 public constant MAX_AGE = 150;
    uint256 public constant G_DOLLAR_FEE_BPS = 100;

    // State variables (V1)
    bool public paused;
    uint256 public eventCount;
    address public ubiPool;
    address public constant CELO = address(0);
    address public constant G_DOLLAR =
        0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A;
    mapping(address => bool) public supportedTokens;

    enum RefundPolicy {
        NO_REFUND,
        REFUND_BEFORE_START,
        CUSTOM_BUFFER
    }

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
        uint256 minimumAge;
        uint256 maxCapacity;
        bool isCanceled;
        bool fundsReleased;
        bool exists;
        RefundPolicy refundPolicy;
        uint256 refundBufferHours;
        address paymentToken;
    }

    // Storage (V1)
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => bool)) public isAttendee;
    mapping(uint256 => address[]) internal eventAttendeesList;
    mapping(uint256 => uint256) public attendeeCount;
    mapping(address => uint256[]) internal creatorEventIds;
    mapping(uint256 => mapping(address => bool)) public hasPurchasedTicket;
    mapping(uint256 => mapping(address => uint256)) internal attendeeIndex;
    mapping(address => mapping(address => uint256)) public pendingWithdrawals;

    // NEW V2 State Variables (No referral mapping)
    IEngagementRewards public engagementRewards;
    bool public goodDollarEnabled;

    // Events (V1)
    event EventCreated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );
    event EventUpdated(
        uint256 indexed eventId,
        address indexed owner,
        string eventName
    );
    event TicketPurchased(
        uint256 indexed eventId,
        address indexed buyer,
        uint256 amount,
        address paymentToken
    );
    event EventCanceled(uint256 indexed eventId);
    event RefundIssued(
        uint256 indexed eventId,
        address indexed user,
        uint256 amount
    );
    event FundsReleased(uint256 indexed eventId, uint256 amount);
    event EmergencyWithdrawal(uint256 indexed eventId, uint256 amount);
    event TicketTransferred(
        uint256 indexed eventId,
        address indexed from,
        address indexed to
    );
    event WithdrawalReady(address indexed user, uint256 amount);
    event SupportedTokenAdded(address indexed token);
    event UbiPoolUpdated(address indexed newPool);

    // NEW V2 Events
    event GoodDollarRewardClaimed(
        address indexed user,
        uint256 indexed eventId,
        bool success
    );
    event GoodDollarToggled(bool enabled);
    event EngagementRewardsUpdated(address indexed newContract);

    modifier onlyEventOwner(uint256 _index) {
        require(events[_index].owner == msg.sender, "Not event owner");
        _;
    }

    modifier validEvent(uint256 _index) {
        require(events[_index].exists, "Event doesn't exist");
        require(events[_index].owner != address(0), "Event owner is zero");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address[] memory _supportedTokens) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        supportedTokens[CELO] = true;
        ubiPool = 0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1;

        for (uint i = 0; i < _supportedTokens.length; i++) {
            if (_supportedTokens[i] != address(0)) {
                supportedTokens[_supportedTokens[i]] = true;
            }
        }
    }

    function initializeV2(address _engagementRewards) public reinitializer(2) {
        require(
            _engagementRewards != address(0),
            "Invalid engagement rewards address"
        );
        engagementRewards = IEngagementRewards(_engagementRewards);
        goodDollarEnabled = true;
        emit EngagementRewardsUpdated(_engagementRewards);
        emit GoodDollarToggled(true);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    receive() external payable {}

    fallback() external payable {
        revert("Use buyTicket function");
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function toggleGoodDollar() external onlyOwner {
        goodDollarEnabled = !goodDollarEnabled;
        emit GoodDollarToggled(goodDollarEnabled);
    }

    function updateEngagementRewards(
        address _engagementRewards
    ) external onlyOwner {
        require(_engagementRewards != address(0), "Invalid address");
        engagementRewards = IEngagementRewards(_engagementRewards);
        emit EngagementRewardsUpdated(_engagementRewards);
    }

    function addSupportedToken(address _token) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        supportedTokens[_token] = true;
        emit SupportedTokenAdded(_token);
    }

    function updateUbiPool(address _newPool) external onlyOwner {
        require(_newPool != address(0), "Invalid pool address");
        ubiPool = _newPool;
        emit UbiPoolUpdated(_newPool);
    }

    function createEvent(
        string calldata _eventName,
        string calldata _eventCardImgUrl,
        string calldata _eventDetails,
        uint64 _startDate,
        uint64 _endDate,
        uint64 _startTime,
        uint64 _endTime,
        string calldata _eventLocation,
        uint256 _ticketPrice,
        uint256 _minimumAge,
        uint256 _maxCapacity,
        RefundPolicy _refundPolicy,
        uint256 _refundBufferHours,
        address _paymentToken
    ) public whenNotPaused {
        require(
            bytes(_eventName).length > 0 &&
                bytes(_eventName).length <= MAX_NAME_LENGTH,
            "Invalid name length"
        );
        require(
            bytes(_eventCardImgUrl).length > 0 &&
                bytes(_eventCardImgUrl).length <= MAX_URL_LENGTH,
            "Invalid URL length"
        );
        require(
            bytes(_eventDetails).length > 0 &&
                bytes(_eventDetails).length <= MAX_DETAILS_LENGTH,
            "Invalid details length"
        );
        require(
            bytes(_eventLocation).length > 0 &&
                bytes(_eventLocation).length <= MAX_LOCATION_LENGTH,
            "Invalid location length"
        );
        require(
            _ticketPrice > 0 && _ticketPrice <= MAX_TICKET_PRICE,
            "Invalid ticket price"
        );
        require(_startDate >= block.timestamp, "Start date must be in future");
        require(
            _endDate >= _startDate + MIN_EVENT_DURATION,
            "Event duration too short"
        );
        require(
            _endDate <= _startDate + MAX_EVENT_DURATION,
            "Event duration too long"
        );
        require(_minimumAge <= MAX_AGE, "Invalid minimum age");
        require(
            _maxCapacity >= MIN_CAPACITY && _maxCapacity <= MAX_CAPACITY,
            "Invalid capacity"
        );
        require(supportedTokens[_paymentToken], "Unsupported payment token");
        require(
            _refundPolicy <= RefundPolicy.CUSTOM_BUFFER,
            "Invalid refund policy"
        );

        if (_refundPolicy == RefundPolicy.CUSTOM_BUFFER) {
            require(
                _refundBufferHours > 0 && _refundBufferHours <= 720,
                "Invalid refund buffer"
            );
            uint256 timeUntilEvent = _startDate - block.timestamp;
            require(
                _refundBufferHours * 1 hours < timeUntilEvent,
                "Refund buffer exceeds time until event"
            );
        }

        uint256 newEventId = eventCount;

        events[newEventId] = Event({
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
            minimumAge: _minimumAge,
            maxCapacity: _maxCapacity,
            fundsReleased: false,
            exists: true,
            refundPolicy: _refundPolicy,
            refundBufferHours: _refundBufferHours,
            paymentToken: _paymentToken
        });

        creatorEventIds[msg.sender].push(newEventId);
        eventCount++;

        emit EventCreated(newEventId, msg.sender, _eventName);
    }

    function updateEvent(
        uint256 _index,
        string calldata _eventName,
        string calldata _eventCardImgUrl,
        string calldata _eventDetails,
        string calldata _eventLocation,
        uint256 _ticketPrice,
        uint256 _maxCapacity,
        RefundPolicy _refundPolicy,
        uint256 _refundBufferHours
    ) public onlyEventOwner(_index) validEvent(_index) whenNotPaused {
        Event storage event_ = events[_index];

        require(event_.isActive, "Event is not active");
        require(block.timestamp < event_.startDate, "Event already started");
        require(
            bytes(_eventName).length > 0 &&
                bytes(_eventName).length <= MAX_NAME_LENGTH,
            "Invalid name length"
        );
        require(
            bytes(_eventCardImgUrl).length > 0 &&
                bytes(_eventCardImgUrl).length <= MAX_URL_LENGTH,
            "Invalid URL length"
        );
        require(
            bytes(_eventDetails).length > 0 &&
                bytes(_eventDetails).length <= MAX_DETAILS_LENGTH,
            "Invalid details length"
        );
        require(
            bytes(_eventLocation).length > 0 &&
                bytes(_eventLocation).length <= MAX_LOCATION_LENGTH,
            "Invalid location length"
        );

        if (_ticketPrice != event_.ticketPrice) {
            require(
                attendeeCount[_index] == 0,
                "Cannot change price after tickets sold"
            );
            require(
                _ticketPrice > 0 && _ticketPrice <= MAX_TICKET_PRICE,
                "Invalid ticket price"
            );
            event_.ticketPrice = _ticketPrice;
        }

        if (_maxCapacity != event_.maxCapacity) {
            require(
                _maxCapacity >= MIN_CAPACITY && _maxCapacity <= MAX_CAPACITY,
                "Invalid capacity"
            );
            require(
                _maxCapacity >= attendeeCount[_index],
                "Capacity below current attendees"
            );
            event_.maxCapacity = _maxCapacity;
        }

        require(
            _refundPolicy <= RefundPolicy.CUSTOM_BUFFER,
            "Invalid refund policy"
        );
        if (_refundPolicy == RefundPolicy.CUSTOM_BUFFER) {
            require(
                _refundBufferHours > 0 && _refundBufferHours <= 720,
                "Invalid refund buffer"
            );
            uint256 timeUntilEvent = event_.startDate - block.timestamp;
            require(
                _refundBufferHours * 1 hours < timeUntilEvent,
                "Refund buffer exceeds time until event"
            );
        }

        event_.eventName = _eventName;
        event_.eventCardImgUrl = _eventCardImgUrl;
        event_.eventDetails = _eventDetails;
        event_.eventLocation = _eventLocation;
        event_.refundPolicy = _refundPolicy;
        event_.refundBufferHours = _refundBufferHours;

        emit EventUpdated(_index, msg.sender, _eventName);
    }

    function buyTicket(
        uint256 _index
    ) public payable nonReentrant validEvent(_index) whenNotPaused {
        _processBuyTicket(_index, 0, new bytes(0));
    }

    function buyTicketWithRewards(
        uint256 _index,
        uint256 _validUntilBlock,
        bytes memory _signature
    ) public payable nonReentrant validEvent(_index) whenNotPaused {
        _processBuyTicket(_index, _validUntilBlock, _signature);
    }

    function _processBuyTicket(
        uint256 _index,
        uint256 _validUntilBlock,
        bytes memory _signature
    ) internal {
        Event storage event_ = events[_index];

        require(
            block.timestamp < event_.startDate,
            "Event has started or expired"
        );
        require(event_.isActive, "Event is not active");
        require(
            !hasPurchasedTicket[_index][msg.sender],
            "Ticket already purchased"
        );
        require(
            attendeeCount[_index] < event_.maxCapacity,
            "Event at maximum capacity"
        );

        uint256 price = event_.ticketPrice;
        address paymentToken = event_.paymentToken;

        if (paymentToken == CELO) {
            require(msg.value == price, "Incorrect CELO amount");
            event_.fundsHeld += price;
        } else if (paymentToken == G_DOLLAR) {
            require(msg.value == 0, "Don't send CELO with G$ payment");
            uint256 fee = (price * G_DOLLAR_FEE_BPS) / 10000;
            uint256 netAmount = price - fee;
            IERC20(paymentToken).safeTransferFrom(
                msg.sender,
                address(this),
                price
            );
            if (fee > 0 && ubiPool != address(0)) {
                IERC20(paymentToken).safeTransfer(ubiPool, fee);
            }
            event_.fundsHeld += netAmount;
        } else {
            require(msg.value == 0, "Don't send CELO with token payment");
            IERC20(paymentToken).safeTransferFrom(
                msg.sender,
                address(this),
                price
            );
            event_.fundsHeld += price;
        }

        hasPurchasedTicket[_index][msg.sender] = true;
        isAttendee[_index][msg.sender] = true;
        attendeeIndex[_index][msg.sender] = eventAttendeesList[_index].length;
        eventAttendeesList[_index].push(msg.sender);
        attendeeCount[_index]++;

        emit TicketPurchased(_index, msg.sender, price, paymentToken);

        if (
            goodDollarEnabled &&
            address(engagementRewards) != address(0) &&
            (_validUntilBlock > 0 || _signature.length > 0)
        ) {
            _claimGoodDollarReward(
                msg.sender,
                _validUntilBlock,
                _signature,
                _index
            );
        }
    }

    function _claimGoodDollarReward(
        address user,
        uint256 validUntilBlock,
        bytes memory signature,
        uint256 eventId
    ) internal {
        try
            engagementRewards.appClaim(
                user,
                address(0),
                validUntilBlock,
                signature
            )
        returns (bool success) {
            emit GoodDollarRewardClaimed(user, eventId, success);
        } catch {
            emit GoodDollarRewardClaimed(user, eventId, false);
        }
    }

    function transferTicket(
        uint256 _index,
        address _to
    ) public nonReentrant validEvent(_index) whenNotPaused {
        require(
            hasPurchasedTicket[_index][msg.sender],
            "No ticket to transfer"
        );
        require(_to != address(0), "Invalid recipient address");
        require(_to != msg.sender, "Cannot transfer to yourself");
        require(
            !hasPurchasedTicket[_index][_to],
            "Recipient already has ticket"
        );
        require(
            block.timestamp < events[_index].startDate,
            "Cannot transfer after event starts"
        );

        hasPurchasedTicket[_index][msg.sender] = false;
        hasPurchasedTicket[_index][_to] = true;
        isAttendee[_index][msg.sender] = false;
        isAttendee[_index][_to] = true;

        uint256 index = attendeeIndex[_index][msg.sender];
        eventAttendeesList[_index][index] = _to;
        attendeeIndex[_index][_to] = index;
        delete attendeeIndex[_index][msg.sender];

        emit TicketTransferred(_index, msg.sender, _to);
    }

    function cancelEvent(
        uint256 _index
    ) public onlyEventOwner(_index) validEvent(_index) whenNotPaused {
        require(events[_index].isActive, "Event already inactive");
        events[_index].isActive = false;
        events[_index].isCanceled = true;
        emit EventCanceled(_index);
    }

    function requestRefund(
        uint256 _index
    ) public nonReentrant validEvent(_index) whenNotPaused {
        require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

        Event storage event_ = events[_index];
        uint256 refundAmount = event_.ticketPrice;

        if (event_.paymentToken == G_DOLLAR) {
            refundAmount = (refundAmount * 99) / 100;
        }

        require(
            event_.fundsHeld >= refundAmount,
            "Insufficient funds in contract"
        );

        if (!event_.isCanceled) {
            if (event_.refundPolicy == RefundPolicy.NO_REFUND) {
                revert("Refunds not allowed for this event");
            } else if (
                event_.refundPolicy == RefundPolicy.REFUND_BEFORE_START
            ) {
                require(
                    block.timestamp < event_.startDate,
                    "Refund period has ended"
                );
            } else if (event_.refundPolicy == RefundPolicy.CUSTOM_BUFFER) {
                require(
                    block.timestamp <
                        event_.startDate - (event_.refundBufferHours * 1 hours),
                    "Refund buffer period has ended"
                );
            }
        }

        hasPurchasedTicket[_index][msg.sender] = false;
        isAttendee[_index][msg.sender] = false;
        event_.fundsHeld -= refundAmount;
        attendeeCount[_index]--;

        address[] storage attendees = eventAttendeesList[_index];
        uint256 indexToRemove = attendeeIndex[_index][msg.sender];
        uint256 lastIndex = attendees.length - 1;

        if (indexToRemove != lastIndex) {
            address lastAttendee = attendees[lastIndex];
            attendees[indexToRemove] = lastAttendee;
            attendeeIndex[_index][lastAttendee] = indexToRemove;
        }

        attendees.pop();
        delete attendeeIndex[_index][msg.sender];

        pendingWithdrawals[msg.sender][event_.paymentToken] += refundAmount;

        emit RefundIssued(_index, msg.sender, refundAmount);
        emit WithdrawalReady(msg.sender, refundAmount);
    }

    function releaseFunds(
        uint256 _index
    ) public onlyEventOwner(_index) nonReentrant {
        Event storage event_ = events[_index];

        require(event_.exists, "Event does not exist");
        require(block.timestamp > event_.endDate, "Event has not ended yet");
        require(!event_.isCanceled, "Cannot release funds for canceled event");
        require(!event_.fundsReleased, "Funds already released");

        uint256 amountToRelease = event_.fundsHeld;
        require(amountToRelease > 0, "No funds to release");

        event_.fundsHeld = 0;
        event_.fundsReleased = true;

        pendingWithdrawals[msg.sender][event_.paymentToken] += amountToRelease;

        emit FundsReleased(_index, amountToRelease);
        emit WithdrawalReady(msg.sender, amountToRelease);
    }

    function emergencyWithdrawFunds(
        uint256 _index
    ) public onlyOwner nonReentrant {
        Event storage event_ = events[_index];

        require(event_.exists, "Event does not exist");
        require(
            block.timestamp > event_.endDate + EMERGENCY_WITHDRAWAL_DELAY,
            "Emergency withdrawal delay not met"
        );
        require(!event_.fundsReleased, "Funds already released");
        require(event_.fundsHeld > 0, "No funds to withdraw");

        uint256 amountToWithdraw = event_.fundsHeld;
        event_.fundsHeld = 0;
        event_.fundsReleased = true;

        pendingWithdrawals[event_.owner][
            event_.paymentToken
        ] += amountToWithdraw;

        emit EmergencyWithdrawal(_index, amountToWithdraw);
        emit WithdrawalReady(event_.owner, amountToWithdraw);
    }

    function withdraw(address token) external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender][token];
        require(amount > 0, "No funds to withdraw");

        pendingWithdrawals[msg.sender][token] = 0;

        if (token == CELO) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "CELO withdrawal failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }

        emit WithdrawalReady(msg.sender, amount);
    }

    function getPendingWithdrawal(
        address user,
        address token
    ) external view returns (uint256) {
        return pendingWithdrawals[user][token];
    }

    function getEventById(
        uint256 _index
    ) public view returns (Event memory, address[] memory) {
        require(events[_index].exists, "Event does not exist");
        return (events[_index], eventAttendeesList[_index]);
    }

    function getAttendees(
        uint256 _index
    ) public view returns (address[] memory) {
        require(events[_index].exists, "Invalid event ID");
        return eventAttendeesList[_index];
    }

    function getEventLength() public view returns (uint256) {
        return eventCount;
    }

    function getEventIdsByCreator(
        address _creator
    ) public view returns (uint256[] memory) {
        return creatorEventIds[_creator];
    }

    function getEventsByCreator(
        address _creator
    ) public view returns (Event[] memory) {
        uint256[] memory eventIds = creatorEventIds[_creator];
        Event[] memory creatorEvents = new Event[](eventIds.length);

        for (uint256 i = 0; i < eventIds.length; i++) {
            creatorEvents[i] = events[eventIds[i]];
        }

        return creatorEvents;
    }

    function getAllEvents()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < eventCount; i++) {
            if (events[i].exists && events[i].isActive) {
                activeCount++;
            }
        }

        uint256[] memory indexes = new uint256[](activeCount);
        Event[] memory activeEvents = new Event[](activeCount);

        uint256 currentIndex = 0;
        for (uint256 i = 0; i < eventCount; i++) {
            if (events[i].exists && events[i].isActive) {
                indexes[currentIndex] = i;
                activeEvents[currentIndex] = events[i];
                currentIndex++;
            }
        }

        return (indexes, activeEvents);
    }

    function getUserEvents(
        address user
    ) public view returns (uint256[] memory, Event[] memory) {
        uint256 userEventCount = 0;

        for (uint256 i = 0; i < eventCount; i++) {
            if (events[i].exists && hasPurchasedTicket[i][user]) {
                userEventCount++;
            }
        }

        uint256[] memory eventIds = new uint256[](userEventCount);
        Event[] memory userEvents = new Event[](userEventCount);

        uint256 currentIndex = 0;
        for (uint256 i = 0; i < eventCount; i++) {
            if (events[i].exists && hasPurchasedTicket[i][user]) {
                eventIds[currentIndex] = i;
                userEvents[currentIndex] = events[i];
                currentIndex++;
            }
        }

        return (eventIds, userEvents);
    }

    function getActiveEventsByCreator()
        public
        view
        returns (uint256[] memory, Event[] memory)
    {
        uint256 activeCount = 0;

        for (uint256 i = 0; i < eventCount; i++) {
            if (
                events[i].exists &&
                events[i].owner == msg.sender &&
                events[i].isActive
            ) {
                activeCount++;
            }
        }

        uint256[] memory eventIds = new uint256[](activeCount);
        Event[] memory activeEvents = new Event[](activeCount);

        uint256 currentIndex = 0;
        for (uint256 i = 0; i < eventCount; i++) {
            if (
                events[i].exists &&
                events[i].owner == msg.sender &&
                events[i].isActive
            ) {
                eventIds[currentIndex] = i;
                activeEvents[currentIndex] = events[i];
                currentIndex++;
            }
        }

        return (eventIds, activeEvents);
    }

    uint256[49] private __gap;
}

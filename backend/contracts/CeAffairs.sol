// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract CeAffairs {
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
    }

    Event[] public events;

    mapping(uint256 => address[]) internal eventAttendees;
    mapping(address => uint256[]) internal creatorEvents; //  Tracks event indexes for each creator

    function createEvent(
        string memory _eventName,
        string memory _eventCardImgUrl,
        string memory _eventDetails,
        uint64 _eventDate,
        uint64 _startTime,
        uint64 _endTime,
        string memory _eventLocation
    ) public {
        events.push(
            Event({
                owner: msg.sender,
                eventName: _eventName,
                eventCardImgUrl: _eventCardImgUrl,
                eventDetails: _eventDetails,
                eventDate: _eventDate,
                startTime: _startTime,
                endTime: _endTime,
                eventLocation: _eventLocation,
                isActive: true
            })
        );

        creatorEvents[msg.sender].push(events.length - 1); // Store event index for creator
    }

    function getEventById(
        uint256 _index
    )
        public
        view
        returns (
            address,
            string memory,
            string memory,
            string memory,
            uint64,
            uint64,
            uint64,
            string memory,
            bool
        )
    {
        require(_index < events.length, "Event does not exist");
        Event storage ev = events[_index];
        return (
            ev.owner,
            ev.eventName,
            ev.eventCardImgUrl,
            ev.eventDetails,
            ev.eventDate,
            ev.startTime,
            ev.endTime,
            ev.eventLocation,
            ev.isActive
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

    function getAttendees(
        uint256 _index
    ) public view returns (address[] memory) {
        require(_index < events.length, "Invalid event ID");
        return eventAttendees[_index];
    }

    function getEventLength() public view returns (uint256) {
        return events.length;
    }

    //  Get all events created by an address
    function getEventsByCreator(
        address _creator
    ) public view returns (uint256[] memory) {
        return creatorEvents[_creator];
    }

    // New function: Get all active events
    function getAllEvents() public view returns (Event[] memory) {
        uint count = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                count++;
            }
        }

        Event[] memory activeEvents = new Event[](count);
        uint j = 0;
        for (uint i = 0; i < events.length; i++) {
            if (events[i].isActive) {
                activeEvents[j] = events[i];
                j++;
            }
        }
        return activeEvents;
    }

}

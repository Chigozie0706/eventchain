    function requestRefund(uint256 _index) public {
        require(_index < events.length, "Invalid event ID");
        require(events[_index].isCanceled, "Event is not canceled");
        require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

        uint256 refundAmount = events[_index].ticketPrice;
        require(events[_index].fundsHeld >= refundAmount, "Insufficient funds in escrow");

        hasPurchasedTicket[_index][msg.sender] = false;
        events[_index].fundsHeld -= refundAmount;

        require(cUSDToken.transfer(msg.sender, refundAmount), "Refund failed");

        emit RefundIssued(_index, msg.sender, refundAmount);
    }


    function requestRefund(uint256 _index) public {
    require(_index < events.length, "Invalid event ID");
    require(hasPurchasedTicket[_index][msg.sender], "No ticket purchased");

    // Refund allowed anytime if the event is canceled
    if (!events[_index].isCanceled) {
        // If event is not canceled, refund only allowed at least 5 hours before start time
        require(block.timestamp < events[_index].startTime - 5 hours, "Refund period has ended");
    }

    uint256 refundAmount = events[_index].ticketPrice;
    require(events[_index].fundsHeld >= refundAmount, "Insufficient funds in escrow");

    hasPurchasedTicket[_index][msg.sender] = false;
    events[_index].fundsHeld -= refundAmount;

    require(cUSDToken.transfer(msg.sender, refundAmount), "Refund failed");

    emit RefundIssued(_index, msg.sender, refundAmount);
}
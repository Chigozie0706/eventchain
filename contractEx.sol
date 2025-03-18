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











  // const buyTicket = async () => {
  //   if (!contract || !cUSDToken) return;

  //   setLoading(true);
  //   const toastId = toast.loading("Processing your ticket purchase...");

  //   try {
  //     const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

  //     // Step 1: Approve contract to spend cUSD
  //     const approveTx = await cUSDToken.approve(
  //       contract.target,
  //       ticketPriceWei
  //     );
  //     await approveTx.wait();

  //     // Step 2: Buy ticket
  //     const buyTx = await contract.buyTicket(id);
  //     await buyTx.wait();

  //     // Dismiss loading toast and show success message
  //     toast.dismiss(toastId);
  //     toast.success(" Ticket purchased successfully!");

  //     console.log(" Ticket purchased successfully!");
  //     fetchEventById();
  //   } catch (error: any) {
  //     console.error(" Error buying ticket:", error);

  //     // Dismiss loading toast and show error message
  //     toast.dismiss(toastId);

  //     if (error.reason) {
  //       toast.error(`Transaction Reverted: ${error.reason}`);
  //     } else if (error.data?.message) {
  //       toast.error(`Smart Contract Error: ${error.data.message}`);
  //     } else {
  //       toast.error("Transaction failed. Please check console for details.");
  //     }
  //   } finally {
  //     setLoading(false); // Ensure loading state is turned off after completion
  //   }
  // };

  // const buyTicket = async () => {
  //   console.log("contract", contract);
  //   if (!contract || !event.paymentToken) {
  //     toast.error("Contract or payment token not found.");
  //     return;
  //   }

  //   setLoading(true);
  //   const toastId = toast.loading("Processing your ticket purchase...");

  //   try {
  //     const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

  //     // Get the token contract for the event's payment token
  //     const paymentTokenContract = getTokenContract(event.paymentToken);
  //     if (!paymentTokenContract) {
  //       throw new Error("Failed to create payment token contract.");
  //     }

  //     // Step 1: Approve contract to spend the payment token
  //     const approveTx = await paymentTokenContract.approve(
  //       contract.target,
  //       ticketPriceWei
  //     );
  //     await approveTx.wait();

  //     // Step 2: Buy ticket
  //     const buyTx = await contract.buyTicket(id);
  //     await buyTx.wait();

  //     // Dismiss loading toast and show success message
  //     toast.dismiss(toastId);
  //     toast.success("Ticket purchased successfully!");

  //     console.log("Ticket purchased successfully!");
  //     fetchEventById(); // Refresh event details
  //   } catch (error: any) {
  //     console.error("Error buying ticket:", error);

  //     // Dismiss loading toast and show error message
  //     toast.dismiss(toastId);

  //     if (error.reason) {
  //       toast.error(`Transaction Reverted: ${error.reason}`);
  //     } else if (error.data?.message) {
  //       toast.error(`Smart Contract Error: ${error.data.message}`);
  //     } else {
  //       toast.error("Transaction failed. Please check console for details.");
  //     }
  //   } finally {
  //     setLoading(false); // Ensure loading state is turned off after completion
  //   }
  // };

  // const buyTicket = async () => {
  //   console.log("Attempting to buy ticket...");

  //   if (!address) {
  //     toast.error("Please connect your wallet first.");
  //     return;
  //   }

  //   if (!contract || !event.paymentToken) {
  //     toast.error("Contract or payment token not found.");
  //     return;
  //   }

  //   setLoading(true);
  //   const toastId = toast.loading("Processing your ticket purchase...");

  //   try {
  //     const ticketPriceWei = parseUnits(event.ticketPrice.toString(), "ether");

  //     // Get the token contract for the event's payment token
  //     const paymentTokenContract = getTokenContract(event.paymentToken);
  //     if (!paymentTokenContract) {
  //       throw new Error("Failed to create payment token contract.");
  //     }

  //     console.log("Approving contract to spend tokens...");

  //     // Step 1: Approve contract to spend the payment token
  //     const approveTx = await paymentTokenContract.approve(
  //       contract.target,
  //       ticketPriceWei
  //     );
  //     await approveTx.wait();
  //     console.log("Approval successful:", approveTx);

  //     console.log("Purchasing ticket...");

  //     // Step 2: Buy ticket
  //     const buyTx = await contract.buyTicket(id);
  //     await buyTx.wait();
  //     console.log("Ticket purchase successful:", buyTx);

  //     // Dismiss loading toast and show success message
  //     toast.dismiss(toastId);
  //     toast.success("Ticket purchased successfully!");

  //     console.log("Ticket purchased successfully!");
  //     fetchEventById(); // Refresh event details
  //   } catch (error: any) {
  //     console.error("Error buying ticket:", error, event.paymentToken);

  //     // Dismiss loading toast and show error message
  //     toast.dismiss(toastId);

  //     if (error.reason) {
  //       toast.error(`Transaction Reverted: ${error.reason}`);
  //     } else if (error.data?.message) {
  //       toast.error(`Smart Contract Error: ${error.data.message}`);
  //     } else {
  //       toast.error("Transaction failed. Please check console for details.");
  //     }
  //   } finally {
  //     setLoading(false); // Ensure loading state is turned off after completion
  //   }
  // };


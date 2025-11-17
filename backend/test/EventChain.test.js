const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
  setBalance,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EventChain Contract Tests", function () {
  async function deployEventChainFixture() {
    const [owner, user1, user2, user3, ubiPool] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUSDT = await MockERC20.deploy(
      "Mock USDT",
      "MUSDT",
      6,
      ethers.parseUnits("1000000", 6)
    );
    const mockCUSD = await MockERC20.deploy(
      "Mock cUSD",
      "MCUSD",
      18,
      ethers.parseEther("1000000")
    );

    const MockERC677 = await ethers.getContractFactory("MockERC677");
    const mockGDollar = await MockERC677.deploy(
      "Mock G$",
      "MG$",
      ethers.parseEther("1000000")
    );

    // Deploy EventChain with supported tokens
    const supportedTokens = [
      mockUSDT.target,
      mockCUSD.target,
      mockGDollar.target,
    ];
    const EventChain = await ethers.getContractFactory("EventChain");
    const eventChain = await EventChain.deploy(supportedTokens);

    // Distribute tokens to users
    await mockUSDT.transfer(user1.address, ethers.parseUnits("10000", 6));
    await mockUSDT.transfer(user2.address, ethers.parseUnits("10000", 6));
    await mockCUSD.transfer(user1.address, ethers.parseEther("10000"));
    await mockCUSD.transfer(user2.address, ethers.parseEther("10000"));
    await mockGDollar.transfer(user1.address, ethers.parseEther("10000"));
    await mockGDollar.transfer(user2.address, ethers.parseEther("10000"));

    // Set initial CELO balances for native token tests
    await setBalance(user1.address, ethers.parseEther("100"));
    await setBalance(user2.address, ethers.parseEther("100"));
    await setBalance(owner.address, ethers.parseEther("100"));

    const currentTime = await time.latest();
    const futureTime = currentTime + 86400; // 24 hours from now
    const endTime = futureTime + 7200; // 2 hours duration

    return {
      eventChain,
      mockUSDT,
      mockCUSD,
      mockGDollar,
      owner,
      user1,
      user2,
      user3,
      ubiPool,
      currentTime,
      futureTime,
      endTime,
    };
  }

  describe("Contract Deployment", function () {
    it("Should deploy with correct supported tokens", async function () {
      const { eventChain, mockUSDT, mockCUSD, mockGDollar } = await loadFixture(
        deployEventChainFixture
      );

      expect(await eventChain.supportedTokens(ethers.ZeroAddress)).to.be.true; // CELO
      expect(await eventChain.supportedTokens(mockUSDT.target)).to.be.true;
      expect(await eventChain.supportedTokens(mockCUSD.target)).to.be.true;
      expect(await eventChain.supportedTokens(mockGDollar.target)).to.be.true;
    });

    it("Should have correct contract constants", async function () {
      const { eventChain } = await loadFixture(deployEventChainFixture);

      expect(await eventChain.MAX_NAME_LENGTH()).to.equal(100);
      expect(await eventChain.MAX_ATTENDEES()).to.equal(5000);
      expect(await eventChain.MIN_EVENT_DURATION()).to.equal(3600); // 1 hour
      expect(await eventChain.REFUND_BUFFER()).to.equal(18000); // 5 hours
    });
  });

  describe("Event Creation", function () {
    it("Should create event with valid parameters", async function () {
      const { eventChain, mockCUSD, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const tx = await eventChain.createEvent(
        "Test Event",
        "https://example.com/image.jpg",
        "This is a test event description",
        futureTime,
        endTime,
        1200, // 12:00 PM
        1600, // 4:00 PM
        "Virtual Event Location",
        ethers.parseEther("10"), // 10 tokens
        18,
        mockCUSD.target
      );

      await expect(tx)
        .to.emit(eventChain, "EventCreated")
        .withArgs(0, owner.address, "Test Event");

      const eventLength = await eventChain.getEventLength();
      expect(eventLength).to.equal(1);

      const event = await eventChain.events(0);
      expect(event.owner).to.equal(owner.address);
      expect(event.eventName).to.equal("Test Event");
      expect(event.ticketPrice).to.equal(ethers.parseEther("10"));
      expect(event.isActive).to.be.true;
      expect(event.paymentToken).to.equal(mockCUSD.target);
    });

    it("Should reject event creation with invalid parameters", async function () {
      const { eventChain, mockCUSD, futureTime, endTime, currentTime } =
        await loadFixture(deployEventChainFixture);

      // Empty name
      await expect(
        eventChain.createEvent(
          "",
          "url",
          "details",
          futureTime,
          endTime,
          1200,
          1600,
          "location",
          ethers.parseEther("10"),
          18,
          mockCUSD.target
        )
      ).to.be.revertedWith("Invalid name");

      // Name too long
      const longName = "a".repeat(101);
      await expect(
        eventChain.createEvent(
          longName,
          "url",
          "details",
          futureTime,
          endTime,
          1200,
          1600,
          "location",
          ethers.parseEther("10"),
          18,
          mockCUSD.target
        )
      ).to.be.revertedWith("Invalid name");

      // Past start date
      await expect(
        eventChain.createEvent(
          "Event",
          "url",
          "details",
          currentTime - 1000,
          endTime,
          1200,
          1600,
          "location",
          ethers.parseEther("10"),
          18,
          mockCUSD.target
        )
      ).to.be.revertedWith("Start date must be future");

      // Duration too short
      await expect(
        eventChain.createEvent(
          "Event",
          "url",
          "details",
          futureTime,
          futureTime + 1800,
          1200,
          1600,
          "location",
          ethers.parseEther("10"),
          18,
          mockCUSD.target
        )
      ).to.be.revertedWith("Duration too short");

      // Unsupported token
      await expect(
        eventChain.createEvent(
          "Event",
          "url",
          "details",
          futureTime,
          endTime,
          1200,
          1600,
          "location",
          ethers.parseEther("10"),
          18,
          ethers.ZeroAddress.slice(0, -1) + "1"
        )
      ).to.be.revertedWith("Unsupported token");
    });
  });

  describe("Ticket Purchasing with CELO", function () {
    it("Should allow ticket purchase with CELO", async function () {
      const { eventChain, user1, futureTime, endTime } = await loadFixture(
        deployEventChainFixture
      );

      const ticketPrice = ethers.parseEther("1");

      // Create event with CELO payment
      await eventChain.createEvent(
        "CELO Event",
        "https://example.com/image.jpg",
        "CELO payment event",
        futureTime,
        endTime,
        1200,
        1600,
        "Virtual Location",
        ticketPrice,
        18,
        ethers.ZeroAddress // CELO
      );

      const initialBalance = await ethers.provider.getBalance(user1.address);

      const tx = await eventChain
        .connect(user1)
        .buyTicket(0, { value: ticketPrice });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        // .to.emit(eventChain, "TicketPurchased")
        .to.emit(eventChain, "TicketPurchased(uint256,address,uint256,address)")
        .withArgs(0, user1.address, ticketPrice, ethers.ZeroAddress);

      // Verify ticket purchase state
      expect(await eventChain.hasPurchasedTicket(0, user1.address)).to.be.true;

      // Verify CELO balance change (account for gas)
      const finalBalance = await ethers.provider.getBalance(user1.address);
      const expectedBalance = initialBalance - ticketPrice - gasUsed;
      expect(finalBalance).to.equal(expectedBalance);

      // Verify contract holds CELO funds
      expect(await eventChain.celoFundsHeld(0)).to.equal(ticketPrice);
    });

    it("Should reject incorrect CELO amount", async function () {
      const { eventChain, user1, futureTime, endTime } = await loadFixture(
        deployEventChainFixture
      );

      const ticketPrice = ethers.parseEther("1");

      await eventChain.createEvent(
        "CELO Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        ethers.ZeroAddress
      );

      await expect(
        eventChain
          .connect(user1)
          .buyTicket(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect CELO amount");
    });
  });

  describe("Ticket Purchasing with ERC20 Tokens", function () {
    it("Should allow ticket purchase with cUSD", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "cUSD Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Approve tokens
      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);

      const initialBalance = await mockCUSD.balanceOf(user1.address);

      const tx = await eventChain.connect(user1).buyTicket(0);

      await expect(tx)
        // .to.emit(eventChain, "TicketPurchased")
        .to.emit(eventChain, "TicketPurchased(uint256,address,uint256,address)")
        .withArgs(0, user1.address, ticketPrice, mockCUSD.target);

      // Verify token transfer
      const finalBalance = await mockCUSD.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - ticketPrice);

      // Verify event funds
      const event = await eventChain.events(0);
      expect(event.fundsHeld).to.equal(ticketPrice);
    });

    it("Should handle USDT with correct decimals", async function () {
      const { eventChain, mockUSDT, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10"); // 10 in 18 decimals
      const usdtPrice = ethers.parseUnits("10", 6); // 10 in 6 decimals

      await eventChain.createEvent(
        "USDT Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        6,
        mockUSDT.target
      );

      await mockUSDT.connect(user1).approve(eventChain.target, usdtPrice);

      const initialBalance = await mockUSDT.balanceOf(user1.address);

      await eventChain.connect(user1).buyTicket(0);

      // Verify USDT transfer (6 decimals)
      const finalBalance = await mockUSDT.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - usdtPrice);

      // Verify event funds (stored in 6 decimals)
      const event = await eventChain.events(0);
      expect(event.fundsHeld).to.equal(usdtPrice);
    });

    it("Should reject purchase without sufficient allowance", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Don't approve tokens
      await expect(eventChain.connect(user1).buyTicket(0)).to.be.revertedWith(
        "Insufficient allowance"
      );
    });
  });

  describe("Event Validation and Edge Cases", function () {
    it("Should prevent double ticket purchase", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      await mockCUSD
        .connect(user1)
        .approve(eventChain.target, ticketPrice * 2n);

      // First purchase should succeed
      await eventChain.connect(user1).buyTicket(0);

      // Second purchase should fail
      await expect(eventChain.connect(user1).buyTicket(0)).to.be.revertedWith(
        "Already purchased"
      );
    });

    it("Should reject purchase for expired event", async function () {
      const { eventChain, mockCUSD, user1, currentTime } = await loadFixture(
        deployEventChainFixture
      );

      const pastTime = currentTime - 1000;

      const futureTime = currentTime + 86400; // 24 hours from now (START)
      const endTime = futureTime + 7200; // 2 hours after start (END)
      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Past Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Time travel PAST the event end time to make it expired
      await time.increaseTo(endTime + 1);

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);

      await expect(eventChain.connect(user1).buyTicket(0)).to.be.revertedWith(
        "Event expired"
      );
    });

    it("Should reject purchase for inactive event", async function () {
      const { eventChain, mockCUSD, user1, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Cancel event
      await eventChain.connect(owner).cancelEvent(0);

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);

      await expect(eventChain.connect(user1).buyTicket(0)).to.be.revertedWith(
        "Event inactive"
      );
    });
  });

  describe("Refund Functionality", function () {
    it("Should allow refund for canceled event", async function () {
      const { eventChain, mockCUSD, user1, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Purchase ticket
      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      const balanceAfterPurchase = await mockCUSD.balanceOf(user1.address);

      // Cancel event
      await eventChain.connect(owner).cancelEvent(0);

      // Request refund
      const tx = await eventChain.connect(user1).requestRefund(0);

      await expect(tx)
        .to.emit(eventChain, "RefundIssued")
        .withArgs(0, user1.address, ticketPrice);

      // Verify refund
      const finalBalance = await mockCUSD.balanceOf(user1.address);
      expect(finalBalance).to.equal(balanceAfterPurchase + ticketPrice);

      // Verify ticket status
      expect(await eventChain.hasPurchasedTicket(0, user1.address)).to.be.false;
    });

    it("Should allow refund before refund buffer period", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      // Event starts in 24 hours, refund buffer is 5 hours
      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      const balanceAfterPurchase = await mockCUSD.balanceOf(user1.address);

      // Advance time but still within refund window (18 hours before event)
      await time.increase(3600); // 1 hour

      await eventChain.connect(user1).requestRefund(0);

      const finalBalance = await mockCUSD.balanceOf(user1.address);
      expect(finalBalance).to.equal(balanceAfterPurchase + ticketPrice);
    });

    it("Should reject refund after buffer period", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      // Advance time past refund buffer (event starts in 24h, buffer is 5h)
      await time.increase(86400 - 18000 + 1); // Just past the buffer

      await expect(
        eventChain.connect(user1).requestRefund(0)
      ).to.be.revertedWith("Refund period ended");
    });

    it("Should handle CELO refunds correctly", async function () {
      const { eventChain, user1, futureTime, endTime } = await loadFixture(
        deployEventChainFixture
      );

      const ticketPrice = ethers.parseEther("1");

      await eventChain.createEvent(
        "CELO Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        ethers.ZeroAddress
      );

      // Purchase ticket with CELO
      await eventChain.connect(user1).buyTicket(0, { value: ticketPrice });

      const balanceAfterPurchase = await ethers.provider.getBalance(
        user1.address
      );

      // Cancel event for refund
      await eventChain.cancelEvent(0);

      // Request refund
      const tx = await eventChain.connect(user1).requestRefund(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Verify CELO refund (account for gas costs)
      const finalBalance = await ethers.provider.getBalance(user1.address);
      const expectedBalance = balanceAfterPurchase + ticketPrice - gasUsed;
      expect(finalBalance).to.equal(expectedBalance);
    });
  });

  describe("Fund Release", function () {
    it("Should release funds to event owner after event ends", async function () {
      const { eventChain, mockCUSD, user1, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // User purchases ticket
      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      const ownerInitialBalance = await mockCUSD.balanceOf(owner.address);

      // Advance time past event end
      await time.increaseTo(endTime + 1);

      // Release funds
      const tx = await eventChain.connect(owner).releaseFunds(0);

      await expect(tx)
        .to.emit(eventChain, "FundsReleased")
        .withArgs(0, ticketPrice);

      // Verify fund transfer
      const ownerFinalBalance = await mockCUSD.balanceOf(owner.address);
      expect(ownerFinalBalance).to.equal(ownerInitialBalance + ticketPrice);

      // Verify funds released flag
      const event = await eventChain.events(0);
      expect(event.fundsReleased).to.be.true;
    });

    it("Should reject fund release before event ends", async function () {
      const { eventChain, mockCUSD, user1, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      await expect(
        eventChain.connect(owner).releaseFunds(0)
      ).to.be.revertedWith("Event has not ended yet");
    });

    it("Should reject fund release by non-owner", async function () {
      const { eventChain, mockCUSD, user1, user2, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      await eventChain.createEvent(
        "Test Event",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      await time.increaseTo(endTime + 1);

      await expect(
        eventChain.connect(user2).releaseFunds(0)
      ).to.be.revertedWith("Not event owner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct event details", async function () {
      const { eventChain, mockCUSD, user1, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");
      const eventName = "Test Event";

      await eventChain.createEvent(
        eventName,
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Purchase ticket to test attendees
      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      const [eventDetails, attendees, creatorEvents] =
        await eventChain.getEventById(0);

      expect(eventDetails.owner).to.equal(owner.address);
      expect(eventDetails.eventName).to.equal(eventName);
      expect(eventDetails.ticketPrice).to.equal(ticketPrice);
      expect(attendees).to.deep.equal([user1.address]);
      expect(creatorEvents.length).to.equal(1);
    });

    it("Should return correct user events", async function () {
      const { eventChain, mockCUSD, user1, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      // Create two events
      await eventChain.createEvent(
        "Event 1",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );
      await eventChain.createEvent(
        "Event 2",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // User purchases ticket for first event only
      await mockCUSD.connect(user1).approve(eventChain.target, ticketPrice);
      await eventChain.connect(user1).buyTicket(0);

      const [eventIds, userEvents] = await eventChain
        .connect(user1)
        .getUserEvents();

      expect(eventIds.length).to.equal(1n);
      expect(eventIds[0]).to.equal(0);
      expect(userEvents[0].eventName).to.equal("Event 1");
    });

    it("Should return correct active events", async function () {
      const { eventChain, mockCUSD, owner, futureTime, endTime } =
        await loadFixture(deployEventChainFixture);

      const ticketPrice = ethers.parseEther("10");

      // Create two events
      await eventChain.createEvent(
        "Event 1",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );
      await eventChain.createEvent(
        "Event 2",
        "url",
        "details",
        futureTime,
        endTime,
        1200,
        1600,
        "location",
        ticketPrice,
        18,
        mockCUSD.target
      );

      // Cancel first event
      await eventChain.connect(owner).cancelEvent(0);

      const [eventIds, activeEvents] = await eventChain.getAllEvents();

      expect(eventIds.length).to.equal(1);
      expect(eventIds[0]).to.equal(1n);
      expect(activeEvents[0].eventName).to.equal("Event 2");
    });
  });
});

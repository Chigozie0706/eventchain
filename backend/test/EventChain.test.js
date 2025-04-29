const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EventChain", function () {
  let EventChain;
  let eventChain;
  let owner, attendee1, attendee2, attendee3;
  let token1, token2;

  before(async function () {
    [owner, attendee1, attendee2, attendee3] = await ethers.getSigners();

    // Deploy mock ERC20 tokens for testing
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    token1 = await ERC20Mock.deploy(
      "Test Token 1",
      "TT1",
      owner.address,
      ethers.parseEther("1000000")
    );
    token2 = await ERC20Mock.deploy(
      "Test Token 2",
      "TT2",
      owner.address,
      ethers.parseEther("1000000")
    );

    // Wait for deployments to complete
    await token1.waitForDeployment();
    await token2.waitForDeployment();

    // Deploy EventChain contract
    EventChain = await ethers.getContractFactory("EventChain");
    eventChain = await EventChain.deploy([
      await token1.getAddress(),
      await token2.getAddress(),
    ]);
    await eventChain.waitForDeployment();

    // Distribute tokens to attendees for testing
    await token1.transfer(attendee1.address, ethers.parseEther("1000"));
    await token1.transfer(attendee2.address, ethers.parseEther("1000"));
    await token1.transfer(attendee3.address, ethers.parseEther("1000"));
    await token2.transfer(attendee1.address, ethers.parseEther("1000"));
  });

  describe("Initialization", function () {
    it("Should initialize with supported tokens", async function () {
      expect(await eventChain.supportedTokens(token1.address)).to.be.true;
      expect(await eventChain.supportedTokens(token2.address)).to.be.true;
    });

    it("Should have correct constants", async function () {
      expect(await eventChain.MAX_NAME_LENGTH()).to.equal(100);
      expect(await eventChain.MAX_URL_LENGTH()).to.equal(200);
      expect(await eventChain.MAX_TICKET_PRICE()).to.equal(
        ethers.utils.parseEther("1000000")
      );
      expect(await eventChain.MAX_ATTENDEES()).to.equal(5000);
    });
  });

  describe("Event Creation", function () {
    it("Should create a new event", async function () {
      const startDate = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const endDate = startDate + 86400; // 2 days from now

      await expect(
        eventChain.connect(owner).createEvent(
          "Test Event",
          "https://example.com/image.jpg",
          "This is a test event description",
          startDate,
          endDate,
          3600, // 1 hour
          7200, // 2 hours
          "Virtual Event",
          ethers.utils.parseEther("10"),
          token1.address
        )
      ).to.emit(eventChain, "EventCreated");

      const eventCount = await eventChain.getEventLength();
      expect(eventCount).to.equal(1);

      const [event] = await eventChain.getEventById(0);
      expect(event.eventName).to.equal("Test Event");
      expect(event.owner).to.equal(owner.address);
      expect(event.paymentToken).to.equal(token1.address);
    });

    it("Should fail with invalid parameters", async function () {
      const startDate = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        eventChain.connect(owner).createEvent(
          "", // Empty name
          "https://example.com/image.jpg",
          "Description",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Location",
          ethers.utils.parseEther("10"),
          token1.address
        )
      ).to.be.revertedWith("Invalid name");

      await expect(
        eventChain.connect(owner).createEvent(
          "Test Event",
          "https://example.com/image.jpg",
          "Description",
          startDate,
          startDate + 3600, // Less than MIN_EVENT_DURATION
          3600,
          7200,
          "Location",
          ethers.utils.parseEther("10"),
          token1.address
        )
      ).to.be.revertedWith("Duration too short");

      await expect(
        eventChain.connect(owner).createEvent(
          "Test Event",
          "https://example.com/image.jpg",
          "Description",
          startDate - 86400, // Past date
          startDate,
          3600,
          7200,
          "Location",
          ethers.utils.parseEther("10"),
          token1.address
        )
      ).to.be.revertedWith("Start date must be future");

      await expect(
        eventChain.connect(owner).createEvent(
          "Test Event",
          "https://example.com/image.jpg",
          "Description",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Location",
          ethers.utils.parseEther("1000001"), // Exceeds MAX_TICKET_PRICE
          token1.address
        )
      ).to.be.revertedWith("Invalid price");

      await expect(
        eventChain.connect(owner).createEvent(
          "Test Event",
          "https://example.com/image.jpg",
          "Description",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Location",
          ethers.utils.parseEther("10"),
          ethers.constants.AddressZero // Invalid token
        )
      ).to.be.revertedWith("Invalid token");
    });
  });

  describe("Ticket Purchasing", function () {
    it("Should allow purchasing a ticket", async function () {
      // Approve token transfer first
      await token1
        .connect(attendee1)
        .approve(eventChain.address, ethers.utils.parseEther("10"));

      await expect(eventChain.connect(attendee1).buyTicket(0))
        .to.emit(eventChain, "TicketPurchased")
        .withArgs(
          0,
          attendee1.address,
          ethers.utils.parseEther("10"),
          token1.address
        );

      const [event, attendees] = await eventChain.getEventById(0);
      expect(attendees.length).to.equal(1);
      expect(attendees[0]).to.equal(attendee1.address);
      expect(event.fundsHeld).to.equal(ethers.utils.parseEther("10"));
      expect(await eventChain.hasPurchasedTicket(0, attendee1.address)).to.be
        .true;
    });

    it("Should fail when purchasing multiple tickets for same event", async function () {
      await token1
        .connect(attendee1)
        .approve(eventChain.address, ethers.utils.parseEther("10"));
      await expect(
        eventChain.connect(attendee1).buyTicket(0)
      ).to.be.revertedWith("Already purchased");
    });

    it("Should fail with insufficient allowance", async function () {
      await expect(
        eventChain.connect(attendee2).buyTicket(0)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Should fail when event is at capacity", async function () {
      // Create a new event with max attendees = 5 for testing
      const startDate = Math.floor(Date.now() / 1000) + 86400;

      await eventChain
        .connect(owner)
        .createEvent(
          "Small Event",
          "https://example.com/image.jpg",
          "Small capacity event",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Virtual",
          ethers.utils.parseEther("1"),
          token1.address
        );

      // Buy tickets until capacity is reached
      for (let i = 0; i < 5; i++) {
        const attendee = await ethers.getSigner(i + 2); // Skip owner and attendee1
        await token1
          .connect(attendee)
          .approve(eventChain.address, ethers.utils.parseEther("1"));
        await eventChain.connect(attendee).buyTicket(1);
      }

      // Next purchase should fail
      const newAttendee = await ethers.getSigner(7);
      await token1
        .connect(newAttendee)
        .approve(eventChain.address, ethers.utils.parseEther("1"));
      await expect(
        eventChain.connect(newAttendee).buyTicket(1)
      ).to.be.revertedWith("Event at capacity");
    });
  });

  describe("Refunds", function () {
    it("Should allow refund before event starts", async function () {
      await token1
        .connect(attendee1)
        .approve(eventChain.address, ethers.utils.parseEther("10"));
      await eventChain.connect(attendee1).buyTicket(0);

      const initialBalance = await token1.balanceOf(attendee1.address);

      await expect(eventChain.connect(attendee1).requestRefund(0))
        .to.emit(eventChain, "RefundIssued")
        .withArgs(0, attendee1.address, ethers.utils.parseEther("10"));

      const finalBalance = await token1.balanceOf(attendee1.address);
      expect(finalBalance.sub(initialBalance)).to.equal(
        ethers.utils.parseEther("10")
      );

      const [event, attendees] = await eventChain.getEventById(0);
      expect(attendees.length).to.equal(0);
      expect(event.fundsHeld).to.equal(0);
      expect(await eventChain.hasPurchasedTicket(0, attendee1.address)).to.be
        .false;
    });

    it("Should allow refund for canceled event", async function () {
      // Create a new event
      const startDate = Math.floor(Date.now() / 1000) + 86400;

      await eventChain
        .connect(owner)
        .createEvent(
          "Cancelable Event",
          "https://example.com/image.jpg",
          "Event to be canceled",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Virtual",
          ethers.utils.parseEther("5"),
          token1.address
        );

      // Purchase ticket
      await token1
        .connect(attendee2)
        .approve(eventChain.address, ethers.utils.parseEther("5"));
      await eventChain.connect(attendee2).buyTicket(2);

      // Cancel event
      await eventChain.connect(owner).cancelEvent(2);

      // Request refund
      const initialBalance = await token1.balanceOf(attendee2.address);
      await expect(eventChain.connect(attendee2).requestRefund(2)).to.emit(
        eventChain,
        "RefundIssued"
      );

      const finalBalance = await token1.balanceOf(attendee2.address);
      expect(finalBalance.sub(initialBalance)).to.equal(
        ethers.utils.parseEther("5")
      );
    });

    it("Should fail refund after refund period", async function () {
      // Create an event starting soon
      const startDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      await eventChain
        .connect(owner)
        .createEvent(
          "Imminent Event",
          "https://example.com/image.jpg",
          "Event starting soon",
          startDate,
          startDate + 3600,
          3600,
          7200,
          "Virtual",
          ethers.utils.parseEther("3"),
          token1.address
        );

      // Purchase ticket
      await token1
        .connect(attendee3)
        .approve(eventChain.address, ethers.utils.parseEther("3"));
      await eventChain.connect(attendee3).buyTicket(3);

      // Try to refund - should fail because we're within refund buffer
      await expect(
        eventChain.connect(attendee3).requestRefund(3)
      ).to.be.revertedWith("Refund period ended");
    });
  });

  describe("Funds Release", function () {
    it("Should release funds to event owner after event ends", async function () {
      // Create an event that's already ended
      const startDate = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
      const endDate = startDate + 3600; // Ended 23 hours ago

      await eventChain
        .connect(owner)
        .createEvent(
          "Past Event",
          "https://example.com/image.jpg",
          "Event that has ended",
          startDate,
          endDate,
          3600,
          7200,
          "Virtual",
          ethers.utils.parseEther("7"),
          token1.address
        );

      // Purchase ticket
      await token1
        .connect(attendee1)
        .approve(eventChain.address, ethers.utils.parseEther("7"));
      await eventChain.connect(attendee1).buyTicket(4);

      const initialBalance = await token1.balanceOf(owner.address);

      await expect(eventChain.connect(owner).releaseFunds(4))
        .to.emit(eventChain, "FundsReleased")
        .withArgs(4, ethers.utils.parseEther("7"));

      const finalBalance = await token1.balanceOf(owner.address);
      expect(finalBalance.sub(initialBalance)).to.equal(
        ethers.utils.parseEther("7")
      );

      const [event] = await eventChain.getEventById(4);
      expect(event.fundsHeld).to.equal(0);
      expect(event.fundsReleased).to.be.true;
    });

    it("Should fail to release funds before event ends", async function () {
      await expect(
        eventChain.connect(owner).releaseFunds(0)
      ).to.be.revertedWith("Event has not ended yet");
    });

    it("Should fail to release funds for canceled event", async function () {
      await eventChain.connect(owner).cancelEvent(0);
      await expect(
        eventChain.connect(owner).releaseFunds(0)
      ).to.be.revertedWith("Cannot release funds for a canceled event");
    });
  });

  describe("View Functions", function () {
    it("Should return events by creator", async function () {
      const events = await eventChain
        .connect(owner)
        .getEventsByCreator(owner.address);
      expect(events.length).to.be.greaterThan(0);
    });

    it("Should return user's purchased events", async function () {
      // Create a new event and purchase ticket
      const startDate = Math.floor(Date.now() / 1000) + 86400;

      await eventChain
        .connect(owner)
        .createEvent(
          "User Event",
          "https://example.com/image.jpg",
          "Event for user testing",
          startDate,
          startDate + 86400,
          3600,
          7200,
          "Virtual",
          ethers.utils.parseEther("2"),
          token1.address
        );

      await token1
        .connect(attendee1)
        .approve(eventChain.address, ethers.utils.parseEther("2"));
      await eventChain.connect(attendee1).buyTicket(5);

      const [ids, events] = await eventChain.connect(attendee1).getUserEvents();
      expect(ids.length).to.equal(1);
      expect(events[0].eventName).to.equal("User Event");
    });

    it("Should return active events", async function () {
      const [ids, events] = await eventChain.getAllEvents();
      expect(ids.length).to.be.greaterThan(0);
      expect(events[0].isActive).to.be.true;
    });

    it("Should return active events by creator", async function () {
      const [ids, events] = await eventChain
        .connect(owner)
        .getActiveEventsByCreator();
      expect(ids.length).to.be.greaterThan(0);
      expect(events[0].owner).to.equal(owner.address);
      expect(events[0].isActive).to.be.true;
    });
  });
});

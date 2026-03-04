// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title EventTicketNFT
 * @dev NFT contract for EventChain ticket issuance
 * Features:
 * - Minted on ticket purchase via EventChain
 * - Burned on refund
 * - Transferred via EventChain transferTicket only
 * - Lazy URI: metadata can be set after mint
 * - Soulbound by default: direct ERC721 transfers blocked
 * - UPGRADEABLE via UUPS proxy pattern
 */
contract EventTicketNFT is
    Initializable,
    ERC721URIStorageUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // ─────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────

    /// @notice The EventChain contract authorized to call this contract
    address public eventChainContract;

    /// @notice Auto-incrementing token ID counter
    uint256 public tokenIdCounter;

    /// @notice Base URI fallback for tokens without individual URI set
    string public baseTokenURI;

    /// @notice tokenId → eventId
    mapping(uint256 => uint256) public ticketEventId;

    /// @notice eventId → attendee address → tokenId
    /// @dev tokenId 0 is valid so we use a separate existence check
    mapping(uint256 => mapping(address => uint256)) public attendeeTokenId;

    /// @notice eventId → attendee address → whether they have a token
    mapping(uint256 => mapping(address => bool)) public hasToken;

    // ─────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────

    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed to
    );
    event TicketBurned(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed from
    );
    event TicketTransferred(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed from,
        address to
    );
    event TokenURIUpdated(uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string uri);
    event EventChainContractUpdated(address indexed newContract);

    // ─────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────

    modifier onlyEventChain() {
        require(msg.sender == eventChainContract, "Only EventChain");
        _;
    }

    // ─────────────────────────────────────────────
    // Constructor & Initializer
    // ─────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer for the NFT contract
     * @param _eventChainContract Address of the EventChain contract
     */
    function initialize(address _eventChainContract) public initializer {
        __ERC721_init("EventChain Ticket", "ECTICKET");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        require(
            _eventChainContract != address(0),
            "Invalid EventChain address"
        );
        eventChainContract = _eventChainContract;
    }

    /**
     * @dev Required by UUPS - only owner can authorize upgrades
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    // ─────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Update the authorized EventChain contract address
     * @param _newContract New EventChain contract address
     */
    function setEventChainContract(address _newContract) external onlyOwner {
        require(_newContract != address(0), "Invalid address");
        eventChainContract = _newContract;
        emit EventChainContractUpdated(_newContract);
    }

    /**
     * @notice Set base URI for all tokens without individual URI set
     * @param _uri Base URI string e.g. "ipfs://cid/"
     */
    function setBaseURI(string calldata _uri) external onlyOwner {
        baseTokenURI = _uri;
        emit BaseURIUpdated(_uri);
    }

    /**
     * @notice Allow owner to set token URI for any token directly
     * @param _tokenId Token ID to update
     * @param _tokenURI New metadata URI
     */
    function adminSetTokenURI(
        uint256 _tokenId,
        string calldata _tokenURI
    ) external onlyOwner {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        require(bytes(_tokenURI).length > 0, "Empty URI");
        _setTokenURI(_tokenId, _tokenURI);
        emit TokenURIUpdated(_tokenId, _tokenURI);
    }

    // ─────────────────────────────────────────────
    // EventChain-only Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Mint a ticket NFT to a buyer
     * @dev Called by EventChain on ticket purchase. URI is empty initially (lazy).
     * @param _to Buyer address
     * @param _eventId Event ID the ticket belongs to
     * @return tokenId The minted token ID
     */
    function mintTicket(
        address _to,
        uint256 _eventId
    ) external onlyEventChain returns (uint256) {
        require(_to != address(0), "Invalid recipient");
        require(!hasToken[_eventId][_to], "Already has ticket NFT");

        uint256 tokenId = tokenIdCounter;
        tokenIdCounter++;

        _safeMint(_to, tokenId);

        ticketEventId[tokenId] = _eventId;
        attendeeTokenId[_eventId][_to] = tokenId;
        hasToken[_eventId][_to] = true;

        emit TicketMinted(tokenId, _eventId, _to);
        return tokenId;
    }

    /**
     * @notice Burn a ticket NFT on refund
     * @dev Called by EventChain when user requests refund
     * @param _eventId Event ID
     * @param _from Address of the ticket holder
     */
    function burnTicket(
        uint256 _eventId,
        address _from
    ) external onlyEventChain {
        require(hasToken[_eventId][_from], "No ticket NFT found");

        uint256 tokenId = attendeeTokenId[_eventId][_from];

        delete attendeeTokenId[_eventId][_from];
        delete hasToken[_eventId][_from];
        delete ticketEventId[tokenId];

        // _burn is overridden by ERC721URIStorageUpgradeable to also clean up URI storage
        _burn(tokenId);

        emit TicketBurned(tokenId, _eventId, _from);
    }

    /**
     * @notice Transfer a ticket NFT from one address to another
     * @dev Called by EventChain transferTicket function only
     * @param _eventId Event ID
     * @param _from Current ticket holder
     * @param _to New ticket holder
     */
    function transferTicket(
        uint256 _eventId,
        address _from,
        address _to
    ) external onlyEventChain {
        require(hasToken[_eventId][_from], "Sender has no ticket NFT");
        require(!hasToken[_eventId][_to], "Recipient already has ticket NFT");
        require(_to != address(0), "Invalid recipient");

        uint256 tokenId = attendeeTokenId[_eventId][_from];

        delete attendeeTokenId[_eventId][_from];
        hasToken[_eventId][_from] = false;

        attendeeTokenId[_eventId][_to] = tokenId;
        hasToken[_eventId][_to] = true;

        _transfer(_from, _to, tokenId);

        emit TicketTransferred(tokenId, _eventId, _from, _to);
    }

    /**
     * @notice Set token URI after mint (lazy metadata)
     * @dev Called by EventChain after IPFS upload completes
     * @param _eventId Event ID
     * @param _holder Address of the ticket holder
     * @param _tokenURI IPFS metadata URI
     */
    function setTicketURI(
        uint256 _eventId,
        address _holder,
        string calldata _tokenURI
    ) external onlyEventChain {
        require(hasToken[_eventId][_holder], "No ticket NFT found");
        require(bytes(_tokenURI).length > 0, "Empty URI");

        uint256 tokenId = attendeeTokenId[_eventId][_holder];
        _setTokenURI(tokenId, _tokenURI);

        emit TokenURIUpdated(tokenId, _tokenURI);
    }

    // ─────────────────────────────────────────────
    // Soulbound: Block Direct ERC721 Transfers
    // ─────────────────────────────────────────────

    /**
     * @dev Block direct transferFrom — must use EventChain.transferTicket
     */
    function transferFrom(
        address,
        address,
        uint256
    ) public pure override(ERC721Upgradeable, IERC721) {
        revert("Use EventChain transferTicket");
    }

    /**
     * @dev Block 4-param safeTransferFrom — must use EventChain.transferTicket
     * @dev The 3-param version is not virtual in this OZ version and cannot be overridden.
     *      It internally calls the 4-param version, so blocking 4-param is sufficient.
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override(ERC721Upgradeable, IERC721) {
        revert("Use EventChain transferTicket");
    }

    // ─────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────

    /**
     * @notice Get the token ID for a specific attendee's ticket
     */
    function getTokenId(
        uint256 _eventId,
        address _holder
    ) external view returns (uint256) {
        require(hasToken[_eventId][_holder], "No ticket NFT found");
        return attendeeTokenId[_eventId][_holder];
    }

    /**
     * @notice Check if an address holds a ticket NFT for an event
     */
    function holdsTicket(
        uint256 _eventId,
        address _holder
    ) external view returns (bool) {
        return hasToken[_eventId][_holder];
    }

    /**
     * @notice Get the event ID a token belongs to
     */
    function getEventForToken(
        uint256 _tokenId
    ) external view returns (uint256) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return ticketEventId[_tokenId];
    }

    // ─────────────────────────────────────────────
    // Required Overrides
    // ─────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        override(ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorageUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Storage gap for future upgrades
     */
    uint256[44] private __gap;
}

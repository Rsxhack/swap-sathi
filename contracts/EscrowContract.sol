// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SwapSathi Escrow Contract
 * @dev Secure P2P crypto trading with INR settlement
 */
contract SwapSathiEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum DealStatus {
        Created,
        Funded,
        PaymentSent,
        Completed,
        Disputed,
        Cancelled
    }

    struct Deal {
        uint256 dealId;
        address buyer;
        address seller;
        address token;
        uint256 amount;
        uint256 inrAmount;
        DealStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        bool sellerConfirmed;
        bool buyerConfirmed;
    }

    mapping(uint256 => Deal) public deals;
    mapping(address => uint256) public userReputation;
    
    uint256 public nextDealId = 1;
    uint256 public constant DEAL_TIMEOUT = 24 hours;
    uint256 public constant DISPUTE_FEE = 0.001 ether; // BNB fee for disputes
    
    address public arbitrator;
    address public feeRecipient;
    uint256 public platformFeePercent = 50; // 0.5%

    event DealCreated(
        uint256 indexed dealId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        uint256 inrAmount
    );
    
    event DealFunded(uint256 indexed dealId, address indexed buyer);
    event PaymentSent(uint256 indexed dealId, address indexed buyer);
    event PaymentConfirmed(uint256 indexed dealId, address indexed seller);
    event DealCompleted(uint256 indexed dealId);
    event DealDisputed(uint256 indexed dealId, address indexed initiator);
    event DealCancelled(uint256 indexed dealId);

    modifier onlyDealParticipant(uint256 _dealId) {
        Deal storage deal = deals[_dealId];
        require(
            msg.sender == deal.buyer || msg.sender == deal.seller,
            "Not authorized"
        );
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator");
        _;
    }

    constructor(address _arbitrator, address _feeRecipient) {
        arbitrator = _arbitrator;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new deal
     */
    function createDeal(
        address _seller,
        address _token,
        uint256 _amount,
        uint256 _inrAmount
    ) external returns (uint256) {
        require(_seller != msg.sender, "Cannot trade with yourself");
        require(_amount > 0, "Amount must be greater than 0");
        require(_inrAmount > 0, "INR amount must be greater than 0");

        uint256 dealId = nextDealId++;
        
        deals[dealId] = Deal({
            dealId: dealId,
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            inrAmount: _inrAmount,
            status: DealStatus.Created,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + DEAL_TIMEOUT,
            sellerConfirmed: false,
            buyerConfirmed: false
        });

        emit DealCreated(dealId, msg.sender, _seller, _token, _amount, _inrAmount);
        return dealId;
    }

    /**
     * @dev Buyer funds the escrow
     */
    function fundDeal(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.buyer == msg.sender, "Only buyer can fund");
        require(deal.status == DealStatus.Created, "Deal not in created state");
        require(block.timestamp <= deal.expiresAt, "Deal expired");

        // Transfer tokens to escrow
        IERC20(deal.token).safeTransferFrom(msg.sender, address(this), deal.amount);
        
        deal.status = DealStatus.Funded;
        emit DealFunded(_dealId, msg.sender);
    }

    /**
     * @dev Buyer confirms INR payment sent
     */
    function confirmPaymentSent(uint256 _dealId) external {
        Deal storage deal = deals[_dealId];
        require(deal.buyer == msg.sender, "Only buyer can confirm payment");
        require(deal.status == DealStatus.Funded, "Deal not funded");
        
        deal.status = DealStatus.PaymentSent;
        deal.buyerConfirmed = true;
        emit PaymentSent(_dealId, msg.sender);
    }

    /**
     * @dev Seller confirms INR payment received
     */
    function confirmPaymentReceived(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.seller == msg.sender, "Only seller can confirm");
        require(deal.status == DealStatus.PaymentSent, "Payment not sent");
        
        deal.sellerConfirmed = true;
        
        // Calculate platform fee
        uint256 fee = (deal.amount * platformFeePercent) / 10000;
        uint256 sellerAmount = deal.amount - fee;
        
        // Transfer tokens to seller
        IERC20(deal.token).safeTransfer(deal.seller, sellerAmount);
        
        // Transfer fee to platform
        if (fee > 0) {
            IERC20(deal.token).safeTransfer(feeRecipient, fee);
        }
        
        deal.status = DealStatus.Completed;
        
        // Update reputation
        userReputation[deal.buyer]++;
        userReputation[deal.seller]++;
        
        emit PaymentConfirmed(_dealId, msg.sender);
        emit DealCompleted(_dealId);
    }

    /**
     * @dev Initiate dispute
     */
    function initiateDispute(uint256 _dealId) external payable onlyDealParticipant(_dealId) {
        require(msg.value >= DISPUTE_FEE, "Insufficient dispute fee");
        
        Deal storage deal = deals[_dealId];
        require(
            deal.status == DealStatus.Funded || deal.status == DealStatus.PaymentSent,
            "Cannot dispute at this stage"
        );
        
        deal.status = DealStatus.Disputed;
        emit DealDisputed(_dealId, msg.sender);
    }

    /**
     * @dev Arbitrator resolves dispute
     */
    function resolveDispute(
        uint256 _dealId,
        bool _favorBuyer
    ) external onlyArbitrator nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.status == DealStatus.Disputed, "Deal not disputed");
        
        if (_favorBuyer) {
            // Refund to buyer
            IERC20(deal.token).safeTransfer(deal.buyer, deal.amount);
        } else {
            // Release to seller
            uint256 fee = (deal.amount * platformFeePercent) / 10000;
            uint256 sellerAmount = deal.amount - fee;
            
            IERC20(deal.token).safeTransfer(deal.seller, sellerAmount);
            if (fee > 0) {
                IERC20(deal.token).safeTransfer(feeRecipient, fee);
            }
        }
        
        deal.status = DealStatus.Completed;
        emit DealCompleted(_dealId);
    }

    /**
     * @dev Cancel deal (only if not funded)
     */
    function cancelDeal(uint256 _dealId) external onlyDealParticipant(_dealId) {
        Deal storage deal = deals[_dealId];
        require(deal.status == DealStatus.Created, "Cannot cancel funded deal");
        
        deal.status = DealStatus.Cancelled;
        emit DealCancelled(_dealId);
    }

    /**
     * @dev Emergency refund for expired deals
     */
    function emergencyRefund(uint256 _dealId) external nonReentrant {
        Deal storage deal = deals[_dealId];
        require(deal.buyer == msg.sender, "Only buyer can refund");
        require(deal.status == DealStatus.Funded, "Deal not funded");
        require(block.timestamp > deal.expiresAt + 1 hours, "Deal not expired enough");
        
        IERC20(deal.token).safeTransfer(deal.buyer, deal.amount);
        deal.status = DealStatus.Cancelled;
        emit DealCancelled(_dealId);
    }

    /**
     * @dev Get deal details
     */
    function getDeal(uint256 _dealId) external view returns (Deal memory) {
        return deals[_dealId];
    }

    /**
     * @dev Update platform fee (only arbitrator)
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyArbitrator {
        require(_newFeePercent <= 500, "Fee too high"); // Max 5%
        platformFeePercent = _newFeePercent;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IEngagementRewards
 * @dev Interface for GoodDollar Engagement Rewards contract
 * @notice This interface allows apps to claim rewards for users
 */
interface IEngagementRewards {
    /**
     * @notice Basic claim function for apps
     * @param user Address of the user claiming rewards
     * @param inviter Address of the user who invited (can be address(0))
     * @param validUntilBlock Block number until signature is valid
     * @param signature User's signature (required for first-time registration)
     * @return success Whether the claim was successful
     */
    function appClaim(
        address user,
        address inviter,
        uint256 validUntilBlock,
        bytes memory signature
    ) external returns (bool success);

    /**
     * @notice Advanced claim with custom reward percentages
     * @param user Address of the user claiming rewards
     * @param inviter Address of the user who invited (can be address(0))
     * @param validUntilBlock Block number until signature is valid
     * @param signature User's signature (required for first-time registration)
     * @param userAndInviterPercentage Percentage of reward for user+inviter combined
     * @param userPercentage Percentage of reward for user alone
     * @return success Whether the claim was successful
     */
    function appClaim(
        address user,
        address inviter,
        uint256 validUntilBlock,
        bytes memory signature,
        uint8 userAndInviterPercentage,
        uint8 userPercentage
    ) external returns (bool success);

    /**
     * @notice Check if user is registered with the app
     * @param app Address of the app contract
     * @param user Address of the user
     * @return registered Whether user is registered
     */
    function isUserRegistered(
        address app,
        address user
    ) external view returns (bool registered);
}

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './GroupInterface.sol';
import '../tools/Ownable.sol';

contract IntersectionGroup is GroupInterface, OwnableMutable
{
	GroupInterface[] public m_subgroups;

	/**
	 * Constructor
	 */
	constructor() public {}

	function setSubGroup(GroupInterface[] calldata _subgroups)
	external onlyOwner
	{
		m_subgroups = _subgroups;
	}
	function viewPermissions(address _user)
	public view returns (bytes1)
	{
		if (m_subgroups.length == 0) return bytes1(0);

		bytes1 permissions = 0xFF; //bytes1(-1);
		for (uint256 i = 0; i < m_subgroups.length; ++i)
		{
			permissions = permissions & m_subgroups[i].viewPermissions(_user);
		}
		return permissions;
	}
}
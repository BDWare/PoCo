pragma solidity ^0.5.10;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../tools/ENSTools.sol";
import "../tools/Once.sol";

contract Dataset is Ownable, Once, ENSTools
{
	/**
	 * Members
	 */
	string  public m_datasetName;
	bytes   public m_datasetMultiaddr;
	bytes32 public m_datasetChecksum;

	/**
	 * Constructor
	 */
	function setup(
		address          _datasetOwner,
		string  calldata _datasetName,
		bytes   calldata _datasetMultiaddr,
		bytes32          _datasetChecksum)
	external onlyOnce()
	{
		_transferOwnership(_datasetOwner);
		m_datasetName      = _datasetName;
		m_datasetMultiaddr = _datasetMultiaddr;
		m_datasetChecksum  = _datasetChecksum;
	}

	function registerENS(ENSRegistry ens, string calldata name)
	external onlyOwner()
	{
		_reverseRegistration(ens, name);
	}

	function transferOwnership(address) public { revert("disabled"); }

}

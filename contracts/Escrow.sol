pragma solidity ^0.5.8;
pragma experimental ABIEncoderV2;

import "iexec-solidity/contracts/ERC20_Token/IERC20.sol";
import "iexec-solidity/contracts/Libs/SafeMath.sol";

import "./libs/IexecODBLibCore.sol";

contract Escrow
{
	using SafeMath for uint256;

	/**
	 * Escrow content
	 */
	mapping(address => IexecODBLibCore.Account) m_accounts;

	uint256 internal constant nRLCtoWei = 10 ** 9;

	/**
	 * Events
	 */
	event Deposit   (address owner, uint256 amount);
	event DepositFor(address owner, uint256 amount, address target);
	event Withdraw  (address owner, uint256 amount);
	event Reward    (address user,  uint256 amount, bytes32 ref);
	event Seize     (address user,  uint256 amount, bytes32 ref);
	event Lock      (address user,  uint256 amount);
	event Unlock    (address user,  uint256 amount);

	/**
	 * Constructor
	 */
	constructor()
	public
	{
	}

	/**
	 * Accessor
	 */
	function viewAccount(address _user)
	external view returns (IexecODBLibCore.Account memory account)
	{
		return m_accounts[_user];
	}

	/**
	 * Wallet methods: public
	 */
	function ()
	external payable
	{
		_deposit     (msg.sender, msg.value.div(nRLCtoWei));
		_safeTransfer(msg.sender, msg.value.mod(nRLCtoWei));
		emit Deposit(msg.sender, msg.value.div(nRLCtoWei));
	}

	function deposit()
	external payable returns (bool)
	{
		_deposit     (msg.sender, msg.value.div(nRLCtoWei));
		_safeTransfer(msg.sender, msg.value.mod(nRLCtoWei));
		emit Deposit(msg.sender, msg.value.div(nRLCtoWei));
		return true;
	}

	function depositFor(address _target)
	public payable returns (bool)
	{
		require      (_target != address(0));
		_deposit     (_target,    msg.value.div(nRLCtoWei));
		_safeTransfer(msg.sender, msg.value.mod(nRLCtoWei));
		emit DepositFor(msg.sender, msg.value.div(nRLCtoWei), _target);
		return true;
	}

	function depositForArray(uint256[] calldata _amounts, address[] calldata _targets)
	external payable returns (bool)
	{
		require(_amounts.length == _targets.length);
		uint256 remaining = msg.value;
		for (uint i = 0; i < _amounts.length; ++i)
		{
			_deposit(_targets[i], _amounts[i]);
			remaining = remaining.sub(_amounts[i].mul(nRLCtoWei));
			emit DepositFor(msg.sender, _amounts[i], _targets[i]);
		}
		_safeTransfer(msg.sender, remaining);
		return true;
	}

	function _deposit(address _target, uint256 _amount)
	internal
	{
		m_accounts[_target].stake = m_accounts[_target].stake.add(_amount);
	}


	function withdraw(uint256 _amount)
	external returns (bool)
	{
		m_accounts[msg.sender].stake = m_accounts[msg.sender].stake.sub(_amount);
		_safeTransfer(msg.sender, _amount.mul(nRLCtoWei));
		emit Withdraw(msg.sender, _amount);
		return true;
	}

	function _safeTransfer(address payable to, uint256 value)
	internal
	{
		(bool success, ) = to.call.value(value)('');
		require(success, 'native-transfer-failled');
	}

	/**
	 * Wallet methods: Internal
	 */
	function reward(address _user, uint256 _amount, bytes32 _reference) internal /* returns (bool) */
	{
		m_accounts[_user].stake = m_accounts[_user].stake.add(_amount);
		emit Reward(_user, _amount, _reference);
		/* return true; */
	}
	function seize(address _user, uint256 _amount, bytes32 _reference) internal /* returns (bool) */
	{
		m_accounts[_user].locked = m_accounts[_user].locked.sub(_amount);
		emit Seize(_user, _amount, _reference);
		/* return true; */
	}
	function lock(address _user, uint256 _amount) internal /* returns (bool) */
	{
		m_accounts[_user].stake  = m_accounts[_user].stake.sub(_amount);
		m_accounts[_user].locked = m_accounts[_user].locked.add(_amount);
		emit Lock(_user, _amount);
		/* return true; */
	}
	function unlock(address _user, uint256 _amount) internal /* returns (bool) */
	{
		m_accounts[_user].locked = m_accounts[_user].locked.sub(_amount);
		m_accounts[_user].stake  = m_accounts[_user].stake.add(_amount);
		emit Unlock(_user, _amount);
		/* return true; */
	}
}

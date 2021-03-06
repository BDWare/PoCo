pragma solidity ^0.6.0;

import "@iexec/solidity/contracts/ERC1538/ERC1538Module.sol";
import "../Store.sol";


abstract contract DelegateBase is Store, ERC1538Module
{
	modifier onlyScheduler(bytes32 _taskid)
	{
		require(_msgSender() == m_deals[m_tasks[_taskid].dealid].workerpool.owner);
		_;
	}
}

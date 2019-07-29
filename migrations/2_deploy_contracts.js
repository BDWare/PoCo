var RLC                = artifacts.require("rlc-faucet-contract/RLC");
var IexecODBLibOrders  = artifacts.require("IexecODBLibOrders");
var IexecHub           = artifacts.require("IexecHub");
var IexecClerk         = artifacts.require("IexecClerk");
var AppRegistry        = artifacts.require("AppRegistry");
var DatasetRegistry    = artifacts.require("DatasetRegistry");
var WorkerpoolRegistry = artifacts.require("WorkerpoolRegistry");

const fs = require("fs-extra");
const BN = require('bn.js');

module.exports = async function(deployer, network, accounts)
{
	console.log("# web3 version:", web3.version);
	chainid   = await web3.eth.net.getId();
	chaintype = await web3.eth.net.getNetworkType()
	console.log("Chainid is:", chainid);
	console.log("Chaintype is:", chaintype);

	switch (chaintype)
	{
		case "main":
			RLCInstance = await RLC.at("0x607F4C5BB672230e8672085532f7e901544a7375")
			owner = "0x4Bfe09055455Fe06B2fD2f59bA700783CFB3Cc53";
			break;

		case "kovan":
			RLCInstance = await RLC.at("0xc57538846ec405ea25deb00e0f9b29a432d53507")
			owner = "0xabcd1339Ec7e762e639f4887E2bFe5EE8023E23E";
			break;

		case "rinkeby":
			RLCInstance = await RLC.at("0xf1e6ad3a7ef0c86c915f0fedf80ed851809bea90")
			owner = null;
			break;

		case "ropsten":
			RLCInstance = await RLC.at("0x7314dc4d7794b5e7894212ca1556ae8e3de58621")
			owner = "0x4Bfe09055455Fe06B2fD2f59bA700783CFB3Cc53";
			break;

		case "private":
			await deployer.deploy(RLC);
			RLCInstance = await RLC.deployed();
			console.log("RLC deployed at address: " + RLCInstance.address);
			owner = await RLCInstance.owner.call()
			console.log("RLC faucet wallet is " + owner);
			supply = await RLCInstance.balanceOf(owner);
			console.log("RLC faucet supply is " + supply);

			break;

		default:
			console.log("[ERROR] Migration to chaintype " + chaintype + " is not configured");
			return 1;
			break;
	}

	await deployer.deploy(IexecODBLibOrders);
	await deployer.link(IexecODBLibOrders, IexecClerk);

	await deployer.deploy(IexecHub);
	IexecHubInstance = await IexecHub.deployed();
	console.log("IexecHub deployed at address: " + IexecHubInstance.address);

	await deployer.deploy(IexecClerk, IexecHubInstance.address, chainid);
	IexecClerkInstance = await IexecClerk.deployed();
	console.log("IexecClerk deployed at address: " + IexecClerkInstance.address);

	await deployer.deploy(AppRegistry);
	await deployer.deploy(DatasetRegistry);
	await deployer.deploy(WorkerpoolRegistry);
	AppRegistryInstance        = await AppRegistry.deployed();
	DatasetRegistryInstance    = await DatasetRegistry.deployed();
	WorkerpoolRegistryInstance = await WorkerpoolRegistry.deployed();
	console.log("AppRegistry        deployed at address: " + AppRegistryInstance.address);
	console.log("DatasetRegistry    deployed at address: " + DatasetRegistryInstance.address);
	console.log("WorkerpoolRegistry deployed at address: " + WorkerpoolRegistryInstance.address);
	// transferOwnership if ownable

	await IexecHubInstance.attachContracts(
		IexecClerkInstance.address
	, AppRegistryInstance.address
	, DatasetRegistryInstance.address
	, WorkerpoolRegistryInstance.address
	);
	console.log("attach Contracts to IexecHub done");

	var categoriesConfigFileJson = JSON.parse(fs.readFileSync("./config/categories.json"));
	for(var i = 0; i < categoriesConfigFileJson.categories.length; ++i)
	{
		console.log("create category : " + categoriesConfigFileJson.categories[i].name);
		await IexecHubInstance.createCategory(
			categoriesConfigFileJson.categories[i].name
		,	JSON.stringify(categoriesConfigFileJson.categories[i].description)
		,	categoriesConfigFileJson.categories[i].workClockTimeRef
		);
	}

	var catCount = await IexecHubInstance.countCategory();
	console.log("countCategory is now: " + catCount);
	for(var i = 0; i < await IexecHubInstance.countCategory(); ++i)
	{
		console.log([ "category", i, ":", ...await IexecHubInstance.viewCategory(i)].join(" "));
	}

	await IexecHubInstance.transferOwnership(owner);
	console.log("setCategoriesCreator to " + owner);

	// Starting deposit for all test wallets
	if (false && chaintype == "private")
	{
		// -------------------------------- Admin --------------------------------
		var adminAdress = "0xabcd1339Ec7e762e639f4887E2bFe5EE8023E23E";
		var nRlcAmount  = 10000000;

		//For admin, put some nRLC in wallet
		await RLCInstance.transfer(adminAdress, nRlcAmount, { from: owner, gas: 4500000 });
		RLCInstance.balanceOf(adminAdress).then(balance => console.log("Wallet.balance of " + adminAdress +" is " + balance + " nRLC"));

		//And put directly some other nRLCs in account
		await RLCInstance.approve(IexecClerkInstance.address, nRlcAmount, { from: owner });
		await IexecClerkInstance.depositFor(nRlcAmount, adminAdress, { from: owner, gas: 4500000 });
		IexecClerkInstance.viewAccount(adminAdress).then(balance => console.log("Account.stake of " + adminAdress + " is " + balance.stake + " nRLC"));

		// ------------------------------ Scheduler ------------------------------
		var schedulerAddress = "0x000a9c787a972F70F0903890E266F41c795C4DcA";
		var nRlcAmount       = 10000000;

		//For scheduler, put directly some nRLCs in account
		await RLCInstance.approve(IexecClerkInstance.address, nRlcAmount, { from: owner });
		await IexecClerkInstance.depositFor(nRlcAmount, schedulerAddress, { from: owner, gas: 4500000 });
		await IexecClerkInstance.viewAccount(schedulerAddress).then(balance => console.log("Account.stake of " + schedulerAddress + " is " + balance.stake + " nRLC"));

		// ------------------------------- Workers -------------------------------
		var workerAddresses = fs.readFileSync(__dirname + "/accounts.txt").toString().split("\n");
		var nRlcAmount      = 1000;

		//For workers, put directly some nRLCs in account
		console.log("Making deposit to " + workerAddresses.length + " wallets");
		await RLCInstance.approve(IexecClerkInstance.address, workerAddresses.length * nRlcAmount, { from: owner });

		let batchSize = 50;
		for (var i = 0; i < workerAddresses.length; i += batchSize)
		{
			group = workerAddresses.slice(i, i+batchSize);
			await IexecClerkInstance.depositForArray(
				Array(group.length).fill(nRlcAmount),
				group,
				{ from: owner, gas: 4500000 }
			);
			group.forEach(address => IexecClerkInstance.viewAccount(address).then(balance => console.log("Account.stake of " + address + " is " + balance.stake + " nRLC")));
		}

	}


};

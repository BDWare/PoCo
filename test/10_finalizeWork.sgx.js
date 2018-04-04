var RLC            = artifacts.require("../node_modules/rlc-token//contracts/RLC.sol");
var IexecHub       = artifacts.require("./IexecHub.sol");
var WorkerPoolHub  = artifacts.require("./WorkerPoolHub.sol");
var AppHub         = artifacts.require("./AppHub.sol");
var DatasetHub     = artifacts.require("./DatasetHub.sol");
var WorkerPool     = artifacts.require("./WorkerPool.sol");
var App            = artifacts.require("./App.sol");
var WorkOrder      = artifacts.require("./WorkOrder.sol");
var IexecLib       = artifacts.require("./IexecLib.sol");
var Marketplace    = artifacts.require("./Marketplace.sol");

const Promise         = require("bluebird");
const fs              = require("fs-extra");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions      = require("../utils/extensions.js");
const addEvmFunctions = require("../utils/evmFunctions.js");
const readFileAsync = Promise.promisify(fs.readFile);


addEvmFunctions(web3);
Promise.promisifyAll(web3.eth,     { suffix: "Promise" });
Promise.promisifyAll(web3.version, { suffix: "Promise" });
Promise.promisifyAll(web3.evm,     { suffix: "Promise" });
Extensions.init(web3, assert);
var constants = require("./constants");

contract('IexecHub', function(accounts) {

	let scheduleProvider, resourceProvider, appProvider, datasetProvider, dappUser, dappProvider, iExecCloudUser, marketplaceCreator;
	let subscriptionLockStakePolicy    = 0;
	let subscriptionMinimumStakePolicy = 10;
	let subscriptionMinimumScorePolicy = 0;
	let isTestRPC;
	let txMined;
	let txsMined;
	let testTimemout = 0;
	let aRLCInstance;
	let aIexecHubInstance;
	let aWorkerPoolHubInstance;
	let aAppHubInstance;
	let aDatasetHubInstance;
	let aMarketplaceInstance;

	//specific for test :
	let workerPoolAddress;
	let aWorkerPoolInstance;

	let appAddress;
	let aAppInstance;
	let aWorkOrderInstance;

	before("should prepare accounts and check TestRPC Mode", async() => {
		assert.isAtLeast(accounts.length, 9, "should have at least 8 accounts");
		scheduleProvider   = accounts[0];
		resourceProvider   = accounts[1];
		appProvider        = accounts[2];
		datasetProvider    = accounts[3];
		dappUser           = accounts[4];
		dappProvider       = accounts[5];
		iExecCloudUser     = accounts[6];
		marketplaceCreator = accounts[7];
		SGXkeys            = accounts[8];

		await Extensions.makeSureAreUnlocked(
			[scheduleProvider, resourceProvider, appProvider, datasetProvider, dappUser, dappProvider, iExecCloudUser]);
		let balance = await web3.eth.getBalancePromise(scheduleProvider);
		assert.isTrue(
			web3.toWei(web3.toBigNumber(80), "ether").lessThan(balance),
			"dappProvider should have at least 80 ether, not " + web3.fromWei(balance, "ether"));
			await Extensions.refillAccount(scheduleProvider, resourceProvider,   10);
			await Extensions.refillAccount(scheduleProvider, appProvider,        10);
			await Extensions.refillAccount(scheduleProvider, datasetProvider,    10);
			await Extensions.refillAccount(scheduleProvider, dappUser,           10);
			await Extensions.refillAccount(scheduleProvider, dappProvider,       10);
			await Extensions.refillAccount(scheduleProvider, iExecCloudUser,     10);
			await Extensions.refillAccount(scheduleProvider, marketplaceCreator, 10);
		let node = await web3.version.getNodePromise();
		isTestRPC = node.indexOf("EthereumJS TestRPC") >= 0;
		// INIT RLC
		aRLCInstance = await RLC.new({
			from: marketplaceCreator,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		console.log("aRLCInstance.address is ");
		console.log(aRLCInstance.address);
		let txMined = await aRLCInstance.unlock({
			from: marketplaceCreator,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		txsMined = await Promise.all([
			aRLCInstance.transfer(scheduleProvider, 1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(resourceProvider, 1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(appProvider,      1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(datasetProvider,  1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(dappUser,         1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(dappProvider,     1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.transfer(iExecCloudUser,   1000, { from: marketplaceCreator, gas: constants.AMOUNT_GAS_PROVIDED })
		]);
		assert.isBelow(txsMined[0].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[1].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[2].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[3].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[4].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[5].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[6].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		let balances = await Promise.all([
			aRLCInstance.balanceOf(scheduleProvider),
			aRLCInstance.balanceOf(resourceProvider),
			aRLCInstance.balanceOf(appProvider),
			aRLCInstance.balanceOf(datasetProvider),
			aRLCInstance.balanceOf(dappUser),
			aRLCInstance.balanceOf(dappProvider),
			aRLCInstance.balanceOf(iExecCloudUser)
		]);
		assert.strictEqual(balances[0].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[1].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[2].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[3].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[4].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[5].toNumber(), 1000, "1000 nRLC here");
		assert.strictEqual(balances[6].toNumber(), 1000, "1000 nRLC here");

		// INIT SMART CONTRACTS BY marketplaceCreator
		aWorkerPoolHubInstance = await WorkerPoolHub.new({
			from: marketplaceCreator
		});
		console.log("aWorkerPoolHubInstance.address is ");
		console.log(aWorkerPoolHubInstance.address);

		aAppHubInstance = await AppHub.new({
			from: marketplaceCreator
		});
		console.log("aAppHubInstance.address is ");
		console.log(aAppHubInstance.address);

		aDatasetHubInstance = await DatasetHub.new({
			from: marketplaceCreator
		});
		console.log("aDatasetHubInstance.address is ");
		console.log(aDatasetHubInstance.address);

		aIexecHubInstance = await IexecHub.new(aRLCInstance.address, aWorkerPoolHubInstance.address, aAppHubInstance.address, aDatasetHubInstance.address, {
			from: marketplaceCreator
		});
		console.log("aIexecHubInstance.address is ");
		console.log(aIexecHubInstance.address);

		txMined = await aWorkerPoolHubInstance.transferOwnership(aIexecHubInstance.address, {
			from: marketplaceCreator
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		console.log("transferOwnership of WorkerPoolHub to IexecHub");

		txMined = await aAppHubInstance.transferOwnership(aIexecHubInstance.address, {
			from: marketplaceCreator
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		console.log("transferOwnership of AppHub to IexecHub");

		txMined = await aDatasetHubInstance.transferOwnership(aIexecHubInstance.address, {
			from: marketplaceCreator
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		console.log("transferOwnership of DatasetHub to IexecHub");

		aMarketplaceInstance = await Marketplace.new(aIexecHubInstance.address,{
			from: marketplaceCreator
		});
		console.log("aMarketplaceInstance.address is ");
		console.log(aMarketplaceInstance.address);

		txMined = await aIexecHubInstance.attachMarketplace(aMarketplaceInstance.address, {
			from: marketplaceCreator
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		console.log("attachMarketplace to IexecHub");

		// INIT categories in MARKETPLACE
		txMined = await aIexecHubInstance.setCategoriesCreator(marketplaceCreator, {
			from: marketplaceCreator
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		console.log("setCategoriesCreator  to marketplaceCreator");
		var categoriesConfigFile = await readFileAsync("./config/categories.json");
		var categoriesConfigFileJson = JSON.parse(categoriesConfigFile);
		for(var i = 0; i < categoriesConfigFileJson.categories.length; i++) {
			console.log("created category:");
			console.log(categoriesConfigFileJson.categories[i].name);
			console.log(JSON.stringify(categoriesConfigFileJson.categories[i].description));
			console.log(categoriesConfigFileJson.categories[i].workClockTimeRef);
			txMined = await aIexecHubInstance.createCategory(categoriesConfigFileJson.categories[i].name,JSON.stringify(categoriesConfigFileJson.categories[i].description),categoriesConfigFileJson.categories[i].workClockTimeRef, {
				from: marketplaceCreator
			});
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		}

		//INIT RLC approval on IexecHub for all actors
		txsMined = await Promise.all([
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: scheduleProvider, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: resourceProvider, gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: appProvider,      gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: datasetProvider,  gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: dappUser,         gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: dappProvider,     gas: constants.AMOUNT_GAS_PROVIDED }),
			aRLCInstance.approve(aIexecHubInstance.address, 100, { from: iExecCloudUser,   gas: constants.AMOUNT_GAS_PROVIDED })
		]);
		assert.isBelow(txsMined[0].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[1].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[2].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[3].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[4].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[5].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[6].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		// INIT CREATE A WORKER POOL
		txMined = await aIexecHubInstance.createWorkerPool(
			"myWorkerPool",
			subscriptionLockStakePolicy,
			subscriptionMinimumStakePolicy,
			subscriptionMinimumScorePolicy, {
				from: scheduleProvider
			});
		workerPoolAddress = await aWorkerPoolHubInstance.getWorkerPool(scheduleProvider, 1);
		aWorkerPoolInstance = await WorkerPool.at(workerPoolAddress);

		// WORKER ADD deposit to respect workerpool policy
		txMined = await aIexecHubInstance.deposit(subscriptionLockStakePolicy + subscriptionMinimumStakePolicy, {
			from: resourceProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		// WORKER SUBSCRIBE TO POOL
		txMined = await aWorkerPoolInstance.subscribeToPool({
			from: resourceProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		// CREATE AN APP
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		txMined = await aIexecHubInstance.createApp("R Clifford Attractors", 0, constants.DAPP_PARAMS_EXAMPLE, {
			from: appProvider
		});
		appAddress = await aAppHubInstance.getApp(appProvider, 1);
		aAppInstance = await App.at(appAddress);

		//Create ask Marker Order by scheduler
		txMined = await aIexecHubInstance.deposit(100, {
			from: scheduleProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		txMined = await aMarketplaceInstance.createMarketOrder(constants.MarketOrderDirectionEnum.ASK, 1 /*_category*/, 0/*_trust*/, 100/*_value*/, workerPoolAddress/*_workerpool of sheduler*/, 1/*_volume*/, {
			from: scheduleProvider
		});

		//answerAskOrder
		txMined = await aIexecHubInstance.deposit(100, {
			from: iExecCloudUser,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");


		txMined = await aIexecHubInstance.buyForWorkOrder(1/*_marketorderIdx*/, aWorkerPoolInstance.address, aAppInstance.address, 0, "noParam", 0, iExecCloudUser, {
			from: iExecCloudUser
		});

		events = await Extensions.getEventsPromise(aIexecHubInstance.WorkOrderActivated({}),1,constants.EVENT_WAIT_TIMEOUT);
		woid = events[0].args.woid;
		console.log("woid is: " + woid);
		aWorkOrderInstance = await WorkOrder.at(woid);

		//allowWorkerToContribute
		txMined = await aWorkerPoolInstance.allowWorkerToContribute(woid, resourceProvider, SGXkeys, {
			from: scheduleProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		m_statusCall = await aWorkOrderInstance.m_status.call();
		assert.strictEqual(m_statusCall.toNumber(), constants.WorkOrderStatusEnum.ACTIVE, "check m_status ACTIVE");

		//workerContribute
		assert.strictEqual(subscriptionMinimumStakePolicy, 10, "check stake sanity before contribution");
		assert.strictEqual(subscriptionLockStakePolicy,    0,  "check stake sanity before contribution");
		txMined = await aIexecHubInstance.deposit(30, {
			from: resourceProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		signed = await Extensions.signResult("iExec the wanderer", resourceProvider);
		sgxsign   = web3.eth.sign(SGXkeys, signed.hash.substr(2,64) + signed.sign.substr(2,64));
		sgxsign_r = '0x' + sgxsign.substr(2, 64);
		sgxsign_s = '0x' + sgxsign.substr(66, 64);
		sgxsign_v = web3.toDecimal(sgxsign.substr(130, 2)) + 27;

		txMined = await aWorkerPoolInstance.contribute(woid, signed.hash, signed.sign, sgxsign_v, sgxsign_r, sgxsign_s, {
			from: resourceProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		checkBalance = await aIexecHubInstance.checkBalance.call(resourceProvider);
		assert.strictEqual(checkBalance[0].toNumber(), 10, "check stake of the resourceProvider");
		assert.strictEqual(checkBalance[1].toNumber(), 30, "check stake locked of the resourceProvider : 30 + 10");

		//revealConsensus
		txMined = await aWorkerPoolInstance.revealConsensus(woid, Extensions.hashResult("iExec the wanderer"), {
			from: scheduleProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});

		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		m_statusCall = await aWorkOrderInstance.m_status.call();
		assert.strictEqual(m_statusCall.toNumber(), constants.WorkOrderStatusEnum.REVEALING, "check m_status REVEALING");

		//revealContribution
		const result = web3.sha3("iExec the wanderer");
		txMined = await aWorkerPoolInstance.reveal(woid, result, {
			from: resourceProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		m_statusCall = await aWorkOrderInstance.m_status.call();
		assert.strictEqual(m_statusCall.toNumber(), constants.WorkOrderStatusEnum.REVEALING, "check m_status REVEALING");
	});

	it("scheduleProvider call finalizeWork", async function() {
		checkBalance = await aIexecHubInstance.checkBalance.call(scheduleProvider);
		assert.strictEqual(checkBalance[0].toNumber(),   0, "check balance : stake");
		assert.strictEqual(checkBalance[1].toNumber(), 100, "check balance : locked");

		txMined = await aWorkerPoolInstance.finalizeWork(woid, "aStdout", "aStderr", "anUri", {
			from: scheduleProvider,
			gas: constants.AMOUNT_GAS_PROVIDED
		});
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = await Extensions.getEventsPromise(aIexecHubInstance.WorkOrderCompleted({}),1,constants.EVENT_WAIT_TIMEOUT);
		assert.strictEqual(events[0].args.woid, woid, "woid check");
		assert.strictEqual(events[0].args.workerPool, aWorkerPoolInstance.address, "the aWorkerPoolInstance address check");

		m_statusCall = await aWorkOrderInstance.m_status.call();
		assert.strictEqual(m_statusCall.toNumber(), constants.WorkOrderStatusEnum.COMPLETED, "check m_status COMPLETED");

		result = await Promise.all([
			aWorkOrderInstance.m_stdout.call(),
			aWorkOrderInstance.m_stderr.call(),
			aWorkOrderInstance.m_uri.call()
		]);
		assert.strictEqual(result[0], "aStdout", "check m_stdout");
		assert.strictEqual(result[1], "aStderr", "check m_stderr");
		assert.strictEqual(result[2], "anUri", "check m_uri");

		checkBalance = await aIexecHubInstance.checkBalance.call(resourceProvider);
		assert.strictEqual(checkBalance[0].toNumber(), 139, "check stake of the resourceProvider. won 99% of price (99). (initial balance 30+10=40)");
		assert.strictEqual(checkBalance[1].toNumber(), 0,   "check stake locked of the resourceProvider: 10 form subscription lock ");

		checkBalance = await aIexecHubInstance.checkBalance.call(scheduleProvider);
		assert.strictEqual(checkBalance[0].toNumber(), 101, "check stake of the scheduleProvider. 100 unlocked + won 1% of price");
		assert.strictEqual(checkBalance[1].toNumber(),   0, "check stake locked of the scheduleProvider");
	});

});

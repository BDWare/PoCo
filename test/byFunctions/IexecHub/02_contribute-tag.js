var IexecHub           = artifacts.require("./IexecHub.sol");
var IexecClerk         = artifacts.require("./IexecClerk.sol");
var AppRegistry        = artifacts.require("./AppRegistry.sol");
var DatasetRegistry    = artifacts.require("./DatasetRegistry.sol");
var WorkerpoolRegistry = artifacts.require("./WorkerpoolRegistry.sol");
var App                = artifacts.require("./App.sol");
var Dataset            = artifacts.require("./Dataset.sol");
var Workerpool         = artifacts.require("./Workerpool.sol");

const { BN, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const multiaddr = require('multiaddr');
const constants = require("../../../utils/constants");
const odbtools  = require('../../../utils/odb-tools');
const wallets   = require('../../../utils/wallets');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('IexecHub', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	let iexecAdmin      = accounts[0];
	let sgxEnclave      = accounts[0];
	let appProvider     = accounts[1];
	let datasetProvider = accounts[2];
	let scheduler       = accounts[3];
	let worker1         = accounts[4];
	let worker2         = accounts[5];
	let worker3         = accounts[6];
	let worker4         = accounts[7];
	let worker5         = accounts[8];
	let user            = accounts[9];

	var IexecHubInstance           = null;
	var IexecClerkInstance         = null;
	var AppRegistryInstance        = null;
	var DatasetRegistryInstance    = null;
	var WorkerpoolRegistryInstance = null;

	var AppInstance        = null;
	var DatasetInstance    = null;
	var WorkerpoolInstance = null;

	var apporder         = null;
	var datasetorder     = null;
	var workerpoolorder1 = null;
	var workerpoolorder2 = null;
	var requestorder     = null;

	var deals = {}
	var tasks = {};

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		/**
		 * Retreive deployed contracts
		 */
		IexecHubInstance           = await IexecHub.deployed();
		IexecClerkInstance         = await IexecClerk.deployed();
		AppRegistryInstance        = await AppRegistry.deployed();
		DatasetRegistryInstance    = await DatasetRegistry.deployed();
		WorkerpoolRegistryInstance = await WorkerpoolRegistry.deployed();

		odbtools.setup({
			name:              "iExecODB",
			version:           "3.0-alpha",
			chainId:           await web3.eth.net.getId(),
			verifyingContract: IexecClerkInstance.address,
		});
	});

	it("Escrow deposit", async () => {
		txsMined = await Promise.all([
			IexecClerkInstance.deposit({ from: scheduler, value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: worker1,   value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: worker2,   value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: worker3,   value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: worker4,   value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: worker5,   value: 1000 * 10 ** 9 }),
			IexecClerkInstance.deposit({ from: user,      value: 1000 * 10 ** 9 }),
		]);
	});

	/***************************************************************************
	 *                  TEST: App creation (by appProvider)                  *
	 ***************************************************************************/
	it("[Setup]", async () => {
		// Ressources
		txMined = await AppRegistryInstance.createApp(
			appProvider,
			"R Clifford Attractors",
			"DOCKER",
			constants.MULTIADDR_BYTES,
			constants.NULL.BYTES32,
			"0x",
			{ from: appProvider, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, AppRegistryInstance.address, "CreateApp");
		AppInstance = await App.at(events[0].args.app);

		txMined = await DatasetRegistryInstance.createDataset(
			datasetProvider,
			"Pi",
			constants.MULTIADDR_BYTES,
			constants.NULL.BYTES32,
			{ from: datasetProvider, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, DatasetRegistryInstance.address, "CreateDataset");
		DatasetInstance = await Dataset.at(events[0].args.dataset);

		txMined = await WorkerpoolRegistryInstance.createWorkerpool(
			scheduler,
			"A test workerpool",
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, WorkerpoolRegistryInstance.address, "CreateWorkerpool");
		WorkerpoolInstance = await Workerpool.at(events[0].args.workerpool);

		txMined = await WorkerpoolInstance.changePolicy(/* worker stake ratio */ 35, /* scheduler reward ratio */ 5, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		// Orders
		apporder = odbtools.signAppOrder(
			{
				app:                AppInstance.address,
				appprice:           3,
				volume:             1000,
				tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
				datasetrestrict:    constants.NULL.ADDRESS,
				workerpoolrestrict: constants.NULL.ADDRESS,
				requesterrestrict:  constants.NULL.ADDRESS,
				salt:               web3.utils.randomHex(32),
				sign:               constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(appProvider)
		);
		datasetorder = odbtools.signDatasetOrder(
			{
				dataset:            DatasetInstance.address,
				datasetprice:       1,
				volume:             1000,
				tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
				apprestrict:        constants.NULL.ADDRESS,
				workerpoolrestrict: constants.NULL.ADDRESS,
				requesterrestrict:  constants.NULL.ADDRESS,
				salt:               web3.utils.randomHex(32),
				sign:               constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(datasetProvider)
		);
		workerpoolorder_offset = odbtools.signWorkerpoolOrder(
			{
				workerpool:        WorkerpoolInstance.address,
				workerpoolprice:   15,
				volume:            1,
				tag:               "0x0000000000000000000000000000000000000000000000000000000000000001",
				category:          4,
				trust:             10,
				apprestrict:       constants.NULL.ADDRESS,
				datasetrestrict:   constants.NULL.ADDRESS,
				requesterrestrict: constants.NULL.ADDRESS,
				salt:              web3.utils.randomHex(32),
				sign:              constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(scheduler)
		);
		workerpoolorder = odbtools.signWorkerpoolOrder(
			{
				workerpool:        WorkerpoolInstance.address,
				workerpoolprice:   25,
				volume:            1000,
				tag:               "0x0000000000000000000000000000000000000000000000000000000000000001",
				category:          4,
				trust:             10,
				apprestrict:       constants.NULL.ADDRESS,
				datasetrestrict:   constants.NULL.ADDRESS,
				requesterrestrict: constants.NULL.ADDRESS,
				salt:              web3.utils.randomHex(32),
				sign:              constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(scheduler)
		);
		requestorder = odbtools.signRequestOrder(
			{
				app:                AppInstance.address,
				appmaxprice:        3,
				dataset:            DatasetInstance.address,
				datasetmaxprice:    1,
				workerpool:         constants.NULL.ADDRESS,
				workerpoolmaxprice: 25,
				volume:             10,
				tag:                "0x0000000000000000000000000000000000000000000000000000000000000001",
				category:           4,
				trust:              4,
				requester:          user,
				beneficiary:        user,
				callback:           constants.NULL.ADDRESS,
				params:             "<parameters>",
				salt:               web3.utils.randomHex(32),
				sign:               constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(user)
		);

		// Market
		txsMined = await Promise.all([
			IexecClerkInstance.matchOrders(apporder, datasetorder, workerpoolorder_offset, requestorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED }),
			IexecClerkInstance.matchOrders(apporder, datasetorder, workerpoolorder,        requestorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED }),
		]);
		assert.isBelow(txsMined[0].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[1].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		deals = await IexecClerkInstance.viewRequestDeals(odbtools.RequestOrderTypedStructHash(requestorder));
	});

	it("[setup] Initialization", async () => {
		tasks[1] = extractEvents(await IexecHubInstance.initialize(deals[1], 1, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
		tasks[2] = extractEvents(await IexecHubInstance.initialize(deals[1], 2, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
		tasks[3] = web3.utils.soliditySha3({ t: 'bytes32', v: deals[1] }, { t: 'uint256', v: 3 });
		tasks[4] = extractEvents(await IexecHubInstance.initialize(deals[1], 4, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
		tasks[5] = extractEvents(await IexecHubInstance.initialize(deals[1], 5, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
		tasks[6] = extractEvents(await IexecHubInstance.initialize(deals[1], 6, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
		tasks[7] = extractEvents(await IexecHubInstance.initialize(deals[1], 7, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }), IexecHubInstance.address, "TaskInitialize")[0].args.taskid;
	});

	function sendContribution(taskid, worker, results, authorization, enclave)
	{
		return IexecHubInstance.contribute(
				taskid,                                                 // task (authorization)
				results.hash,                                           // common    (result)
				results.seal,                                           // unique    (result)
				enclave,                                                // address   (enclave)
				results.sign ? results.sign : constants.NULL.SIGNATURE, // signature (enclave)
				authorization.sign,                                     // signature (authorization)
				{ from: worker, gasLimit: constants.AMOUNT_GAS_PROVIDED }
			);
	}

	it("[2.1][TAG] Contribute - Error (missing sgx)", async () => {
		__taskid  = tasks[1];
		__worker  = worker1;
		__enclave = constants.NULL.ADDRESS;
		__raw     = "true";

		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			odbtools.sealResult(__taskid, __raw, __worker),
			await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler),
			__enclave
		));
	});

	it("[2.2][TAG] Contribute - Correct (sgx)", async () => {
		__taskid  = tasks[2];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		txMined = await sendContribution(
			__taskid,
			__worker,
			(await odbtools.signContribution (odbtools.sealResult(__taskid, __raw, __worker),             __enclave)),
			(await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler)),
			__enclave
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, IexecHubInstance.address, "TaskContribute");
		assert.equal(events[0].args.taskid, __taskid,                                  "check taskid"    );
		assert.equal(events[0].args.worker, __worker,                                  "check worker"    );
		assert.equal(events[0].args.hash,   odbtools.hashResult(__taskid, __raw).hash, "check resultHash");
	});

	it("[2.3][TAG] Contribute - Error (unset)", async () => {
		__taskid  = tasks[3];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			await odbtools.signContribution (odbtools.sealResult(__taskid, __raw, __worker),             __enclave),
			await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler),
			__enclave
		));
	});

	it("[2.4][TAG] Contribute - Error (duplicate)", async () => {
		__taskid  = tasks[4];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		results       = (await odbtools.signContribution (odbtools.sealResult(__taskid, __raw, __worker),             __enclave)),
		authorization = (await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler));
		// First ok
		await sendContribution(
			__taskid,
			__worker,
			results,
			authorization,
			__enclave
		);
		// Second error
		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			results,
			authorization,
			__enclave
		));
	});

	it("[2.5][TAG] Contribute - Error (authorization)", async () => {
		__taskid  = tasks[5];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			await odbtools.signContribution (odbtools.sealResult(__taskid, __raw, __worker),             __enclave),
			await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, __worker ), // signature: scheduler → worker
			__enclave
		));
	});

	it("[2.6][TAG] Contribute - Error (enclave signature)", async () => {
		__taskid  = tasks[6];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			odbtools.sealResult(__taskid, __raw, __worker), // should be signed
			await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler), // signature: scheduler → worker
			__enclave
		));
	});

	it("clock fast forward", async () => {
		target = Number((await IexecHubInstance.viewTask(tasks[7])).finalDeadline);

		await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_increaseTime", params: [ target - (await web3.eth.getBlock("latest")).timestamp ], id: 0 }, () => {});
	});

	it("[2.7][TAG] Contribute - Late", async () => {
		__taskid  = tasks[7];
		__worker  = worker1;
		__enclave = sgxEnclave;
		__raw     = "true"

		await expectRevert.unspecified(sendContribution(
			__taskid,
			__worker,
			await odbtools.signContribution (odbtools.sealResult(__taskid, __raw, __worker),             __enclave),
			await odbtools.signAuthorization({ worker: __worker, taskid: __taskid, enclave: __enclave }, scheduler), // signature: scheduler → worker
			__enclave
		));
	});

});

var RLC                = artifacts.require("../node_modules/rlc-faucet-contract/contracts/RLC.sol");
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
const constants = require("../utils/constants");
const odbtools  = require('../utils/odb-tools');
const wallets   = require('../utils/wallets');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('Fullchain', async (accounts) => {

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

	var RLCInstance                = null;
	var IexecHubInstance           = null;
	var IexecClerkInstance         = null;
	var AppRegistryInstance        = null;
	var DatasetRegistryInstance    = null;
	var WorkerpoolRegistryInstance = null;

	var AppInstance        = null;
	var DatasetInstance    = null;
	var WorkerpoolInstance = null;

	var apporder        = null;
	var datasetorder    = null;
	var workerpoolorder = null;
	var requestorder    = null;
	var dealid          = null;
	var taskid          = null;

	var authorizations = {};
	var results        = {};
	var consensus      = null;
	var workers        = [];

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		trusttarget = 4;
		workers = [
			{ address: worker1, enclave: sgxEnclave, raw: "iExec the wanderer" },
			{ address: worker2, enclave: sgxEnclave, raw: "iExec the wanderer" },
		];
		consensus = "iExec the wanderer";

		/**
		 * Retreive deployed contracts
		 */
		RLCInstance                = await RLC.deployed();
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

	/***************************************************************************
	 *                   TEST: App creation (by appProvider)                   *
	 ***************************************************************************/
	it("[Genesis] App Creation", async () => {
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
	});

	/***************************************************************************
	 *               TEST: Dataset creation (by datasetProvider)               *
	 ***************************************************************************/
	it("[Genesis] Dataset Creation", async () => {
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
	});

	/***************************************************************************
	 *                TEST: Workerpool creation (by scheduler)                 *
	 ***************************************************************************/
	it("[Genesis] Workerpool Creation", async () => {
		txMined = await WorkerpoolRegistryInstance.createWorkerpool(
			scheduler,
			"A test workerpool",
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, WorkerpoolRegistryInstance.address, "CreateWorkerpool");
		WorkerpoolInstance = await Workerpool.at(events[0].args.workerpool);
	});

	/***************************************************************************
	 *              TEST: Workerpool configuration (by scheduler)              *
	 ***************************************************************************/
	it("[Genesis] Workerpool Configuration", async () => {
		txMined = await WorkerpoolInstance.changePolicy(
			35,  // worker stake ratio
			5,   // scheduler reward ratio
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
	});

	/***************************************************************************
	 *                         TEST: orders signature                          *
	 ***************************************************************************/
	it("[Genesis] Generate orders", async () => {
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
		workerpoolorder = odbtools.signWorkerpoolOrder(
			{
				workerpool:        WorkerpoolInstance.address,
				workerpoolprice:   25,
				volume:            3,
				category:          4,
				trust:             trusttarget,
				tag:               "0x0000000000000000000000000000000000000000000000000000000000000000",
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
				volume:             1,
				category:           4,
				trust:              trusttarget,
				tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
				requester:          user,
				beneficiary:        user,
				callback:           constants.NULL.ADDRESS,
				params:             "<parameters>",
				salt:               web3.utils.randomHex(32),
				sign:               constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(user)
		);
	});

	/***************************************************************************
	 *                      TEST: Deposit funds to escrow                      *
	 ***************************************************************************/
	it("[Setup] Escrow deposit", async () => {
		txsMined = await Promise.all([
			IexecClerkInstance.deposit({ from: scheduler, value: 1000}),
			IexecClerkInstance.deposit({ from: worker1,   value: 1000}),
			IexecClerkInstance.deposit({ from: worker2,   value: 1000}),
			IexecClerkInstance.deposit({ from: worker3,   value: 1000}),
			IexecClerkInstance.deposit({ from: worker4,   value: 1000}),
			IexecClerkInstance.deposit({ from: worker5,   value: 1000}),
			IexecClerkInstance.deposit({ from: user,      value: 1000}),
		]);
	});

	/***************************************************************************
	 *                      TEST: check balances - before                      *
	 ***************************************************************************/
	it("[Initial] Check balances", async () => {
		IexecClerkInstance.viewAccount(datasetProvider).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(appProvider    ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(scheduler      ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker1        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker2        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker3        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker4        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker5        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(user           ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
	});

	/***************************************************************************
	 *                       TEST: check score - before                        *
	 ***************************************************************************/
	it("[Initial] Check score", async () => {
		assert.equal(Number(await IexecHubInstance.viewScore(worker1)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker2)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker3)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker4)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker5)), 0, "score issue");
	});

	/***************************************************************************
	 *                           TEST: Market making                           *
	 ***************************************************************************/
	it(">> matchOrders", async () => {
		txMined = await IexecClerkInstance.matchOrders(apporder, datasetorder, workerpoolorder, requestorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecClerkInstance.address, "OrdersMatched");
		assert.equal(events[0].args.appHash,        odbtools.AppOrderTypedStructHash       (apporder       ));
		assert.equal(events[0].args.datasetHash,    odbtools.DatasetOrderTypedStructHash   (datasetorder   ));
		assert.equal(events[0].args.workerpoolHash, odbtools.WorkerpoolOrderTypedStructHash(workerpoolorder));
		assert.equal(events[0].args.requestHash,    odbtools.RequestOrderTypedStructHash   (requestorder   ));
		assert.equal(events[0].args.volume,         1                                                  );

		dealid = events[0].args.dealid;
	});

	/***************************************************************************
	 *                    TEST: scheduler initializes task                     *
	 ***************************************************************************/
	it(">> initialize", async () => {
		txMined = await IexecHubInstance.initialize(dealid, 0, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecHubInstance.address, "TaskInitialize");
		assert.equal(events[0].args.workerpool, WorkerpoolInstance.address);

		taskid = events[0].args.taskid;
	});

	/***************************************************************************
	 *           TEST: scheduler authorizes the worker to contribute           *
	 ***************************************************************************/
	it(">> Sign contribution authorization", async () => {
		for (w of workers)
		{
			authorizations[w.address] = await odbtools.signAuthorization(
				{
					worker:  w.address,
					taskid:  taskid,
					enclave: w.enclave,
					sign:    constants.NULL.SIGNATURE,
				},
				scheduler
			);
		}
	});

	/***************************************************************************
	 *                    TEST: worker runs its application                    *
	 ***************************************************************************/
	it(">> Run job", async () => {
		consensus = odbtools.hashResult(taskid, consensus);

		for (w of workers)
		{
			results[w.address] = odbtools.sealResult(taskid, w.raw, w.address);
			if (w.enclave != constants.NULL.ADDRESS) // With SGX
			{
				await odbtools.signContribution(results[w.address], w.enclave);
			}
			else // Without SGX
			{
				results[w.address].sign = constants.NULL.SIGNATURE;
			}
		}
	});

	/***************************************************************************
	 *                        TEST: worker contributes                         *
	 ***************************************************************************/
	it(">> signed contribute", async () => {
		for (w of workers)
		{
			txMined = await IexecHubInstance.contribute(
				authorizations[w.address].taskid,  // task (authorization)
				results[w.address].hash,           // common    (result)
				results[w.address].seal,           // unique    (result)
				authorizations[w.address].enclave, // address   (enclave)
				results[w.address].sign,           // signature (enclave)
				authorizations[w.address].sign,    // signature (authorization)
				{ from: w.address, gasLimit: constants.AMOUNT_GAS_PROVIDED }
			);
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		}
	});

	/***************************************************************************
	 *                          TEST: worker reveals                           *
	 ***************************************************************************/
	it(">> reveal", async () => {
		for (w of workers)
		if (results[w.address].hash == consensus.hash)
		{
			txMined = await IexecHubInstance.reveal(
				taskid,
				results[w.address].digest,
				{ from: w.address }
			);
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

			events = extractEvents(txMined, IexecHubInstance.address, "TaskReveal");
			assert.equal(events[0].args.taskid, taskid                   );
			assert.equal(events[0].args.worker, w.address                );
			assert.equal(events[0].args.digest, results[w.address].digest);
		}
	});

	/***************************************************************************
	 *                        TEST: scheduler finalizes                        *
	 ***************************************************************************/
	it(">> finalizeWork", async () => {
		txMined = await IexecHubInstance.finalize(taskid, web3.utils.utf8ToHex("aResult"), { from: scheduler, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecHubInstance.address, "TaskFinalize");
		assert.equal(events[0].args.taskid,  taskid                         );
		assert.equal(events[0].args.results, web3.utils.utf8ToHex("aResult"));
	});

	/***************************************************************************
	 *                         TEST: check task status                         *
	 ***************************************************************************/
	it("[Finalized] Check task", async () => {
		task = await IexecHubInstance.viewTask(taskid);
		assert.equal    (       task.status,                   constants.TaskStatusEnum.COMPLETED                                           );
		assert.equal    (       task.dealid,                   dealid                                                                       );
		assert.equal    (Number(task.idx),                     0                                                                            );
		assert.equal    (Number(task.timeref),                 (await IexecHubInstance.viewCategory(requestorder.category)).workClockTimeRef);
		assert.isAbove  (Number(task.contributionDeadline),    0                                                                            );
		assert.isAbove  (Number(task.revealDeadline),          0                                                                            );
		assert.isAbove  (Number(task.finalDeadline),           0                                                                            );
		assert.equal    (       task.consensusValue,           consensus.hash                                                               );
		assert.equal    (Number(task.revealCounter),           workers.length                                                               );
		assert.equal    (Number(task.winnerCounter),           workers.length                                                               );
		assert.deepEqual(       task.contributors.map(a => a), workers.map(x => x.address)                                                  );
		assert.equal    (       task.results,                  web3.utils.utf8ToHex("aResult")                                              );
	});

	/***************************************************************************
	 *                       TEST: check balance - after                       *
	 ***************************************************************************/
	it("[Finalized] Check balances", async () => {
		IexecClerkInstance.viewAccount(datasetProvider).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    1, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(appProvider    ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    3, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(scheduler      ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1003, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker1        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1011, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker2        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1011, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker3        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker4        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(worker5        ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000, 0 ], "check balance"));
		IexecClerkInstance.viewAccount(user           ).then(balance => assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [  971, 0 ], "check balance"));
	});

	/***************************************************************************
	 *                        TEST: check score - after                        *
	 ***************************************************************************/
	it("[Finalized] Check score", async () => {
		assert.equal(Number(await IexecHubInstance.viewScore(worker1)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker2)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker3)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker4)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker5)), 0, "score issue");
	});

	it("FINISHED", async () => {});

});

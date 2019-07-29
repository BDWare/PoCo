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

	var dealid = null;
	var tasks  = {
		0:
		{
			taskid: null,
			authorizations: {},
			results: {},
			consensus: "iExec BOT 0",
			workers :
			[
				{ address: worker1, enclave: constants.NULL.ADDRESS, raw: "iExec BOT 0" },
				{ address: worker2, enclave: constants.NULL.ADDRESS, raw: "iExec BOT 0" },
			]
		},
		1:
		{
			taskid: null,
			authorizations: {},
			results: {},
			consensus: "iExec BOT 1",
			workers :
			[
				{ address: worker2, enclave: sgxEnclave, raw: "iExec BOT 1" },
				{ address: worker3, enclave: sgxEnclave, raw: "iExec BOT 1" },
			]
		},
		2:
		{
			taskid: null,
			authorizations: {},
			results: {},
			consensus: "iExec BOT 2",
			workers :
			[
				{ address: worker1, enclave: constants.NULL.ADDRESS, raw: "iExec BOT 2"       },
				{ address: worker3, enclave: constants.NULL.ADDRESS, raw: "<timeout reached>" },
				{ address: worker2, enclave: sgxEnclave,             raw: "iExec BOT 2"       },
				{ address: worker4, enclave: sgxEnclave,             raw: "iExec BOT 2"       },
				{ address: worker5, enclave: sgxEnclave,             raw: "iExec BOT 2"       },
			]
		},
	};
	var trusttarget = 4;

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);

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
				volume:             3,
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
		assert.equal(events[0].args.volume,         3                                                  );

		dealid = events[0].args.dealid;
	});

	/***************************************************************************
	 *                    TEST: scheduler initializes task                     *
	 ***************************************************************************/
	it(">> initialize", async () => {
		for (i in tasks)
		{
			txMined = await IexecHubInstance.initialize(dealid, i, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED });
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

			events = extractEvents(txMined, IexecHubInstance.address, "TaskInitialize");
			assert.equal(events[0].args.workerpool, WorkerpoolInstance.address);

			tasks[i].taskid = events[0].args.taskid;
		}
	});

	/***************************************************************************
	 *           TEST: scheduler authorizes the worker to contribute           *
	 ***************************************************************************/
	it(">> Sign contribution authorization", async () => {
		for (i in tasks)
		for (worker of tasks[i].workers)
		{
			tasks[i].authorizations[worker.address] = await odbtools.signAuthorization(
				{
					worker:  worker.address,
					taskid:  tasks[i].taskid,
					enclave: worker.enclave,
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
		for (i in tasks)
		{
			tasks[i].consensus = odbtools.hashResult(tasks[i].taskid, tasks[i].consensus);

			for (worker of tasks[i].workers)
			{
				tasks[i].results[worker.address] = odbtools.sealResult(tasks[i].taskid, worker.raw, worker.address);
				if (worker.enclave != constants.NULL.ADDRESS) // With SGX
				{
					await odbtools.signContribution(tasks[i].results[worker.address], worker.enclave);
				}
				else // Without SGX
				{
					tasks[i].results[worker.address].sign = constants.NULL.SIGNATURE;
				}
			}
		}
	});

	/***************************************************************************
	 *                        TEST: worker contributes                         *
	 ***************************************************************************/
	it(">> signed contribute", async () => {
		for (i in tasks)
		for (worker of tasks[i].workers)
		{
			txMined = await IexecHubInstance.contribute(
				tasks[i].authorizations[worker.address].taskid,  // task (authorization)
				tasks[i].results[worker.address].hash,           // common    (result)
				tasks[i].results[worker.address].seal,           // unique    (result)
				tasks[i].authorizations[worker.address].enclave, // address   (enclave)
				tasks[i].results[worker.address].sign,           // signature (enclave)
				tasks[i].authorizations[worker.address].sign,    // signature (authorization)
				{ from: worker.address, gasLimit: constants.AMOUNT_GAS_PROVIDED }
			);
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		}
	});

	/***************************************************************************
	 *                          TEST: worker reveals                           *
	 ***************************************************************************/
	it(">> reveal", async () => {
		for (i in tasks)
		for (worker of tasks[i].workers)
		if (tasks[i].results[worker.address].hash == tasks[i].consensus.hash)
		{
			txMined = await IexecHubInstance.reveal(
				tasks[i].authorizations[worker.address].taskid,
				tasks[i].results[worker.address].digest,
				{ from: worker.address }
			);
			assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

			events = extractEvents(txMined, IexecHubInstance.address, "TaskReveal");
			assert.equal(events[0].args.taskid, tasks[i].authorizations[worker.address].taskid);
			assert.equal(events[0].args.worker, worker.address                                );
			assert.equal(events[0].args.digest, tasks[i].results[worker.address].digest       );
		}
	});

	/***************************************************************************
	 *                       TEST: check balance - after                       *
	 ***************************************************************************/
	it("[Revealed] Check balances", async () => {
		balance = await IexecClerkInstance.viewAccount(datasetProvider); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  0 +  0 +  0, 0                ], "check balance");
		balance = await IexecClerkInstance.viewAccount(appProvider    ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  0 +  0 +  0, 0                ], "check balance");
		balance = await IexecClerkInstance.viewAccount(scheduler      ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 -  7 -  7 -  7, 0 +  7 +  7 +  7 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker1        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 -  8      -  8, 0 +  8      +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker2        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 -  8 -  8 -  8, 0 +  8 +  8 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker3        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000      -  8 -  8, 0      +  8 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker4        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0           +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker5        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0           +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(user           ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 - 29 - 29 - 29, 0 + 29 + 29 + 29 ], "check balance");
	});

	/***************************************************************************
	 *                        TEST: scheduler finalizes                        *
	 ***************************************************************************/
	it(">> finalizeWork (1)", async () => {
		txMined = await IexecHubInstance.finalize(
			tasks[0].taskid,
			web3.utils.utf8ToHex("aResult 1"),
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecHubInstance.address, "TaskFinalize");
		assert.equal(events[0].args.taskid,  tasks[0].taskid                  );
		assert.equal(events[0].args.results, web3.utils.utf8ToHex("aResult 1"));
	});

	/***************************************************************************
	 *                         TEST: check task status                         *
	 ***************************************************************************/
	it("[Finalized 1] Check task", async () => {
		task = await IexecHubInstance.viewTask(tasks[0].taskid);
		assert.equal    (       task.status,                   constants.TaskStatusEnum.COMPLETED                                           );
		assert.equal    (       task.dealid,                   dealid                                                                       );
		assert.equal    (Number(task.idx),                     0                                                                            );
		assert.equal    (Number(task.timeref),                 (await IexecHubInstance.viewCategory(requestorder.category)).workClockTimeRef);
		assert.isAbove  (Number(task.contributionDeadline),    0                                                                            );
		assert.isAbove  (Number(task.revealDeadline),          0                                                                            );
		assert.isAbove  (Number(task.finalDeadline),           0                                                                            );
		assert.equal    (       task.consensusValue,           tasks[0].consensus.hash                                                      );
		assert.equal    (Number(task.revealCounter),           2                                                                            );
		assert.equal    (Number(task.winnerCounter),           2                                                                            );
		assert.deepEqual(       task.contributors.map(a => a), tasks[0].workers.map(x => x.address)                                         );
		assert.equal    (       task.results,                  web3.utils.utf8ToHex("aResult 1")                                            );
	});

	/***************************************************************************
	 *                       TEST: check balance - after                       *
	 ***************************************************************************/
	it("[Finalized 1] Check balances", async () => {
		balance = await IexecClerkInstance.viewAccount(datasetProvider); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  1 +  0 +  0, 0           ], "check balance");
		balance = await IexecClerkInstance.viewAccount(appProvider    ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  3 +  0 +  0, 0           ], "check balance");
		balance = await IexecClerkInstance.viewAccount(scheduler      ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 +  3 -  7 -  7, 0 +  7 +  7 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker1        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11      -  8, 0      +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker2        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11 -  8 -  8, 0 +  8 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker3        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000      -  8 -  8, 0 +  8 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker4        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0      +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker5        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0      +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(user           ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 - 29 - 29 - 29, 0 + 29 + 29 ], "check balance");
	});

	/***************************************************************************
	 *                        TEST: check score - after                        *
	 ***************************************************************************/
	it("[Finalized 1] Check score", async () => {
		assert.equal(Number(await IexecHubInstance.viewScore(worker1)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker2)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker3)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker4)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker5)), 0, "score issue");
	});

	/***************************************************************************
	 *                        TEST: scheduler finalizes                        *
	 ***************************************************************************/
	it(">> finalizeWork (2)", async () => {
		txMined = await IexecHubInstance.finalize(
			tasks[1].taskid,
			web3.utils.utf8ToHex("aResult 2"),
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecHubInstance.address, "TaskFinalize");
		assert.equal(events[0].args.taskid,  tasks[1].taskid                  );
		assert.equal(events[0].args.results, web3.utils.utf8ToHex("aResult 2"));
	});

	/***************************************************************************
	 *                         TEST: check task status                         *
	 ***************************************************************************/
	it("[Finalized 2] Check task", async () => {
		task = await IexecHubInstance.viewTask(tasks[1].taskid);
		assert.equal    (       task.status,                   constants.TaskStatusEnum.COMPLETED                                           );
		assert.equal    (       task.dealid,                   dealid                                                                       );
		assert.equal    (Number(task.idx),                     1                                                                            );
		assert.equal    (Number(task.timeref),                 (await IexecHubInstance.viewCategory(requestorder.category)).workClockTimeRef);
		assert.isAbove  (Number(task.contributionDeadline),    0                                                                            );
		assert.isAbove  (Number(task.revealDeadline),          0                                                                            );
		assert.isAbove  (Number(task.finalDeadline),           0                                                                            );
		assert.equal    (       task.consensusValue,           tasks[1].consensus.hash                                                      );
		assert.equal    (Number(task.revealCounter),           2                                                                            );
		assert.equal    (Number(task.winnerCounter),           2                                                                            );
		assert.deepEqual(       task.contributors.map(a => a), tasks[1].workers.map(x => x.address)                                         );
		assert.equal    (       task.results,                  web3.utils.utf8ToHex("aResult 2")                                            );

	});

	/***************************************************************************
	 *                       TEST: check balance - after                       *
	 ***************************************************************************/
	it("[Finalized 2] Check balances", async () => {
		balance = await IexecClerkInstance.viewAccount(datasetProvider); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  1 +  1 +  0, 0      ], "check balance");
		balance = await IexecClerkInstance.viewAccount(appProvider    ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  3 +  3 +  0, 0      ], "check balance");
		balance = await IexecClerkInstance.viewAccount(scheduler      ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 +  3 +  3 -  7, 0 +  7 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker1        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11      -  8, 0 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker2        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11 + 11 -  8, 0 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker3        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000      + 11 -  8, 0 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker4        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker5        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           -  8, 0 +  8 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(user           ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 - 29 - 29 - 29, 0 + 29 ], "check balance");
	});

	/***************************************************************************
	 *                        TEST: check score - after                        *
	 ***************************************************************************/
	it("[Finalized 2] Check score", async () => {
		assert.equal(Number(await IexecHubInstance.viewScore(worker1)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker2)), 2, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker3)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker4)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker5)), 0, "score issue");
	});

	/***************************************************************************
	 *                        TEST: scheduler finalizes                        *
	 ***************************************************************************/
	it(">> finalizeWork (3)", async () => {
		txMined = await IexecHubInstance.finalize(
			tasks[2].taskid,
			web3.utils.utf8ToHex("aResult 3"),
			{ from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED }
		);
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecHubInstance.address, "TaskFinalize");
		assert.equal(events[0].args.taskid,  tasks[2].taskid                  );
		assert.equal(events[0].args.results, web3.utils.utf8ToHex("aResult 3"));
	});

	/***************************************************************************
	 *                         TEST: check task status                         *
	 ***************************************************************************/
	it("[Finalized 3] Check task", async () => {
		task = await IexecHubInstance.viewTask(tasks[2].taskid);
		assert.equal    (       task.status,                   constants.TaskStatusEnum.COMPLETED                                           );
		assert.equal    (       task.dealid,                   dealid                                                                       );
		assert.equal    (Number(task.idx),                     2                                                                            );
		assert.equal    (Number(task.timeref),                 (await IexecHubInstance.viewCategory(requestorder.category)).workClockTimeRef);
		assert.isAbove  (Number(task.contributionDeadline),    0                                                                            );
		assert.isAbove  (Number(task.revealDeadline),          0                                                                            );
		assert.isAbove  (Number(task.finalDeadline),           0                                                                            );
		assert.equal    (       task.consensusValue,           tasks[2].consensus.hash                                                      );
		assert.equal    (Number(task.revealCounter),           4                                                                            );
		assert.equal    (Number(task.winnerCounter),           4                                                                            );
		assert.deepEqual(       task.contributors.map(a => a), tasks[2].workers.map(x => x.address)                                         );
		assert.equal    (       task.results,                  web3.utils.utf8ToHex("aResult 3")                                            );
	});

	/***************************************************************************
	 *                       TEST: check balance - after                       *
	 ***************************************************************************/
	it("[Finalized 3] Check balances", async () => {
		balance = await IexecClerkInstance.viewAccount(datasetProvider); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  1 +  1 +  1, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(appProvider    ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [    0 +  3 +  3 +  3, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(scheduler      ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 +  3 +  3 +  5, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker1        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11      +  7, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker2        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 + 11 + 11 +  7, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker3        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000      + 11 -  8, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker4        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           +  7, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(worker5        ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000           +  7, 0 ], "check balance");
		balance = await IexecClerkInstance.viewAccount(user           ); assert.deepEqual([ Number(balance.stake), Number(balance.locked) ], [ 1000 - 29 - 29 - 29, 0 ], "check balance");
	});

	/***************************************************************************
	 *                        TEST: check score - after                        *
	 ***************************************************************************/
	it("[Finalized 3] Check score", async () => {
		assert.equal(Number(await IexecHubInstance.viewScore(worker1)), 2, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker2)), 3, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker3)), 0, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker4)), 1, "score issue");
		assert.equal(Number(await IexecHubInstance.viewScore(worker5)), 1, "score issue");
	});

	it("FINISHED", async () => {});

});

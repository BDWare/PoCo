// Config
var DEPLOYMENT = require("../../../config/deployment.json")
// Artefacts
var RLC                = artifacts.require("rlc-faucet-contract/contracts/RLC");
var ERC1538Proxy       = artifacts.require("iexec-solidity/ERC1538Proxy");
var IexecInterface     = artifacts.require(`IexecInterface${DEPLOYMENT.asset}`);
var AppRegistry        = artifacts.require("AppRegistry");
var DatasetRegistry    = artifacts.require("DatasetRegistry");
var WorkerpoolRegistry = artifacts.require("WorkerpoolRegistry");
var App                = artifacts.require("App");
var Dataset            = artifacts.require("Dataset");
var Workerpool         = artifacts.require("Workerpool");

const { BN, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const multiaddr = require('multiaddr');
const constants = require("../../../utils/constants");
const odbtools  = require('../../../utils/odb-tools');
const wallets   = require('../../../utils/wallets');

Object.extract = (obj, keys) => keys.map(key => obj[key]);

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('OrderSignature', async (accounts) => {

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
	var IexecInstance              = null;
	var AppRegistryInstance        = null;
	var DatasetRegistryInstance    = null;
	var WorkerpoolRegistryInstance = null;

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		/**
		 * Retreive deployed contracts
		 */
		RLCInstance                = DEPLOYMENT.asset == "Native" ? { address: constants.NULL.ADDRESS } : await RLC.deployed();
		IexecInstance              = await IexecInterface.at((await ERC1538Proxy.deployed()).address);
		AppRegistryInstance        = await AppRegistry.deployed();
		DatasetRegistryInstance    = await DatasetRegistry.deployed();
		WorkerpoolRegistryInstance = await WorkerpoolRegistry.deployed();

		odbtools.setup({
			name:              "iExecODB",
			version:           "3.0-alpha",
			chainId:           await web3.eth.net.getId(),
			verifyingContract: IexecInstance.address,
		});
	});

	/***************************************************************************
	 *                             TEST: deposit                              *
	 ***************************************************************************/
	it("[Genesis] deposit", async () => {
		switch (DEPLOYMENT.asset)
		{
			case "Native":
				await IexecInstance.deposit({ from: iexecAdmin, value: 10000000 * 10 ** 9, gas: constants.AMOUNT_GAS_PROVIDED });
				break;

			case "Token":
				await RLCInstance.approveAndCall(IexecInstance.address, 10000000, "0x", { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED });
				break;
		}
		await Promise.all([
			IexecInstance.transfer(scheduler, 1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(worker1,   1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(worker2,   1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(worker3,   1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(worker4,   1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(worker5,   1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.transfer(user,      1000, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }),
		]);
	});

	/***************************************************************************
	 *                             TEST: creation                              *
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

	it("[Genesis] create orders", async () => {
		apporder = {
			app:                AppInstance.address,
			appprice:           3,
			volume:             1000,
			tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
			datasetrestrict:    constants.NULL.ADDRESS,
			workerpoolrestrict: constants.NULL.ADDRESS,
			requesterrestrict:  constants.NULL.ADDRESS,
			salt:               web3.utils.randomHex(32),
			sign:               constants.NULL.SIGNATURE,
		};
		datasetorder = {
			dataset:            DatasetInstance.address,
			datasetprice:       1,
			volume:             1000,
			tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
			apprestrict:        constants.NULL.ADDRESS,
			workerpoolrestrict: constants.NULL.ADDRESS,
			requesterrestrict:  constants.NULL.ADDRESS,
			salt:               web3.utils.randomHex(32),
			sign:               constants.NULL.SIGNATURE,
		};
		workerpoolorder = {
			workerpool:        WorkerpoolInstance.address,
			workerpoolprice:   25,
			volume:            1000,
			tag:               "0x0000000000000000000000000000000000000000000000000000000000000000",
			category:          4,
			trust:             10,
			apprestrict:       constants.NULL.ADDRESS,
			datasetrestrict:   constants.NULL.ADDRESS,
			requesterrestrict: constants.NULL.ADDRESS,
			salt:              web3.utils.randomHex(32),
			sign:              constants.NULL.SIGNATURE,
		};
		requestorder = {
			app:                AppInstance.address,
			appmaxprice:        3,
			dataset:            DatasetInstance.address,
			datasetmaxprice:    1,
			workerpool:         constants.NULL.ADDRESS,
			workerpoolmaxprice: 25,
			volume:             10,
			tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
			category:           4,
			trust:              4,
			requester:          user,
			beneficiary:        user,
			callback:           constants.NULL.ADDRESS,
			params:             "<parameters>",
			salt:               web3.utils.randomHex(32),
			sign:               constants.NULL.SIGNATURE,
		};

		apporder_hash        = odbtools.AppOrderTypedStructHash       (apporder       );
		datasetorder_hash    = odbtools.DatasetOrderTypedStructHash   (datasetorder   );
		workerpoolorder_hash = odbtools.WorkerpoolOrderTypedStructHash(workerpoolorder);
		requestorder_hash    = odbtools.RequestOrderTypedStructHash   (requestorder   );
	});

	/***************************************************************************
	 *                             TEST: App sign                             *
	 ***************************************************************************/
	it("presign app order #1", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(apporder_hash), "Error in app order presign");
		await expectRevert.unspecified(IexecInstance.signAppOrder(apporder, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }));
		assert.isFalse(await IexecInstance.viewPresigned(apporder_hash), "Error in app order presign");
	});

	it("presign app order #2", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(apporder_hash), "Error in app order presign");
		await IexecInstance.signAppOrder(apporder, { from: appProvider, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isTrue (await IexecInstance.viewPresigned(apporder_hash), "Error in app order presign");
	});

	/***************************************************************************
	 *                             TEST: Dataset sign                             *
	 ***************************************************************************/
	it("presign dataset order #1", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(datasetorder_hash), "Error in dataset order presign");
		await expectRevert.unspecified(IexecInstance.signDatasetOrder(datasetorder, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }));
		assert.isFalse(await IexecInstance.viewPresigned(datasetorder_hash), "Error in dataset order presign");
	});

	it("presign dataset order #2", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(datasetorder_hash), "Error in dataset order presign");
		await IexecInstance.signDatasetOrder(datasetorder, { from: datasetProvider, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isTrue (await IexecInstance.viewPresigned(datasetorder_hash), "Error in dataset order presign");
	});

	/***************************************************************************
	 *                             TEST: Workerpool sign                             *
	 ***************************************************************************/
	it("presign workerpool order #1", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(workerpoolorder_hash), "Error in workerpool order presign");
		await expectRevert.unspecified(IexecInstance.signWorkerpoolOrder(workerpoolorder, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }));
		assert.isFalse(await IexecInstance.viewPresigned(workerpoolorder_hash), "Error in workerpool order presign");
	});

	it("presign workerpool order #2", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(workerpoolorder_hash), "Error in workerpool order presign");
		await IexecInstance.signWorkerpoolOrder(workerpoolorder, { from: scheduler, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isTrue (await IexecInstance.viewPresigned(workerpoolorder_hash), "Error in workerpool order presign");
	});

	/***************************************************************************
	 *                           TEST: Request sign                            *
	 ***************************************************************************/
	it("presign request order #1", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(requestorder_hash), "Error in request order presign");
		await expectRevert.unspecified(IexecInstance.signRequestOrder(requestorder, { from: iexecAdmin, gas: constants.AMOUNT_GAS_PROVIDED }));
		assert.isFalse(await IexecInstance.viewPresigned(requestorder_hash), "Error in request order presign");
	});

	it("presign request order #2", async () => {
		assert.isFalse(await IexecInstance.viewPresigned(requestorder_hash), "Error in request order presign");
		await IexecInstance.signRequestOrder(requestorder, { from: user, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isTrue (await IexecInstance.viewPresigned(requestorder_hash), "Error in request order presign");
	});

	it("Matching presigned orders", async () => {
		await IexecInstance.matchOrders(apporder, datasetorder, workerpoolorder, requestorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
	});

});
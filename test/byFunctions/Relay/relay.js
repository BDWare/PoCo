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

contract('Relay', async (accounts) => {

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
	var IexecClerkInstance         = null;

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

		workers = [
			{ address: worker1, enclave: sgxEnclave,             raw: "iExec the wanderer" },
			{ address: worker2, enclave: constants.NULL.ADDRESS, raw: "iExec the wanderer" },
		];
		consensus = "iExec the wanderer";

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
	 *               TEST: App order signature (by appProvider)                *
	 ***************************************************************************/
	it("[Genesis] Generate app order", async () => {
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
		assert.isTrue(
			await IexecClerkInstance.verifySignature(
				appProvider,
				odbtools.AppOrderTypedStructHash(apporder),
				apporder.sign,
				{}
			),
			"Error with the validation of the apporder signature"
		);
	});

	/***************************************************************************
	 *           TEST: Dataset order signature (by datasetProvider)            *
	 ***************************************************************************/
	it("[Genesis] Generate dataset order", async () => {
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
		assert.isTrue(
			await IexecClerkInstance.verifySignature(
				datasetProvider,
				odbtools.DatasetOrderTypedStructHash(datasetorder),
				datasetorder.sign,
				{}
			),
			"Error with the validation of the datasetorder signature"
		);
	});

	/***************************************************************************
	 *        TEST: Workerpool order signature (by workerpoolProvider)         *
	 ***************************************************************************/
	it("[Genesis] Generate workerpool order", async () => {
		workerpoolorder = odbtools.signWorkerpoolOrder(
			{
				workerpool:        WorkerpoolInstance.address,
				workerpoolprice:   25,
				volume:            3,
				tag:               "0x0000000000000000000000000000000000000000000000000000000000000000",
				category:          4,
				trust:             1000,
				apprestrict:       constants.NULL.ADDRESS,
				datasetrestrict:   constants.NULL.ADDRESS,
				requesterrestrict: constants.NULL.ADDRESS,
				salt:              web3.utils.randomHex(32),
				sign:              constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(scheduler)
		);
		assert.isTrue(
			await IexecClerkInstance.verifySignature(
				scheduler,
				odbtools.WorkerpoolOrderTypedStructHash(workerpoolorder),
				workerpoolorder.sign,
				{}
			),
			"Error with the validation of the workerpoolorder signature"
		);
	});

	/***************************************************************************
	 *                 TEST: Request order signature (by user)                 *
	 ***************************************************************************/
	it("[Genesis] Generate request order", async () => {
		requestorder = odbtools.signRequestOrder(
			{
				app:                AppInstance.address,
				appmaxprice:        3,
				dataset:            DatasetInstance.address,
				datasetmaxprice:    1,
				workerpool:         constants.NULL.ADDRESS,
				workerpoolmaxprice: 25,
				volume:             1,
				tag:                "0x0000000000000000000000000000000000000000000000000000000000000000",
				category:           4,
				trust:              1000,
				requester:          user,
				beneficiary:        user,
				callback:           constants.NULL.ADDRESS,
				params:             "<parameters>",
				salt:               web3.utils.randomHex(32),
				sign:               constants.NULL.SIGNATURE,
			},
			wallets.addressToPrivate(user)
		);
		assert.isTrue(
			await IexecClerkInstance.verifySignature(
				user,
				odbtools.RequestOrderTypedStructHash(requestorder),
				requestorder.sign,
				{}
			),
			"Error with the validation of the requestorder signature"
		);
	});

	it(">> broadcastAppOrder", async () => {
		txMined = await IexecClerkInstance.broadcastAppOrder(apporder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecClerkInstance.address, "BroadcastAppOrder");
		assert.equal(events[0].args.apporder.app,                apporder.app               );
		assert.equal(events[0].args.apporder.appprice,           apporder.appprice          );
		assert.equal(events[0].args.apporder.volume,             apporder.volume            );
		assert.equal(events[0].args.apporder.datasetrestrict,    apporder.datasetrestrict   );
		assert.equal(events[0].args.apporder.workerpoolrestrict, apporder.workerpoolrestrict);
		assert.equal(events[0].args.apporder.requesterrestrict,  apporder.requesterrestrict );
		assert.equal(events[0].args.apporder.salt,               apporder.salt              );
		assert.equal(events[0].args.apporder.sign.v,             apporder.sign.v            );
		assert.equal(events[0].args.apporder.sign.r,             apporder.sign.r            );
		assert.equal(events[0].args.apporder.sign.s,             apporder.sign.s            );
	});

	it(">> broadcastDatasetOrder", async () => {
		txMined = await IexecClerkInstance.broadcastDatasetOrder(datasetorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecClerkInstance.address, "BroadcastDatasetOrder");
		assert.equal(events[0].args.datasetorder.dataset,            datasetorder.dataset           );
		assert.equal(events[0].args.datasetorder.datasetprice,       datasetorder.datasetprice      );
		assert.equal(events[0].args.datasetorder.volume,             datasetorder.volume            );
		assert.equal(events[0].args.datasetorder.apprestrict,        datasetorder.apprestrict       );
		assert.equal(events[0].args.datasetorder.workerpoolrestrict, datasetorder.workerpoolrestrict);
		assert.equal(events[0].args.datasetorder.requesterrestrict,  datasetorder.requesterrestrict );
		assert.equal(events[0].args.datasetorder.salt,               datasetorder.salt              );
		assert.equal(events[0].args.datasetorder.sign.v,             datasetorder.sign.v            );
		assert.equal(events[0].args.datasetorder.sign.r,             datasetorder.sign.r            );
		assert.equal(events[0].args.datasetorder.sign.s,             datasetorder.sign.s            );
	});

	it(">> broadcastWorkerpoolOrder", async () => {
		txMined = await IexecClerkInstance.broadcastWorkerpoolOrder(workerpoolorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecClerkInstance.address, "BroadcastWorkerpoolOrder");
		assert.equal(events[0].args.workerpoolorder.workerpool,        workerpoolorder.workerpool       );
		assert.equal(events[0].args.workerpoolorder.workerpoolprice,   workerpoolorder.workerpoolprice  );
		assert.equal(events[0].args.workerpoolorder.volume,            workerpoolorder.volume           );
		assert.equal(events[0].args.workerpoolorder.category,          workerpoolorder.category         );
		assert.equal(events[0].args.workerpoolorder.trust,             workerpoolorder.trust            );
		assert.equal(events[0].args.workerpoolorder.tag,               workerpoolorder.tag              );
		assert.equal(events[0].args.workerpoolorder.apprestrict,       workerpoolorder.apprestrict      );
		assert.equal(events[0].args.workerpoolorder.datasetrestrict,   workerpoolorder.datasetrestrict  );
		assert.equal(events[0].args.workerpoolorder.requesterrestrict, workerpoolorder.requesterrestrict);
		assert.equal(events[0].args.workerpoolorder.salt,              workerpoolorder.salt             );
		assert.equal(events[0].args.workerpoolorder.sign.v,            workerpoolorder.sign.v           );
		assert.equal(events[0].args.workerpoolorder.sign.r,            workerpoolorder.sign.r           );
		assert.equal(events[0].args.workerpoolorder.sign.s,            workerpoolorder.sign.s           );
	});

	it(">> broadcastRequestOrder", async () => {
		txMined = await IexecClerkInstance.broadcastRequestOrder(requestorder, { from: user, gasLimit: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		events = extractEvents(txMined, IexecClerkInstance.address, "BroadcastRequestOrder");
		assert.equal(events[0].args.requestorder.app,                requestorder.app               );
		assert.equal(events[0].args.requestorder.appmaxprice,        requestorder.appmaxprice       );
		assert.equal(events[0].args.requestorder.dataset,            requestorder.dataset           );
		assert.equal(events[0].args.requestorder.datasetmaxprice,    requestorder.datasetmaxprice   );
		assert.equal(events[0].args.requestorder.workerpool,         requestorder.workerpool        );
		assert.equal(events[0].args.requestorder.workerpoolmaxprice, requestorder.workerpoolmaxprice);
		assert.equal(events[0].args.requestorder.volume,             requestorder.volume            );
		assert.equal(events[0].args.requestorder.category,           requestorder.category          );
		assert.equal(events[0].args.requestorder.trust,              requestorder.trust             );
		assert.equal(events[0].args.requestorder.tag,                requestorder.tag               );
		assert.equal(events[0].args.requestorder.requester,          requestorder.requester         );
		assert.equal(events[0].args.requestorder.beneficiary,        requestorder.beneficiary       );
		assert.equal(events[0].args.requestorder.callback,           requestorder.callback          );
		assert.equal(events[0].args.requestorder.params,             requestorder.params            );
		assert.equal(events[0].args.requestorder.salt,               requestorder.salt              );
		assert.equal(events[0].args.requestorder.sign.v,             requestorder.sign.v            );
		assert.equal(events[0].args.requestorder.sign.r,             requestorder.sign.r            );
		assert.equal(events[0].args.requestorder.sign.s,             requestorder.sign.s            );
	});

});

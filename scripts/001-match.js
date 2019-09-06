var RLC                = artifacts.require("../node_modules/rlc-faucet-contract/contracts/RLC.sol");
var IexecHub           = artifacts.require("./IexecHub.sol");
var IexecClerk         = artifacts.require("./IexecClerk.sol");
var AppRegistry        = artifacts.require("./AppRegistry.sol");
var DatasetRegistry    = artifacts.require("./DatasetRegistry.sol");
var WorkerpoolRegistry = artifacts.require("./WorkerpoolRegistry.sol");
var App                = artifacts.require("./App.sol");
var Dataset            = artifacts.require("./Dataset.sol");
var Workerpool         = artifacts.require("./Workerpool.sol");

const { assert } = require('chai');

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

function toRLC(rlc) { return rlc*10**9; }

var iexecAdmin      = null;
var sgxEnclave      = null;
var appProvider     = null;
var datasetProvider = null;
var scheduler       = null;
var worker1         = null;
var worker2         = null;
var worker3         = null;
var worker4         = null;
var worker5         = null;
var user            = null;

module.exports = async function(callback) {
	try
	{
		console.log("# web3 version:", web3.version);
		console.log("ChainId:  ", await web3.eth.net.getId());
		console.log("ChainType:", await web3.eth.net.getNetworkType());

		var IexecClerkInstance         = await IexecClerk.at("0x8BE59dA9Bf70e75Aa56bF29A3e55d22e882F91bA");
		var RLCInstance                = await RLC.at(await IexecClerkInstance.token());
		var IexecHubInstance           = await IexecHub.at(await IexecClerkInstance.iexechub());
		var AppRegistryInstance        = await AppRegistry.at(await IexecHubInstance.appregistry());
		var DatasetRegistryInstance    = await DatasetRegistry.at(await IexecHubInstance.datasetregistry());
		var WorkerpoolRegistryInstance = await WorkerpoolRegistry.at(await IexecHubInstance.workerpoolregistry());

		console.log("IexecClerk:        ", IexecClerkInstance.address        );
		console.log("RLC:               ", RLCInstance.address               );
		console.log("IexecHub:          ", IexecHubInstance.address          );
		console.log("AppRegistry:       ", AppRegistryInstance.address       );
		console.log("DatasetRegistry:   ", DatasetRegistryInstance.address   );
		console.log("WorkerpoolRegistry:", WorkerpoolRegistryInstance.address);

		web3.eth.getAccounts(function(err, accounts) {
			assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
			iexecAdmin      = accounts[0];
			sgxEnclave      = accounts[0];
			appProvider     = accounts[1];
			datasetProvider = accounts[2];
			scheduler       = accounts[3];
			worker1         = accounts[4];
			worker2         = accounts[5];
			worker3         = accounts[6];
			worker4         = accounts[7];
			worker5         = accounts[8];
			user            = accounts[9];
		});

		assert.equal(await web3.eth.net.getId(), 1544020727674, "hardcoded orders are valid on chainId 1544020727674");


		apporder        = {"app":"0x60c1eBfBEE22687339D1c9Ff4b361cF6727241fF","appprice":1000000000,"volume":1000,"tag":"0x0000000000000000000000000000000000000000000000000000000000000000","datasetrestrict":"0x0000000000000000000000000000000000000000","workerpoolrestrict":"0x0000000000000000000000000000000000000000","requesterrestrict":"0x0000000000000000000000000000000000000000","salt":"0xfb388ffba5071d3d327a2f18033d72de","sign":"0x62f8b44d9420bca6e1a5426ce46f92382c6fe2ac6bd60a295e8c99414b80cb8710f38253cebed74793cfa18e1db7405be88a838d66b4d3f3af9b83711b796b261b"}
		datasetorder    = {"dataset":"0x385fFe1c9Ec3d6a0798eD7a13445Cb2B2de9fd09","datasetprice":3000000000,"volume":1000,"tag":"0x0000000000000000000000000000000000000000000000000000000000000000","apprestrict":"0x0000000000000000000000000000000000000000","workerpoolrestrict":"0x0000000000000000000000000000000000000000","requesterrestrict":"0x0000000000000000000000000000000000000000","salt":"0x36175c4cf51d585bcaa72d87c7ee0f99","sign":"0x6905f12c2dd11011dbf612e1439fecfc4199d04feb35103e4af0f0383e3970c637472ecd2aeda6ce664125c7aea754d88d3239aa63a84a64940e8ddfc9858f401b"}
		workerpoolorder = {"workerpool":"0x82D7300c32daFcF6bfdFcf53a2aeDfEF1D6C3415","workerpoolprice":5000000000,"volume":100,"tag":"0x0000000000000000000000000000000000000000000000000000000000000000","category":5,"trust":10000,"apprestrict":"0x0000000000000000000000000000000000000000","datasetrestrict":"0x0000000000000000000000000000000000000000","requesterrestrict":"0x0000000000000000000000000000000000000000","salt":"0x72fc6a26b88099241955855804b61bc0","sign":"0x161ecb937a1fe5358c0366473b56bf176189a393c13edeb08d3db1b04092630866b0d63fe6b16ec44c46f90bdc453f46b54abbc5cce6812c2c0654010abfd9401b"}
		requestorder    = {"app":"0x60c1eBfBEE22687339D1c9Ff4b361cF6727241fF","appmaxprice":1000000000,"dataset":"0x385fFe1c9Ec3d6a0798eD7a13445Cb2B2de9fd09","datasetmaxprice":3000000000,"workerpool":"0x0000000000000000000000000000000000000000","workerpoolmaxprice":5000000000,"volume":1,"tag":"0x0000000000000000000000000000000000000000000000000000000000000000","category":5,"trust":100,"requester":"0x9a43BB008b7A657e1936ebf5d8e28e5c5E021596","beneficiary":"0x9a43BB008b7A657e1936ebf5d8e28e5c5E021596","callback":"0x0000000000000000000000000000000000000000","params":"<params>","salt":"0xd16cb34a5ecee32f0f0a1afd1b2b5653","sign":"0x515dcbd584a6ab0f4488a3aab07eceeab13a95514ec0b460cacd63ee02f215472576ad30db507b905e01a3651ab77dd4095c1623fbff815122be8144c2302c4d1c"}

		apporderHash        = "0x92ed21ac46b1cd81c2834bf812fb5c9d0fe113ca8184acee4512729fc0cbb655"
		datasetorderHash    = "0xdf922299d8c6d99f6bd325ba9934138e8d1ce1621c91397a598f7a84af81143f"
		workerpoolorderHash = "0x1f498599e7235aecc313a7db7ea9f4cb585b074771fb1926ed057a409882b62a"
		requestorderHash    = "0x6816b9ff42eeb86e699aec809847650d0d9b3f2c0c6c01262d76bee09fa55538"


		assert.equal(await (await App.at       (apporder.app              )).owner(), appProvider    );
		assert.equal(await (await Dataset.at   (datasetorder.dataset      )).owner(), datasetProvider);
		assert.equal(await (await Workerpool.at(workerpoolorder.workerpool)).owner(), scheduler      );
		assert.equal(requestorder.requester,                                          user           );

		assert(await IexecClerkInstance.verifySignature(appProvider,     apporderHash,        apporder.sign       ));
		assert(await IexecClerkInstance.verifySignature(datasetProvider, datasetorderHash,    datasetorder.sign   ));
		assert(await IexecClerkInstance.verifySignature(scheduler,       workerpoolorderHash, workerpoolorder.sign));
		assert(await IexecClerkInstance.verifySignature(user,            requestorderHash,    requestorder.sign   ));

		balance = await IexecClerkInstance.viewAccount(appProvider    ); console.log("balance appProvider:    ", Number(balance.stake), Number(balance.locked));
		balance = await IexecClerkInstance.viewAccount(datasetProvider); console.log("balance datasetProvider:", Number(balance.stake), Number(balance.locked));
		balance = await IexecClerkInstance.viewAccount(scheduler      ); console.log("balance scheduler:      ", Number(balance.stake), Number(balance.locked));
		balance = await IexecClerkInstance.viewAccount(user           ); console.log("balance user:           ", Number(balance.stake), Number(balance.locked));

		console.log("consumed app:       ", Number(await IexecClerkInstance.viewConsumed(apporderHash       )));
		console.log("consumed dataset:   ", Number(await IexecClerkInstance.viewConsumed(datasetorderHash   )));
		console.log("consumed workerpool:", Number(await IexecClerkInstance.viewConsumed(workerpoolorderHash)));
		console.log("consumed request:   ", Number(await IexecClerkInstance.viewConsumed(requestorderHash   )));

		txMined = await IexecClerkInstance.matchOrders(
			apporder,
			datasetorder,
			workerpoolorder,
			requestorder,
			{ from: user }
		);
		events = extractEvents(txMined, IexecClerkInstance.address, "SchedulerNotice");
		console.log("MATCHED!")
		console.log("dealid:             ", events[0].args.dealid,                                            );
		console.log("consumed app:       ", Number(await IexecClerkInstance.viewConsumed(apporderHash       )));
		console.log("consumed dataset:   ", Number(await IexecClerkInstance.viewConsumed(datasetorderHash   )));
		console.log("consumed workerpool:", Number(await IexecClerkInstance.viewConsumed(workerpoolorderHash)));
		console.log("consumed request:   ", Number(await IexecClerkInstance.viewConsumed(requestorderHash   )));
	}
	catch (e)
	{
		callback(e)
	}
	finally
	{
		callback()
	}
}

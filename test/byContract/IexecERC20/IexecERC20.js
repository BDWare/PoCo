var RLC                = artifacts.require("rlc-faucet-contract/contracts/RLC");
var ERC1538Proxy       = artifacts.require("iexec-solidity/ERC1538Proxy");
var IexecInterface     = artifacts.require("IexecInterface");
var AppRegistry        = artifacts.require("AppRegistry");
var DatasetRegistry    = artifacts.require("DatasetRegistry");
var WorkerpoolRegistry = artifacts.require("WorkerpoolRegistry");

const { BN, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

const multiaddr = require('multiaddr');
const constants = require("../../../utils/constants");
const odbtools  = require('../../../utils/odb-tools');
const wallets   = require('../../../utils/wallets');

const {
	shouldBehaveLikeERC20,
	shouldBehaveLikeERC20Transfer,
	shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');

Object.extract = (obj, keys) => keys.map(key => obj[key]);

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('ERC20', async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");

	const initialSupply  = new BN(100);
	const initialHolder  = accounts[0];
	const recipient      = accounts[1];
	const anotherAccount = accounts[2];

	var RLCInstance                = null;
	var IexecInstance              = null;
	var AppRegistryInstance        = null;
	var DatasetRegistryInstance    = null;
	var WorkerpoolRegistryInstance = null;

	var categories = [];

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		/**
		 * Retreive deployed contracts
		 */
		RLCInstance                = await RLC.deployed();
		IexecInstance              = await IexecInterface.at((await ERC1538Proxy.deployed()).address);
		AppRegistryInstance        = await AppRegistry.deployed();
		DatasetRegistryInstance    = await DatasetRegistry.deployed();
		WorkerpoolRegistryInstance = await WorkerpoolRegistry.deployed();

	});

	/***************************************************************************
	 *                                                                         *
	 ***************************************************************************/
	beforeEach(async function () {
		txsMined = await Promise.all([
			IexecInstance.withdraw(await IexecInstance.balanceOf(initialHolder),  { from: initialHolder,  gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.withdraw(await IexecInstance.balanceOf(recipient),      { from: recipient,      gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.withdraw(await IexecInstance.balanceOf(anotherAccount), { from: anotherAccount, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(initialHolder,  0, { from: initialHolder,  gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(initialHolder,  0, { from: recipient,      gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(initialHolder,  0, { from: anotherAccount, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(recipient,      0, { from: initialHolder,  gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(recipient,      0, { from: recipient,      gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(recipient,      0, { from: anotherAccount, gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(anotherAccount, 0, { from: initialHolder,  gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(anotherAccount, 0, { from: recipient,      gas: constants.AMOUNT_GAS_PROVIDED }),
			IexecInstance.approve(anotherAccount, 0, { from: anotherAccount, gas: constants.AMOUNT_GAS_PROVIDED }),
		]);
		assert.isBelow(txsMined[ 0].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 1].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 2].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 3].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 4].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 5].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 6].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 7].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 8].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[ 9].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[10].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		assert.isBelow(txsMined[11].receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		this.frozenSupply = await IexecInstance.totalSupply();

		txMined = await RLCInstance.approveAndCall(IexecInstance.address, initialSupply, "0x", { from: initialHolder, gas: constants.AMOUNT_GAS_PROVIDED });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

		assert.equal(Number(await IexecInstance.balanceOf(initialHolder)),  initialSupply);
		assert.equal(Number(await IexecInstance.balanceOf(recipient)),      0);
		assert.equal(Number(await IexecInstance.balanceOf(anotherAccount)), 0);

		this.token = IexecInstance;

	});

	shouldBehaveLikeERC20('ERC20', initialSupply, initialHolder, recipient, anotherAccount);

	describe('decrease allowance', function () {
		describe('when the spender is not the zero address', function () {
			const spender = recipient;

			function shouldDecreaseApproval (amount) {
				describe('when there was no approved amount before', function () {
					it('reverts', async function () {
						await expectRevert.unspecified(this.token.decreaseAllowance(
							spender, amount, { from: initialHolder })
						);
					});
				});

				describe('when the spender had an approved amount', function () {
					const approvedAmount = amount;

					beforeEach(async function () {
						({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: initialHolder }));
					});

					it('emits an approval event', async function () {
						const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

						expectEvent.inLogs(logs, 'Approval', {
							owner: initialHolder,
							spender: spender,
							value: new BN(0),
						});
					});

					it('decreases the spender allowance subtracting the requested amount', async function () {
						await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('1');
					});

					it('sets the allowance to zero when all allowance is removed', async function () {
						await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
					});

					it('reverts when more than the full allowance is removed', async function () {
						await expectRevert.unspecified(
							this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder })
						);
					});
				});
			}

			describe('when the sender has enough balance', function () {
				const amount = initialSupply;

				shouldDecreaseApproval(amount);
			});

			describe('when the sender does not have enough balance', function () {
				const amount = initialSupply.addn(1);

				shouldDecreaseApproval(amount);
			});
		});

		describe('when the spender is the zero address', function () {
			const amount = initialSupply;
			const spender = constants.NULL.ADDRESS;

			it('reverts', async function () {
				await expectRevert.unspecified(this.token.decreaseAllowance(
					spender, amount, { from: initialHolder })
				);
			});
		});
	});

	describe('increase allowance', function () {
		const amount = initialSupply;

		describe('when the spender is not the zero address', function () {
			const spender = recipient;

			describe('when the sender has enough balance', function () {
				it('emits an approval event', async function () {
					const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

					expectEvent.inLogs(logs, 'Approval', {
						owner: initialHolder,
						spender: spender,
						value: amount,
					});
				});

				describe('when there was no approved amount before', function () {
					it('approves the requested amount', async function () {
						await this.token.increaseAllowance(spender, amount, { from: initialHolder });

						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
					});
				});

				describe('when the spender had an approved amount', function () {
					beforeEach(async function () {
						await this.token.approve(spender, new BN(1), { from: initialHolder });
					});

					it('increases the spender allowance adding the requested amount', async function () {
						await this.token.increaseAllowance(spender, amount, { from: initialHolder });

						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
					});
				});
			});

			describe('when the sender does not have enough balance', function () {
				const amount = initialSupply.addn(1);

				it('emits an approval event', async function () {
					const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

					expectEvent.inLogs(logs, 'Approval', {
						owner: initialHolder,
						spender: spender,
						value: amount,
					});
				});

				describe('when there was no approved amount before', function () {
					it('approves the requested amount', async function () {
						await this.token.increaseAllowance(spender, amount, { from: initialHolder });

						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
					});
				});

				describe('when the spender had an approved amount', function () {
					beforeEach(async function () {
						await this.token.approve(spender, new BN(1), { from: initialHolder });
					});

					it('increases the spender allowance adding the requested amount', async function () {
						await this.token.increaseAllowance(spender, amount, { from: initialHolder });

						expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
					});
				});
			});
		});

		describe('when the spender is the zero address', function () {
			const spender = constants.NULL.ADDRESS;

			it('reverts', async function () {
				await expectRevert.unspecified(
					this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'ERC20: approve to the zero address'
				);
			});
		});
	});

});
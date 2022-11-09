const { assert } = require("chai")

const Charity = artifacts.require('./Charity.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Charity', ([deployer, creator, contributor]) => {
    let charity

    before(async () => {
        charity = await Charity.deployed()
    })

    describe('deployment', async() => {
        it('deploys successfully', async() => {
            const address = await charity.address

            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await charity.name()

            assert.equal(name, "'Charity on web 3' is deployed")
        })
    })

    describe('campaigns', async() => {
        let result, campaignCount, demo

        before(async () => {
            result = await charity.createCampaign('example', web3.utils.toWei('0.1', 'Ether'), web3.utils.toWei('0.0001', 'Ether'), 'helloooooooo', 'imgggggg', 1650002181, {from: creator})
            campaignCount = await charity.campaignCount()
        })

        it('create campaign', async() => {
            //success
            assert.equal(campaignCount, 1)
            const event = result.logs[0].args

            //console.log(event.createAt.toString())
            //console.log(event.endAt.toString())

            assert.equal(event.id.toNumber(), campaignCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'example', 'name is correct')
            assert.equal(event.owner, creator, 'owner is correct')
            assert.equal(event.target, '100000000000000000', 'target is correct')
            assert.equal(event.minAmount, '100000000000000', 'min amount is correct')
            assert.equal(event.description, 'helloooooooo', 'description is correct')
            assert.equal(event.img, 'imgggggg', 'img is correct')
            assert.equal(event.balance, '0', 'balance is correct')
            assert.equal(event.endAt, '1650002181', 'end time is correct')
            assert.equal(event.donateCount, '0', 'donateCount is correct')

            //fairluer: product must have a name
            await charity.createCampaign('', web3.utils.toWei('0.1', 'Ether'), web3.utils.toWei('0.0001', 'Ether'), 'helloooooooo', 'imgggggg', 1650002181, {from: creator}).should.be.rejected;
            await charity.createCampaign('example', 0, web3.utils.toWei('0.0001', 'Ether'), 'helloooooooo', 'imgggggg', 1650002181, {from: creator}).should.be.rejected;

        })

        it('donates', async() => {
            //check balance of deployer
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(deployer)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)

            result = await charity.donateCampaign(deployer, campaignCount, {from: contributor, value: web3.utils.toWei('0.05', 'Ether')});

            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(deployer)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('0.05', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //check campaign balance
            demo = await charity.campaigns(campaignCount)

            assert.equal(demo.balance.toString(), price.toString(), "balance is correct")
            
            //check contributions
            let demoo, contributionCount;
            contributionCount = await charity.contributionCount()
            demoo = await charity.contributions(contributionCount)

            assert.equal(contributionCount.toString(), "1", "contribution count is correct")
            assert.equal(demoo.owner, contributor, "contributor is correct")
            assert.equal(demoo.amount.toString(), price.toString(), "amount is correct")
            assert.equal(demoo.campaignId.toString(), demo.id.toString(), "campaign id is correct")
            assert.equal(demo.donateCount, '1', 'donateCount is correct')
            //console.log(demoo)
        })

        it('donates more', async() => {
            //check balance of deployer
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(deployer)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)

            result = await charity.donateCampaign(deployer, campaignCount, {from: creator, value: web3.utils.toWei('0.05', 'Ether')});

            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(deployer)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('0.05', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //check campaign balance
            demo = await charity.campaigns(campaignCount)

            assert.equal(demo.balance.toString(), web3.utils.toWei('0.1', 'Ether').toString(), "balance is correct")
            
            //check contributions
            let demoo, contributionCount;
            contributionCount = await charity.contributionCount()
            demoo = await charity.contributions(contributionCount)

            assert.equal(contributionCount.toString(), "2", "contribution count is correct")
            assert.equal(demoo.owner, creator, "contributor is correct")
            assert.equal(demoo.amount.toString(), price.toString(), "amount is correct")
            assert.equal(demoo.campaignId.toString(), demo.id.toString(), "campaign id is correct")
            assert.equal(demo.donateCount, '2', 'donateCount is correct')
            //console.log(demoo)
        })

        it('create withdrawal', async() => {
            result = await charity.createWithdrawal(campaignCount, web3.utils.toWei('0.01', 'Ether'), "hihi", {from: creator})

            let withdrawalCount = await charity.withdrawalCount()
            let withdrawal = await charity.withdrawals(withdrawalCount)

            assert.equal(withdrawal.id.toString(), withdrawalCount.toString(), "id is correct")
            assert.equal(withdrawal.campaignId.toString(), campaignCount.toString(), "campaign id is correct")
            assert.equal(withdrawal.amount.toString(), web3.utils.toWei('0.01', 'Ether').toString(), "amount is correct")
            assert.equal(withdrawal.description, "hihi", "description is correct")
            assert.equal(withdrawal.approveCount.toString(), "0", "approveCount is correct")
            assert.equal(withdrawal.isApprove.toString(), "false", "isApprove is correct")
            assert.equal(withdrawal.isWithdraw.toString(), "false", "isWithdraw is correct")
            assert.equal(withdrawal.isCheck.toString(), "false", "isCheck is correct")
        })

        it('approve withdrawal', async() => {
            result = await charity.approveWithdrawal(1, {from: contributor})

            let withdrawalCount = await charity.withdrawalCount()
            let withdrawal = await charity.withdrawals(withdrawalCount)
            let withdrawalApprover = await charity.withdrawalApprovers(contributor)
            //let num = 1;

            assert.equal(withdrawal.isApprove.toString(), "false", "isApprove is correct")
            assert.equal(withdrawal.approveCount.toString(), "1", "approveCount is correct")
            assert.equal(withdrawalApprover.toString(), withdrawal.id.toString(), "withdrawalApprovers is correct")
            //assert.equal(withdrawal.history(withdrawal.approveCount).toString(), contributor.toString(), "contributor is correct")
        })

        it('approve withdrawal more', async() => {
            result = await charity.approveWithdrawal(1, {from: creator})

            let withdrawalCount = await charity.withdrawalCount()
            let withdrawal = await charity.withdrawals(withdrawalCount)
            let withdrawalApprover = await charity.withdrawalApprovers(creator)
            //let num = 1;

            assert.equal(withdrawal.isApprove.toString(), "true", "isApprove is correct")
            assert.equal(withdrawal.approveCount.toString(), "2", "approveCount is correct")
            assert.equal(withdrawalApprover.toString(), withdrawal.id.toString(), "withdrawalApprovers is correct")
            //assert.equal(withdrawal.methods.history(withdrawal.approveCount).call().toString(), contributor.toString(), "contributor is correct")
        })

        it('request withdrawal', async() => {
            result = await charity.getWithdrawal(1)

            let withdrawalCount = await charity.withdrawalCount()
            let withdrawal = await charity.withdrawals(withdrawalCount)

            assert.equal(withdrawal.isWithdraw.toString(), "true", "isWithdraw is correct")
        })

        it('get withdrawal', async() => {

            let withdrawalCount = await charity.withdrawalCount()
            let withdrawal = await charity.withdrawals(withdrawalCount)
            
            //get old balance of deployer
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(deployer)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)

            //get old balance of campaign
            let oldBalance
            oldBalance = await charity.campaigns(campaignCount)
            oldBalance = new web3.utils.BN(oldBalance.balance)

            //get old balance of creator
            let oldCreatorBalance
            oldCreatorBalance = await web3.eth.getBalance(creator)
            oldCreatorBalance = new web3.utils.BN(oldCreatorBalance)

            //console.log(withdrawal.amount.toString())

            result = await charity.confirmWithdrawal(withdrawalCount, {from: deployer, value: withdrawal.amount.toString()})

            withdrawal = await charity.withdrawals(withdrawalCount)
            assert.equal(withdrawal.isCheck.toString(), "true", "isCheck is correct")

            //get new balance of deployer
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(deployer)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            //get new balance of campaign
            let newBalance
            newBalance = await await charity.campaigns(campaignCount)
            newBalance = new web3.utils.BN(newBalance.balance)

            //get new balance of creator
            let newCreatorBalance
            newCreatorBalance = await web3.eth.getBalance(creator)
            newCreatorBalance = new web3.utils.BN(newCreatorBalance)

            let price
            price = withdrawal.amount.toString()
            price = new web3.utils.BN(price)

            //check deloyer balance
            let expectedBalance = newSellerBalance.add(price)
            assert.notEqual(oldSellerBalance.toString(), newSellerBalance.toString(), "deloyer balance is correct")

            //check campaign balance
            expectedBalance = newBalance.add(price)
            assert.equal(oldBalance.toString(), expectedBalance.toString(), "balance is correct")

            //check creator balance
            expectedBalance = oldCreatorBalance.add(price)
            assert.equal(newCreatorBalance.toString(), expectedBalance.toString(), "creator balance is correct")
        })

        /*it('sell product', async() => {
            //track the seller balence before puchase
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = new web3.utils.BN(oldSellerBalance)

            //success: buyer makes purchased
            result = await Charity.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')})
            
            //check logs
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'iphone 13', 'name is correct')
            assert.equal(event.price, '1000000000000000000', 'price is correct')
            assert.equal(event.owner, buyer, 'owner is correct')
            assert.equal(event.purchased, true, 'purchased is correct')

            //check that seller received funds
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)
            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //failure: tries to buy a product that does not exist, product must have valid id
            await Charity.purchaseProduct(99, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            
            //failure: buyers tries to buy without enough ehter
            await Charity.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;

            //failure: deployer tries to buy product, product can't be purchased twice
            await Charity.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
            
            //failure: buyer tries to buy again, buyer can't be the seller
            await Charity.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;

        })*/
    })
})
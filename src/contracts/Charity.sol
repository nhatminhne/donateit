pragma solidity ^0.5.0;

contract Charity {
    string public name;
    uint public campaignCount = 0;
    uint public contributionCount = 0;
    uint public withdrawalCount = 0;
    uint public withdrawalApproverCount = 0;
    mapping(uint => Campaign) public campaigns;
    mapping(uint => Contribution) public contributions;
    mapping(uint => Withdrawal) public withdrawals;
    mapping(address => uint) public withdrawalApprovers;

    struct Campaign {
        uint id;
        string name;
        address payable owner;
        uint target;
        uint minAmount;
        string description;
        string img;
        uint balance;
        uint total;
        uint createAt;
        uint endAt;
        uint donateCount;
    }

    struct Contribution {
        uint id;
        address owner;
        uint campaignId;
        uint amount;
        uint createAt;
    }

    struct Withdrawal {
        uint id;
        uint campaignId;
        uint amount;
        string description;
        uint approveCount;
        bool isApprove;
        uint createAt;
        bool isWithdraw;
        bool isCheck;
    }

    event CampaignCreated(
        uint id,
        string name,
        address payable owner,
        uint target,
        uint minAmount,
        string description,
        string img,
        uint balance,
        uint total,
        uint createAt,
        uint endAt,
        uint donateCount
    );

    constructor() public {
        name = "'Charity on web 3' is deployed";
    }

    function createCampaign(string memory _name, uint _target, uint _minAmount, string memory _description, string memory _img, uint _end) public {
        //require a valid name
        require(bytes(_name).length > 0);
        
        //require a valid target
        require(_target > 0);

        //require a valid min amount
        require(_minAmount > 0);
        require(_minAmount < _target);

        //require a valid description
        require(bytes(_description).length > 0);

        //require a valid img
        require(bytes(_img).length > 0);

        //require a valid end time
        require(_end > 0);

        //increment campaign count
        campaignCount++;

        //create campaignCount
        campaigns[campaignCount] = Campaign(campaignCount, _name, msg.sender, _target, _minAmount, _description, _img, 0, 0, now, _end, 0);

        //trigger an event
        emit CampaignCreated(campaignCount, _name, msg.sender, _target, _minAmount, _description, _img, 0, 0,now, _end, 0);
    }

    function donateCampaign(address payable _deloyer, uint _id) public payable {
        Campaign storage _campaign = campaigns[_id];

        //make sure the campaign has a valid id
        require(_campaign.id > 0 && _campaign.id <= campaignCount);

        //make sure the msg.value >= minAmount
        require(msg.value >= _campaign.minAmount);
        
        //increase balance
        _campaign.balance = _campaign.balance + msg.value;
        _campaign.total = _campaign.total + msg.value;

        //increase donateCount
        bool checkContributor = false;
        for(uint i = 1; i <= contributionCount; i++) {
            if(contributions[i].campaignId == _campaign.id) {
                //campaignContributors++;
                if(contributions[i].owner == msg.sender) {
                    checkContributor = true;
                }
            }
        }
        if(!checkContributor) {
            _campaign.donateCount++;
        }

        //_campaign.contributorCount ++;
        //_campaign.contributors[_campaign.contributorCount] = Contributor(_campaign.contributorCount, msg.sender, msg.value, now);
        //add new contribution
        contributionCount++;
        contributions[contributionCount] = Contribution(contributionCount, msg.sender, _id, msg.value, now);
        
        //transfer coins
        _deloyer.transfer(msg.value);
    }

    function createWithdrawal(uint _id, uint _amount, string memory _description) public {
        //require id > 0
        require(_id > 0);

        Campaign storage _campaign = campaigns[_id];

        //require owner = owner
        require(_campaign.owner == msg.sender);

        //require amount <= amount
        require(_amount <= _campaign.balance && _amount > 0);

        //require a valid description
        require(bytes(_description).length > 0);

        //increse withdrawalCount
        withdrawalCount++;

        //mapping(address => uint) storage empty;
        //add withdrawal
        withdrawals[withdrawalCount] = Withdrawal(withdrawalCount, _id, _amount, _description, 0, false, now, false, false);
    }

    function approveWithdrawal(uint _id) public {
        //require id > 0
        require(_id > 0);
        Withdrawal storage withdrawal = withdrawals[_id];
        Campaign storage _campaign = campaigns[withdrawal.campaignId];

        //require sender is contributor
        bool checkContributor = false;
        uint campaignContributors = _campaign.donateCount;
        for(uint i = 1; i <= contributionCount; i++) {
            if(contributions[i].campaignId == withdrawal.campaignId) {
                //campaignContributors++;
                if(contributions[i].owner == msg.sender) {
                    checkContributor = true;
                }
            }
        }
        require(checkContributor == true);

        //increase approveCount
        withdrawal.approveCount++;

        //increase withdrawalApproverCount
        withdrawalApproverCount++;

        //add to withdrawalApprovers
        withdrawalApprovers[msg.sender] = withdrawal.id;

        //get half of contributors
        uint halfContributors = campaignContributors / 2;

        //update isApprove
        if(halfContributors < withdrawal.approveCount) {
            withdrawal.isApprove = true;
        }
    }

    function getWithdrawal(uint _id) public {
        //require id > 0
        require(_id > 0);
        Withdrawal storage withdrawal = withdrawals[_id];
        //Campaign storage campaign = campaigns[withdrawal.campaignId];

        //require isApprove == true
        require(withdrawal.isApprove == true);

        //require isWithdraw == false
        require(withdrawal.isWithdraw == false);

        //update iswithdrawal
        withdrawal.isWithdraw = true;
    }

    function confirmWithdrawal(uint _id) public payable {
        //require id > 0
        require(_id > 0);
        Withdrawal storage withdrawal = withdrawals[_id];
        Campaign storage campaign = campaigns[withdrawal.campaignId];

        //require isApprove == true
        require(withdrawal.isApprove == true);

        //require isWithdraw == true
        require(withdrawal.isWithdraw == true);

        //isCheck == true
        withdrawal.isCheck = true;

        //transfer coins
        campaign.owner.transfer(msg.value);

        //update balance
        campaign.balance = campaign.balance - msg.value;
    }
}
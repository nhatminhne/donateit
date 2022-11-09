import { useState } from "react";
import loadBlockchainData from "./factory"

export default async function filterWithdrawal(campaignId) {
    //const [withdrawals, setWithdrawals] = useState([])
    const charityContract = await loadBlockchainData();
    let withdrawals = []

    //try {
        const withdrawalCount = await charityContract.methods.withdrawalCount().call();

        for (var i = 1; i <= withdrawalCount; i++) {
            const withdrawal = await charityContract.methods.withdrawals(i).call()
            if(withdrawal.campaignId == campaignId)
                withdrawals.push(withdrawal)
        }
    //}
    //catch(error) {}
    //console.log(withdrawals)

    return withdrawals;
}

export function approveCount(withdrawals) {
    let approversCount = 0;
    withdrawals.map(withdrawal => {
        if(withdrawal.isApprove == true)
            approversCount++
    })
    return approversCount;
}

export async function contributorsCount(campaignId) {
    const charityContract = await loadBlockchainData();
    const contributionCount = await charityContract.methods.contributionCount().call();
    let count = 0;
    for (var i = 1; i <= contributionCount; i++) {
        const contributor = await charityContract.methods.contributions(i).call()
        //console.log("hi: ", contributor)
        if(contributor.campaignId == campaignId)
            count++;
    }
    return count;
}
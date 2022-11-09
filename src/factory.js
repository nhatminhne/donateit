import Charity from "../src/abis/Charity.json"
import Web3 from "web3";

export default async function loadBlockchainData() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    
    const web3 = window.web3
    const networkId = await web3.eth.net.getId()
    
    const networkData = Charity.networks[networkId]
    if(networkData) {
      const charity = new web3.eth.Contract(Charity.abi, networkData.address)
      return charity;
    } else {
        window.alert('The contract not deployed to detected network, please change other network')
        return [];
    }
  }
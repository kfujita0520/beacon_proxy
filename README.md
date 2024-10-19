# Beacon Proxy Pattern

The objective is to create EtherStore contract, which receive ether and allow owner to withdraw ether, through Beacon Proxy pattern with Create2.
Also, upgrade created EtherStore contract to EtherStoreV2, then confirm that user can call same proxy address to use EtherStoreV2 contract function.

# Procedure
## 1. Deploy EtherStore contract
EtherStore contract should inherit Initializable contract of Openzepplin to make it upgradable with initializer function. 

## 2. Deploy EtherStoreFactory contract
EtherStoreFactory contract holds beacon contract which is UpgradeableBeacon contract of openzeppelin. This beacon contract will hold the implementation contract of EtherStore which is deployed in previous procedure.  

This contract will also be used when deploying new instance of EtherStore and upgrade EtherStore implementation upon request. 

## 3. Create EtherStore instance
Through deployEtherStore function of EtherStoreFactory contract, the instance contract of EtherStore will be created. Because we deploy with create2, the deployed address can be pre-calculated by calculateProxyAddress function. 

## 4. Confirm EtherStore behavior of deployed EtherStore.
The function of EtherStore (such as receive or withdraw) should be accessed through EtherStoreProxy contract which has been created in previous step. By doing so, user can keep using the same address even after the EtherStore contract will be updated in the future. 

## 5. Update EtherStore with EtherStoreV2
In order to update the EtherStore, following steps are required.
- Deploy EtherStoreV2 and get its deployed address
- Execute upgradeEtherStore function on EtherStoreFactory contract with EtherStoreV2 address as argument.

By doing so, the implementaion addresss of UpgradableBecon in EtherStore Contract will be updated. User can access the functions of EtherStoreV2 from the same EtherStoreProxy address, then. 

# Test

The procedure above has been verified in test script "etherStore.tx"
you can confirm with following command. 

```shell
npx hardhat test
```

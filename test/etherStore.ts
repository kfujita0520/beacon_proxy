import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("EtherStore with Beacon Proxy", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEtherStoreFactory() {
    const [deployer, owner1, owner2] = await hre.ethers.getSigners();
    //deploy ethstore
    const EthStoreContract = await hre.ethers.getContractFactory("EtherStore");
    const ethStore = await EthStoreContract.deploy();

    //deploy etherstoreFactory
    const EtherStoreFactoryContract = await hre.ethers.getContractFactory(
      "EtherStoreFactory"
    );
    const etherStoreFactory = await EtherStoreFactoryContract.deploy(
      ethStore.target
    );



    return { deployer, owner1, owner2, ethStore, etherStoreFactory };
  }

  async function deployBeaconProxy() {
    const [deployer, owner1, owner2] = await hre.ethers.getSigners();
    //deploy ethstore
    const EthStoreContract = await hre.ethers.getContractFactory("EtherStore");
    const ethStore = await EthStoreContract.deploy();

    //deploy etherstoreFactory
    const EtherStoreFactoryContract = await hre.ethers.getContractFactory(
      "EtherStoreFactory"
    );
    const etherStoreFactory = await EtherStoreFactoryContract.deploy(
      ethStore.target
    );

    //deploy etherstore through factory
    const salt = hre.ethers.id("salt-test");
    await etherStoreFactory.deployEtherStore(salt, owner1.address);
    const ethStoreAddress = await etherStoreFactory.calculateProxyAddress(
      salt,
      owner1.address
    );

    //get etherstore proxy instance
    const ethStoreProxy = await hre.ethers.getContractAt(
      "EtherStore",
      ethStoreAddress
    );

    return { deployer, owner1, owner2, etherStoreFactory, ethStoreProxy, ethStoreAddress };
  }

  describe("EtherStore by Beacon Proxy", function () {

    it("Deploy EtherStoreProxy", async function () {
      const { deployer, owner1, ethStore, etherStoreFactory } = await loadFixture(deployEtherStoreFactory);
      //deploy etherstore through factory
      const salt = hre.ethers.id("salt-test");
      await etherStoreFactory.deployEtherStore(salt, owner1.address);
      const ethStoreAddress = await etherStoreFactory.calculateProxyAddress(
        salt,
        owner1.address
      );

      //confirm above two addresses are same
      expect(await etherStoreFactory.proxies(0)).to.equal(ethStoreAddress);

      //get etherstore proxy instance
      const ethStoreProxy = await hre.ethers.getContractAt(
        "EtherStore",
        ethStoreAddress
      );

      expect(await ethStoreProxy.owner()).to.equal(owner1.address);

    });

    it("EtherStore", async function () {
      const { deployer, owner1, etherStoreFactory, ethStoreProxy } = await loadFixture(deployBeaconProxy);
      //send eth from deployer to etheeStore 
      await deployer.sendTransaction({
        to: ethStoreProxy.target,
        value: 1000,
      });
      //condirm balance of ethstore is 1000
      expect(await hre.ethers.provider.getBalance(ethStoreProxy.target)).to.equal(1000);
      //withdraw from ethstore
      //Failed if non-owner withdraw
      await expect(ethStoreProxy.withdraw(1000)).to.be.revertedWith("Only owner can withdraw");
      await ethStoreProxy.connect(owner1).withdraw(1000);
      //confirm balance of ethstore is 0
      expect(await hre.ethers.provider.getBalance(ethStoreProxy.target)).to.equal(0);

    });

    

    it("Upgrade EtherStore", async function () {
      const { deployer, owner1, owner2, etherStoreFactory, ethStoreProxy, ethStoreAddress } = await loadFixture(deployBeaconProxy);
      
      //print deployer address
      console.log("deployer: ", deployer.address);
      console.log("owner1: ", owner1.address);
      console.log("the owner of etherStoreProxy: ", await ethStoreProxy.owner());
      console.log("etherStoreProxy: ", ethStoreProxy.target);
      console.log("etherStoreFactory: ", etherStoreFactory.target);

      //confirm beacon implementation is ethstoreV2
      const beaconAddress = await etherStoreFactory.beacon();
      const beacon = await hre.ethers.getContractAt("UpgradeableBeacon", beaconAddress);
      //expect(await beacon.getImplementation()).to.equal(ethStoreV2.target);
      console.log("beacon owner: ", await beacon.owner());

      //deployEtherStoreV2
      const EthStoreV2Contract = await hre.ethers.getContractFactory("EtherStoreV2");
      const ethStoreV2 = await EthStoreV2Contract.deploy();

      //upgrade ethstore
      await etherStoreFactory.upgradeEtherStore(ethStoreV2.target);

      
      const ethStoreProxy2 = await hre.ethers.getContractAt("EtherStoreV2", ethStoreAddress);
      //send eth from deployer to etheeStore 
      await deployer.sendTransaction({
        to: ethStoreProxy2.target,
        value: 3000,
      });
      //withdraw from ethstore
      //Failed if previous-owner withdraw
      await expect(ethStoreProxy2.withdraw(1000)).to.be.revertedWith("Only owner can withdraw");
      
      await ethStoreProxy2.connect(owner1).withdraw(1000);
      //confirm balance of ethstore is 2000
      expect(await hre.ethers.provider.getBalance(ethStoreProxy2.target)).to.equal(2000);

      await ethStoreProxy2.connect(owner1).withdrawAll();
      expect(await hre.ethers.provider.getBalance(ethStoreProxy2.target)).to.equal(0);

    });

   
  });


});

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract EtherStoreFactory {
    UpgradeableBeacon public beacon;
    uint256 public proxyCount = 0;
    mapping(uint256 => address) public proxies;

    event ProxyDeployed(address proxyAddress, address ownerAddress, uint256 proxyCount);

    constructor(address _initialImplementation) {
        beacon = new UpgradeableBeacon(_initialImplementation, address(this));
        //beacon.transferOwnership(address(this));
    }

    // Deploy a BeaconProxy deterministically using CREATE2
    function deployEtherStore(bytes32 salt, address owner) external returns (address) {
         // Encode the constructor argument
        bytes memory data = abi.encodeWithSignature("initialize(address)", owner);
        //bytes memory data = abi.encode(owner);
        BeaconProxy proxy = new BeaconProxy{salt: salt}(address(beacon), data);
        emit ProxyDeployed(address(proxy), owner, proxyCount);
        proxies[proxyCount] = address(proxy);

        // Increment the proxy count
        proxyCount++;

        return address(proxy);
    }

    // Predict the address of the proxy
    function calculateProxyAddress(bytes32 salt, address owner) external view returns (address) {
        //bytes memory data = abi.encode(owner);
        bytes memory data = abi.encodeWithSignature("initialize(address)", owner);
        bytes memory bytecode = abi.encodePacked(type(BeaconProxy).creationCode, abi.encode(beacon, data));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }

    function upgradeEtherStore(address newImplementation) external{
        beacon.upgradeTo(newImplementation);
        
    }
}
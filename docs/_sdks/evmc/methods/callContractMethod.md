### callContractMethod

```
await sdk.callContractMethod(methodName, params);
```

Calls method in the blockchain with given params.

#### Parameters
1. `methodName` - `String`: Name of contract method
2. `params` - `Array`: List of parameters passed to the method

#### Returns

***Response is the same as from [Web3.js](https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html#methods-mymethod-call)***

`Promise` returns `Mixed`: The return value(s) of the smart contract method. If it returns a 
single value, it’s returned as is. If it has multiple return values they are returned as an 
object with properties and indices:

#### Example

```
await sdk.callContractMethod('getOwner', ['0x0000000000000000000000000000000000000000']);
```
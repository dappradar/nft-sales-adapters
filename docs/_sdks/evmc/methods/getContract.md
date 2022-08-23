### getContract

```
await sdk.getContract();
```

Get [web3.eth.Contract](https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html)
instance.

This method is using contract address from provider's,
which is using this SDK, config. It is also using ABI
which is parsed by calling `sdk.getAbi()` function.

#### Returns

`Promise` returns an instance of [web3.eth.Contract](https://web3js.readthedocs.io/en/v1.7.4/web3-eth-contract.html).

#### Example

```
console.log(typeof await sdk.getContract());

> 'web3.eth.Contract`
```
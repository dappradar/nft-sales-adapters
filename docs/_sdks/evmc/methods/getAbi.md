### getAbi

```
await sdk.getAbi();
```

Get ABI of smart contract if it is defined.

By default, it is searching for ABI in `*providers-folder*/*provider-name*/abi.json`.

If the ABI is stored anywhere else, you can define 
path to it in the provider's config.

#### Returns

`Promise` returns `Array`

#### Example

```
console.log(await sdk.getAbi());

> [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "balance_",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    ...
]
```
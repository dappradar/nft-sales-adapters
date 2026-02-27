### getCalls

```
await sdk.getCalls(offset);
```

Get calls from the indexer.

#### Parameters
1. `offset` - `Number`: Offset from the first call

#### Returns

`Promise` returns list of calls.

#### Example

```
const offset = 10;
await sdk.getCalls(offset);

> [
    {
        "type": "transaction",
        "id": 248,
        "level": 23,
        "timestamp": "2018-06-30T18:04:27Z",
        "block": "BMWVEwEYw9m5iaHzqxDfkPzZTV4rhkSouRh3DkVMVGkxZ3EVaNs",
        "hash": "ooRAfDhmSNiwEdGQi2M5qt27EVtBdh3WD7LX3Rpoet3BTUssKTT",
        "counter": 2,
        "sender": {
            "address": "tz1NKVAxzJusWgKewn4LEViPSQVRE5Kg6XFV"
        },
        "gasLimit": 105968,
        "gasUsed": 105868,
        "storageLimit": 0,
        "storageUsed": 0,
        "bakerFee": 0,
        "storageFee": 0,
        "allocationFee": 0,
        "target": {
            "alias": "Vested funds 1",
            "address": "KT1WPEis2WhAc2FciM2tZVn8qe6pCBe9HkDp"
        },
        "targetCodeHash": -1762929104,
        "amount": 0,
        "parameter": {
            "entrypoint": "default",
            "value": {
                "R": null
            }
        },
        "status": "applied",
        "hasInternals": false
    },
    ...
]
```
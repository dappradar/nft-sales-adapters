### getOperation

```
await sdk.getOperation(hash);
```

Get calls from the indexer.

#### Parameters
1. `hash` - `String`: Hash of operation

#### Returns

`Promise` returns list of calls.

#### Example

```
const hash = 'ooRAfDhmSNiwEdGQi2M5qt27EVtBdh3WD7LX3Rpoet3BTUssKTT';
await sdk.getOperation(hash);

> [
    {
        "type": "reveal",
        "id": 247,
        "level": 23,
        "timestamp": "2018-06-30T18:04:27Z",
        "block": "BMWVEwEYw9m5iaHzqxDfkPzZTV4rhkSouRh3DkVMVGkxZ3EVaNs",
        "hash": "ooRAfDhmSNiwEdGQi2M5qt27EVtBdh3WD7LX3Rpoet3BTUssKTT",
        "sender": {
            "address": "tz1NKVAxzJusWgKewn4LEViPSQVRE5Kg6XFV"
        },
        "counter": 1,
        "gasLimit": 0,
        "gasUsed": 0,
        "bakerFee": 0,
        "status": "applied"
    },
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
        "storage": {
            "vesting": {
                "vesting_schedule": {
                    "next_payout": "2018-07-30T05:30:00Z",
                    "payout_interval": "2629800"
                },
                "vesting_quantities": {
                    "vested_balance": "199041301565",
                    "vesting_increment": "199041301565"
                }
            },
            "key_info": {
                "key_groups": [
                    {
                        "signatories": [
                            "edpkvS5QFv7KRGfa3b87gg9DBpxSm3NpSwnjhUjNBQrRUUR66F7C9g",
                            "edpktm3zeGMzfzFuqgyYftt7uNyVRANTjrJCdU7bURwgGb9bRZwmJq",
                            "edpkucCnbeGPWNvGHeTQ5hENHPrc8txBBiQXNphu3jgv9KYbhQBovd",
                            "edpkuNjKKT48xBoT5asPrWdmuM1Yw8D93MwgFgVvtca8jb5pstzaCh"
                        ],
                        "group_threshold": "2"
                    },
                    ...
                ],
                "overall_threshold": "4"
            },
            "pour_info": {
                "pour_dest": "tz3bTdwZinP8U1JmSweNzVKhmwafqWmFWRfk",
                "pour_authorizer": "edpkv4vUwGVVYnmmuafbEirXrXhT1bzcuJ2xQ3SHfeUVUr56YwgipC"
            },
            "replay_counter": "6500"
        },
        "status": "applied",
        "hasInternals": false
    },
    ...
]
```
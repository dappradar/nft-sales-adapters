# Providers

## Files structure

```
src
    providers
        provider-path
            index.ts
            abi.json (optional)
            ... other provider-related files
```

---

## Provider's structure

```
import AvalancheSDK from '../../sdk/avalanche';
// Dependencies imports
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";

// Interfaces

class Provider {
    name: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    sdk: any;
    // Define other variables if needed

    constructor () {}
    run = async () => {}
    stop = async () => {}
    process = async (event: EventData): Promise<ISaleEntity | undefined> => {}
    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {};
}

export default Provider;
```

---

## Functions

[run function](methods/run.md ':include')

---

[stop function](methods/stop.md ':include')

---

[process function](methods/process.md ':include')

---

[addToDatabase function](methods/addToDatabase.md ':include')

---

## Interfaces

[ISaleEntity interface](interfaces/ISaleEntity.md ':include')

---

## Introduction

```
        /// Do some stuff to get this data:
        
        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: 'NFT contract address',
            nftId: 'NFT token ID',
            token: 'Payment token address',
            tokenSymbol: 'Payment token symbol',
            amount: 'Amount of NFTs sold,
            price: 'Price in original token used for sale',
            priceUsd: 'Price converted to USD',
            seller: 'Seller address',
            buyer: 'Buyer address',
            soldAt: 'Time of sale in format: YYYY-MM-DD HH:mm:ss',
            blockNumber: 'Block number of transaction',
            transactionHash: 'Transaction hash'
        };
        
        return this.addToDatabase(entity);
        ```



[//]: # (These conditions must be matched:)
[//]: # ()
[//]: # (* Provider files must be stored under `src/adapters`)
[//]: # (  folder.)
[//]: # (* Folder name must be the same as it is defined in)
[//]: # (  `this.name` property in the provider class.)
[//]: # (* Main file of provider must be named `index.ts`.)
[//]: # (  There is no space for interpretations here.)
[//]: # (* Provider must have functions named `run` and `process`.)

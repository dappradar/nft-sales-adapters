# Adapters

## Files structure

```
src
    adapters
        adapter-path
            index.ts
            abi.json (optional)
            ... other adapter-related files
```

---

## Adapter's structure

```
import { ISaleEntity } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";
import BasicProvider, {IBasicProviderOptions} from "../../sdk/basic-provider";

class Adapter extends BasicProvider {
    constructor (options: IBasicProviderOptions) {}
    process = async (event: EventData): Promise<ISaleEntity | undefined> => {}
    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {};
}

export default Adapter;
```

---

## Progress tracking

To expedite the integration process, the progress of the importer is tracked and stored in
the `data/metadata/:providerName.txt` file. Once the provider has finished processing all events within a given block
range (e.g., from
block `1` to `1000`), it will store the last block (`1000`) as the starting point. When the provider is restarted, it
will commence syncing from block `1000` instead of the initial block (in this example, `1`).

Progress can be reset by either removing the metadata file or clearing its content. Additionally, progress can be
advanced by updating the block number in the file to the desired block number.

---

## Functions

[process function](methods/process.md ':include')

---

[addToDatabase function](methods/addToDatabase.md ':include')

---

## Interfaces

[ISaleEntityNFT interface](interfaces/ISaleEntityNFT.md ':include')

---

[ISaleEntity interface](interfaces/ISaleEntity.md ':include')

## Config

All adapters must be configured in `src/config/adapters.ts` file. There are multiple arrays dedicated for every
supported chain. If properly setup, with single `index.ts` and `abi.json` file it is possible to run multiple providers
without duplicating the code.

Example config:

```
import {IBasicProviderOptions} from "../sdk/basic-provider";

const ETHEREUM: IBasicProviderOptions[] = [
    {
        name: "element-ethereum-1",
        basicProvider: "element-bp-1",
        block: 15080677,
        deprecatedAt: 15794002,
        contract: "0x20f780a973856b93f63670377900c1d2a50a77c4",
        chainId: 1,
        defaultPaymentToken: "0x0000000000000000000000000000000000000000",
    },
    ... other providers
];

export const ADAPTERS = [
    ...ETHEREUM,
]
```

Properties of config:

| Property              | Type         | Required | Description                                                                                                                          |
|-----------------------|--------------|----------|--------------------------------------------------------------------------------------------------------------------------------------|
| `name`                | `string`     | ✅        | Name of adapter                                                                                                                      |
| `basicProvider`       | `string`     | ✅        | Name of basic provider (name of adapter folder)                                                                                      |
| `block`               | `number`     | ✅        | Block number as initial point of sync                                                                                                |
| `deprecatedAt`        | `number`     |          | Block number of last sale in the transaction if smart contract used for the adapter is deprecated and will not be used in the future |
| `contract`            | `string`     | ✅        | Smart contract address of marketplace                                                                                                |
| `chainId`             | `number`     | ✅        | Chain ID (you can find it in the chain SDK file)                                                                                     |
| `defaultPaymentToken` | `string`     |          |                                                                                                                                      |
| `events`              | `string[]`   |          | List of events. Usually it is defined in the adapter's file and will not change                                                      |
| `blockRange`          | `number`     |          |                                                                                                                                      |
| `chunkSize`           | `number`     |          |                                                                                                                                      |
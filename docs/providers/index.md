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
import { ISaleEntity } from "../../sdk/Interfaces";
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

[ISaleEntityNFT interface](interfaces/ISaleEntityNFT.md ':include')

---

[ISaleEntity interface](interfaces/ISaleEntity.md ':include')
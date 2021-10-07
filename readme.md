### Before you start

You should already have requested and have an API key from DappRadar, the goal of this project is to create your own nft sales tracker for DappRadar

Create a copy of environment configuration

```shell
cp .env.dist .env
```

Currently support binance smart chain, matic, and ethereum

### How to update

First try adding your dapp adapter inside src/adapters,
the SDK should contain all the methods you would need and should be updated as a last resort,
to see if you adapter is working run the tester, if it passed feel free to request a merge

### How to run services

First update your .env file to contain your key,
after that create you adapter inside adapters/my-adapter, the naming should be lowercase
with multiple words divided by -, for example: my-adapter

To run & test your adapter simply while being in root write:
`node src/tester ../adapters/my-adapter/index.js`

It should run a validator and your adapter if you pass feel free to make a pull request!

### How to build adapters

Each adapter is expected to have certain methods, those can be found in tester/util.js named ENTITY_KEYS
please try to follow the example ENS adapter as close as possible in terms of functionality

Each adapter should import and use EVMC sdk, feel free to extend this SDK with diffrent parameters.

```this.name = "ens";
this.symbol = null;
this.token = "0x0000000000000000000000000000000000000000";
this.protocol = "ethereum";
this.block = 12855192;
this.contract = "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5"
```

Regarding adapters contructor values, the name should be the same as the adapters/ location name,
the block should be the starting block when the contract was released and the contract is self explanatory.

The websocket for web3 is defined in /sdk/util.js, inside the headers please choose your supported blockchain, this file should not be commited, but feel free to change it while working on the adapter.

/sdk/metadata.js is our inner file and should not be updated in any way also as it's used by out internal tracking.

### Metadata and symbols

Metadata like price of token at that certain point is handled via axios call to process.env.DAPPRADAR_META_URL,
each call is requested towards APIs limit, if the limit is hit you will get a faulty response.

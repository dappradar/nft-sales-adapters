# DappRadar NFT Sales Adapters

This repository hosts the adapters for integrating NFT collections or marketplaces on
[dappradar.com/nft](https://dappradar.com/nft) and other products.

Repository is maintained through community support, to add your collection or marketplace please read
[contribution guidelines](https://github.com/dappradar/nft-sales-adapters#guidelines).

## Guidelines

1. Integrations are done for marketplaces, not for separate collections (unless a collection also has a native marketplace, like CryptoPunks).
2. Integration must be done in a way that it tracks all the sale events on the marketplace (sale, auction, etc.)
3. Only sales on that specific marketplace should be counted. For example, if one smart contract is used by 3 NFT marketplaces, your integration needs to differentiate those and only include sales done on that specific marketplace.

## API key

Apply for API key by filling out form [https://forms.gle/5E8hsZhyd94X9a3M7](https://forms.gle/5E8hsZhyd94X9a3M7).

API keys necessary to simplify testing of the adapters and even if we will review untested adapters,
process will be a lot faster if developers tests adapters using API key before submitting a pull request.

## Contribution

-   Fork the GitHub repository
-   Get the API key by filling up the [form](https://forms.gle/5E8hsZhyd94X9a3M7)
-   Build an adapter inside _adapters/_ directory
-   Test adapter code using provided testing tool
-   Create a pull request to the main repository

## Repository Structure

All adapters should have separated from other and have its own directory, for example:

-   _adapters/ens_
-   _adapters/axie-infinity_

Inside adapter directory there should be at least 2 files

-   `abi.json` - ABI of the contract used by collection or marketplace
-   `index.js` - adapter code

## Technical Documentation

Supported blockchain protocols

-   Ethereum
-   BNB Chain (Binance Smart Chain)
-   Polygon
-   Avalanche

### Environment Configuration

Create a copy of environment configuration

```shell
cp .env.dist .env
```

### How to run services

First update your _.env_ file to contain your key,
after that create your adapter inside _adapters/my-adapter_, the naming should be lowercase
with multiple words divided by `-`, for example: `my-adapter`

To run & test your adapter simply while being in root write:

```shell
node ./tester/test.js ../adapters/my-adapter/index.js
```

It should run a validator and your adapter if you pass make a pull request!

### How to build adapters

Each adapter is expected to have certain methods, those can be found in _tester/util.js_ named `ENTITY_KEYS`
please try to follow the example ENS adapter as close as possible in terms of functionality

Each adapter should import and use EVMC SDK, feel free to extend this SDK with different parameters.

```
this.name = "ens";
this.symbol = null;
this.token = "0x0000000000000000000000000000000000000000";
this.protocol = "ethereum";
this.block = 12855192;
this.contract = "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5"
```

Regarding adapters constructor values, the name should be the same as the _adapters/_ location name,
the block should be the starting block when the contract was released and the contract is self-explanatory.

The websocket for web3 is defined in _/sdk/util.js_, inside the headers please choose your supported blockchain,
this file should not be committed, but feel free to change it while working on the adapter.

_/sdk/metadata.js_ is our inner file and should not be updated in any way also as it's used by out internal tracking.

### Metadata and Symbols

Metadata like price of token at that certain point is handled via axios call to `process.env.DAPPRADAR_META_URL`,
each call is requested towards APIs limit, if the limit is hit you will get a faulty response.

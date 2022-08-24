### ISaleEntity

| Param              | type               | Required | Description                                                                     |
|--------------------|--------------------|----------|---------------------------------------------------------------------------------|
| `providerName`     | `String`           | ✅        | Name of provider which is tracked. It must be the same as parameter `this.name` |
| `providerContract` | `String`           | ✅        | Address of contract which is tracked                                            |
| `protocol`         | `String`           | ✅        | Name of protocol                                                                |
| `nftContract`      | `String`           | ✅        | Address of NFT                                                                  |
| `nftId`            | `String`           | ✅        | ID of NFT                                                                       |
| `token`            | `String`           | ✅        | Address of payment token                                                        |
| `tokenSymbol`      | `String`           | ✅        | Symbol of payment token                                                         |
| `amount`           | `Number`           | ✅        | Amount of NFTs sold. It is used for ERC1155 sales only                          |
| `price`            | `Number` or `Null` | ✅        | Price in original payment token (e.g. `ETH`, `BNB`, `MATIC`, ...)               |
| `priceUsd`         | `Number` or `Null` | ✅        | Price in USD                                                                    |
| `seller`           | `String`           | ✅        | Address of seller                                                               |
| `buyer`            | `String`           | ✅        | Address of buyer                                                                |
| `soldAt`           | `String`           | ✅        | Time when sale was made. Format must match: `YYYY-MM-DD HH:mm:ss`               |
| `blockNumber`      | `Number`           | ✅        | Block number of transaction                                                     |
| `transactionHash`  | `String`           | ✅        | Transaction hash                                                                |

Properties `token` and `tokenSymbol` must be parsed using 
our API, like in the example. Do not use third party 
services.

Property `priceUsd` must be calculated using token price
that was parsed from our API. Do not use third party
services.

If provider is using `EVM` compatible chain (e.g.
Ethereum, Avalanche, ...), all addresses must be in
lowercase.
### ISaleEntity

| Param              | Type               | Required | Description                                                                     |
|--------------------|--------------------|----------|---------------------------------------------------------------------------------|
| `providerName`     | `String`           | ✅        | Name of provider which is tracked. It must be the same as parameter `this.name` |
| `providerContract` | `String`           | ✅        | Address of contract which is tracked                                            |
| `chainId`          | `String`           | ✅        | ID of Chain that is stored in SDK file                                          |
| `nfts`             | `ISaleEntityNFT[]` | ✅        | List of NFTs                                                                    |
| `token`            | `String`           | ✅        | Address of payment token                                                        |
| `price`            | `BigNumber`        | ✅        | Price in original payment token (e.g. `ETH`, `BNB`, `MATIC`, ...)               |
| `seller`           | `String`           | ✅        | Address of seller                                                               |
| `buyer`            | `String`           | ✅        | Address of buyer                                                                |
| `soldAt`           | `Moment`           | ✅        | Time when sale was made                                                         |
| `blockNumber`      | `Number`           | ✅        | Block number of transaction                                                     |
| `transactionHash`  | `String`           | ✅        | Transaction hash                                                                |

If provider is using `EVM` compatible chain (e.g.
Ethereum, Avalanche, ...), all addresses must be in
lowercase.
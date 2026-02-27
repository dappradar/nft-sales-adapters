### IOperation

| Param                 | type                                                                                                                                                              | Required |
|-----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `type`                | `String`                                                                                                                                                          | ❌        |
| `id`                  | `Number`                                                                                                                                                          | ✅        |
| `level`               | `Number`                                                                                                                                                          | ✅        |
| `timestamp`           | `String`                                                                                                                                                          | ✅        |
| `block`               | `String`                                                                                                                                                          | ✅        |
| `hash`                | `String`                                                                                                                                                          | ✅        |
| `counter`             | `Number`                                                                                                                                                          | ✅        |
| `initiator`           | `IAlias`                                                                                                                                                          | ✅        |
| `sender`              | `IAlias`                                                                                                                                                          | ✅        |
| `nonce`               | `Number`                                                                                                                                                          | ❌        |
| `gasLimit`            | `Number`                                                                                                                                                          | ✅        |
| `gasUsed`             | `Number`                                                                                                                                                          | ✅        |
| `storageLimit`        | `Number`                                                                                                                                                          | ✅        |
| `storageUsed`         | `Number`                                                                                                                                                          | ✅        |
| `bakerFee`            | `Number`                                                                                                                                                          | ✅        |
| `storageFee`          | `Number`                                                                                                                                                          | ✅        |
| `allocationFee`       | `Number`                                                                                                                                                          | ✅        |
| `target`              | `IAlias`                                                                                                                                                          | ✅        |
| `amount`              | `Number`                                                                                                                                                          | ✅        |
| `parameter`           | `ITransactionParameter`                                                                                                                                           | ✅        |
| `storage`             | `Object`.<br/>There might be any number of parameters within this parameter with key of type `string` and value type of `any`                                     | ❌        |
| `diffs`               | Array of `IBigMapDiff`                                                                                                                                            | ❌        |
| `status`              | `String`                                                                                                                                                          | ✅        |
| `errors`              | `Object`.<br/>There might be a list of objects within this parameter which mighth have any number of parameters with key of type `string` and value type of `any` | ✅        |
| `hasInternals`        | `Boolean`                                                                                                                                                         | ✅        |
| `tokenTransfersCount` | `Number`                                                                                                                                                          | ✅        |
### isDeprecated

```
await sdk.isDeprecated(block);
```

Calls method in the blockchain with given params.

#### Parameters
1. `block` - `Number`: Block number to compare

#### Returns

`Boolean` - returns `true` if given block is higher than `provider.deprecatedAtBlock`

#### Example

```
// provider.deprecatedAtBlock = 123456788

await sdk.isDeprecated(123456789);

> true
```
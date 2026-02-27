### getCurrentBlock

```
await sdk.getCurrentBlock();
```

Returns latest mined block.

#### Returns

`Promise` returns `Integer`: Latest minted block.

#### Example

```
console.log(await sdk.getCurrentBlock());

> 123456789
```
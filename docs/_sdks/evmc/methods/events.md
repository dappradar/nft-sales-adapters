### events

```
await sdk.events(block, currentBlock);
```

Start process to sync logs by event name from the past to the latest minted block
and subscribe for new logs by event name.

#### Parameters
1. `block` - `Number`: Block to start catching logs from
2. `currentBlock` - `Number`: Latest minted block

#### Returns

`Promise` returns `Mixed`: This promise might be resolved or rejected only
if any error appears.

#### Example

```
await sdk.events(123456789, 234567890);
```
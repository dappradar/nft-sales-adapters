### eventsByTopics

```
await sdk.eventsByTopics(block, currentBlock);
```

Start process to sync logs by topic from the past to the latest minted block
and subscribe for new logs by topic.

#### Parameters
1. `block` - `Number`: Block to start catching logs from
2. `currentBlock` - `Number`: Latest minted block

#### Returns

`Promise` returns `Mixed`: This promise might be resolved or rejected only
if any error appears.

#### Example

```
await sdk.eventsByTopics(123456789, 234567890);
```
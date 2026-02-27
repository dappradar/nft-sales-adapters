### `private` _subscribeEventsByTopics

```
await sdk._subscribeEventsByTopics(block);
```

Subscribe for new logs by topic. This is only used by `sdk.eventsByTopics` function.

#### Parameters
1. `block` - `Number`: Start listening for new logs from this block

#### Returns

`Promise` returns `void`: This promise might be resolved or rejected only
if any error appears.

#### Example

```
await sdk._subscribeEventsByTopics(123456789);
```
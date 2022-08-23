### `private` _subscribeEvents

```
await sdk._subscribeEvents(block);
```

Subscribe for new logs by event name. This is only used by `sdk.events` function.

#### Parameters
1. `block` - `Number`: Start listening for new logs from this block

#### Returns

`Promise` returns `void`: This promise might be resolved or rejected only
if any error appears.

#### Example

```
await sdk._subscribeEvents(123456789);
```
### `private` _getOptions

```
await sdk._getOptions();
```

Get options for WebSocket.

#### Returns

`object`

#### Example

```
console.log(await sdk._getOptions());

> {
    headers: {
        key: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
        protocol: 'ethereum'
    },
    clientConfig: {
        maxReceivedFrameSize: 100 * 1000 * 1000,
        maxReceivedMessageSize: 100 * 1000 * 1000
    },
    reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 1000,
        onTimeout: false
    }
}
```
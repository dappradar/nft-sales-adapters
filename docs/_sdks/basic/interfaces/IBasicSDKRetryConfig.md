### IBasicSDKRetryConfig

| Param             | type                      | Required | Description                                                                            | Default |
|-------------------|---------------------------|----------|----------------------------------------------------------------------------------------|---------|
| `maxRetries`      | `Number`                  | ❌        | Number of retries before process crash                                                 | `10`    |
| `customParams`    | `Object`                  | ❌        | List of custom parameters to add to the logging event. It is for logging purposes only |         |
| `callback`        | `() => void`              | ✅        | Function that will be called and retried if needed                                     |         |
| `successCallback` | `(response: any) => void` | ❌        | Function that will be called if `callback` function has been finished successfully     |         |
| `errorCallback`   | `(response: any) => void` | ❌        | Function that will be called if `callback` function has crashed                        |         |
| `retryAfter`      | `Number`                  | ❌        | Delay after crash before retry in seconds                                              | `10`    |
| `action`          | `String`                  | ❌        | Action name to add to the logging event. It is for logging purposes only               |         |

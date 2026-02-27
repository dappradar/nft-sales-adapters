### IBasicSDKError

| Param          | type              | Required | Description                                                                        | Default |
|----------------|-------------------|----------|------------------------------------------------------------------------------------|---------|
| `fileName`     | `String`          | ❌        | Filename of caller                                                                 |         |
| `method`       | `String`          | ❌        | Method of caller                                                                   |         |
| `state`        | `String`: `error` | ✅        |                                                                                    | `error` |
| `providerName` | `String`          | ✅        | Name of provider that is using SDK that is calling                                 |         |
| `retries`      | `String`          | ✅        | Number of retries before crashing                                                  | `10`    | 
| `duration`     | `String`          | ❌        | Time in milliseconds that was taken for running function last time before crashing |         |

There might be more parameters with key of type `string`
and value type of `any`.

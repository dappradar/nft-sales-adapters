### retry

```
await sdk.retry(config);
```

Call function and return response. If that function 
crashes, it will be retried defined number of times 
before crashing the service. 

Depending on `config` parameter, this method will call
given method and, if it crashes, retries it for defined
amount of times. Config details can be found here: [IBasicSDKRetryConfig](#ibasicsdkretryconfig).

#### Parameters
1. `config` - [IBasicSDKRetryConfig](#ibasicsdkretryconfig): Config object

#### Returns

`Promise` returns `Mixed`: Promise returns response of 
`callback` function.

#### Example

```
await sdk.retry(IBasicSDKRetryConfig);
```
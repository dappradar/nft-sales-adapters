### getCaller

```
await sdk.getCaller();
```

Used aside with `retry` method. When `retry` method 
crashes, it will call `getCaller` function to get
filename and method of the caller.

#### Returns

`IBasicSDKCaller`

#### Example

```
console.log(await sdk.getCaller());

> {
    fileName: 'file.ts',
    method: 'callMethod'
}
```
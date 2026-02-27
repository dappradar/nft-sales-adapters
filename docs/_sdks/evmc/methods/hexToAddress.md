### hexToAddress

```
await sdk.hexToAddress(input);
```

Get address from Hex string in lowercase.

#### Parameters
1. `input` - `String`: Hex value

#### Returns

`String`: EVM address in lowercase.

#### Example

```
console.log(sdk.hexToAddress('0x000000000000000000000000ACEfB70212b02af4fc296286c32fDF924345C427'));

> '0xacefb70212b02af4fc296286c32fdf924345c427'
```
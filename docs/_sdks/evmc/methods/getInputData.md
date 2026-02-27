### getInputData

```
await sdk.getInputData(input);
```

Parse array from transaction input data string.

#### Parameters
1. `input` - `String`: Transaction input data

#### Returns

`Array`

#### Example

```
const data = '0xa22cb4650000000000000000000000001e0049783f008a0085193e00003d00cd54003c710000000000000000000000000000000000000000000000000000000000000001'
console.log(sdk.getInputData(data));

> [
    '0000000000000000000000001e0049783f008a0085193e00003d00cd54003c71',
    '0000000000000000000000000000000000000000000000000000000000000001'
]
```
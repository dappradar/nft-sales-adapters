### hexToTopic

```
sdk.hexToTopic(input);
```

Parse array from data string.

#### Parameters
1. `input` - `String`

#### Returns

`String`

#### Example

```
const data = '0xacefb70212b02af4fc296286c32fdf924345c427'
console.log(sdk.hexToTopic(data));

> '0x000000000000000000000000acefb70212b02af4fc296286c32fdf924345c427'
```
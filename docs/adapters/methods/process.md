### `process`

This function will process transaction and will check
if given transaction is a legit sale.

#### Parameters
Depending on the SDK, it might take `event`, `log`, 
`operation` or anything else as an argument. This is the
only data that you get initially to track sales.

#### Returns
`Promise` returns `ISaleEntity` or `undefined`. If given
data is not a sale, then, it can be skipped by returning
`undefined`. Otherwise, it must return `ISaleEntity`.
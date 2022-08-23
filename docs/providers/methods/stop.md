### `stop`

This function is used to stop syncing process. It might
do some additional actions before stopping to parse 
events, e.g. log something to the console.

Finally, function `sdk.stop()` must be called to stop
syncing process in the SDK.
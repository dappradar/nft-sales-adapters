### `run`

This function is used to start syncing process. It might
do some additional actions before starting to parse events, e.g.
parsing payment token data.

Finally, function `sdk.run()` must be called to start
syncing process in the SDK.
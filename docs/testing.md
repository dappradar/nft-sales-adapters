## Testing

Before opening pull request make sure that your provider
passed the test.

Tests can be run by running command:
```
Pattern:
> ts-node path-to-tester path-to-adapter

Example:
> ts-node ./src/tester/test.ts ../adapters/my-adapter/index.ts
```

If tests were **not passed**, the process will crash with
details.\
If tests were **passed**, process will print message `Tests were passed`.
# SDK for EVM compatible chains

## Introduction

For the interactions with Ethereum chain we are using [Web3.js](https://web3js.readthedocs.io/).
Ethereum is running on Ethereum virtual machine - _EVM_, which allows us to use Web3.js for
other chains that are compatible with _EVM_, e.g. `Polygon`, `BNB Chain`, etc.

This SDK is basically a middleware between caller and `Web3.js` with this additional functionality:

- Log every action that was made via this SDK.
- If any of the action responded with an error, repeat it _n_ (`10` by default) amount of times
  before exiting the service.

EVMC SDK extends [Basic SDK](/_sdks/basic/sdk.md)

---

## Parameters

[web3 parameter](parameters/web3.md ':include')

---

[running parameter](parameters/running.md ':include')

---

[range parameter](parameters/range.md ':include')

---

[protocol parameter](parameters/protocol.md ':include')

---

[chunkSize parameter](parameters/chunkSize.md ':include')

---

## Methods

[getBlock function](methods/getBlock.md ':include')

---

[getCurrentBlock function](methods/getCurrentBlock.md ':include')

---

[getPastLogs function](methods/getPastLogs.md ':include')

---

[getPastEvents function](methods/getPastEvents.md ':include')

---

[getTransaction function](methods/getTransaction.md ':include')

---

[getTransactionReceipt function](methods/getTransactionReceipt.md ':include')

---

[callContractMethod function](methods/callContractMethod.md ':include')

---

[stop function](methods/stop.md ':include')

---

[getOptions function](methods/_getOptions.md ':include')

---

[connect function](methods/connect.md ':include')

---

[ensureWeb3 function](methods/ensureWeb3.md ':include')

---

[run function](methods/run.md ':include')

---

[isDeprecated function](methods/isDeprecated.md ':include')

---

[eventsByTopics function](methods/eventsByTopics.md ':include')

---

[_subscribeEventsByTopics function](methods/_subscribeEventsByTopics.md ':include')

---

[events function](methods/events.md ':include')

---

[_subscribeEvents function](methods/_subscribeEvents.md ':include')

---

[hexToAddress function](methods/hexToAddress.md ':include')

---

[txDataToArray function](methods/txDataToArray.md ':include')

---

[getInputData function](methods/getInputData.md ':include')

---

[getContract function](methods/getContract.md ':include')

---

[hexToTopic function](methods/hexToTopic.md ':include')

---

[getAbi function](methods/getAbi.md ':include')

---
const metadata = require("./metadata");
const Web3 = require("web3");
const _ = require("lodash");
const fs = require("fs");
const { WS_PROXY_URL, options, asyncTimeout } = require("./util");

// Ethereum Virtual Machine compatible
class EVMC {
    constructor(provider) {
        this.web3 = null;
        this.provider = provider;
        this.running = true;
        this.range = 100;
    }

    stop = () => {
        this.running = false;
    };

    connect = () => {
        // @see https://web3js.readthedocs.io/en/v1.2.11/web3.html#configuration
        const Web3ClientSocket = new Web3.providers.WebsocketProvider(WS_PROXY_URL, options);
        this.web3 = new Web3(Web3ClientSocket);

        this.web3.currentProvider.once("error", function(error) {
            console.error("Error in web3", error);
            throw new Error(error);
        });
    };

    // Ensure Web3 connection established.
    // Returns existing Web3 connection or creates new one of it does not exists.
    ensureWeb3 = () => {
        if (!this.web3) {
            this.connect();
        }

        return this.web3;
    };

    /**
     * @param number int
     * @returns {Promise<*>}
     */
    getBlock = async number => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const response = await this.web3.eth.getBlock(number);

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Get block",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getBlock",
                    block: number,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @returns {Promise<int>}
     */
    getCurrentBlock = async () => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const response = await this.web3.eth.getBlockNumber();

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }
                return response;
            } catch (err) {
                error = {
                    action: "Get current block",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getCurrentBlock",
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @param options Object
     * @returns {Promise<[]>}
     */
    getPastLogs = async options => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const response = await this.web3.eth.getPastLogs(options);

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Get past logs",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getPastLogs",
                    options,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @param eventName string
     * @param options object
     * @returns {Promise<[]>}
     */
    getPastEvents = async (eventName, options) => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const contract = await this.getContract();
                const response = await contract.getPastEvents(eventName, options);

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Get past events",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getPastEvents",
                    eventName,
                    options,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @param transactionHash string
     * @returns {Promise<{}>}
     */
    getTransaction = async transactionHash => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const response = await this.web3.eth.getTransaction(transactionHash);

                if (null === response) {
                    throw new Error("NULL response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Get transaction",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getTransaction",
                    transactionHash,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        if (error.error === "NULL response") {
            return null;
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @param transactionHash string
     * @returns {Promise<{}>}
     */
    getTransactionReceipt = async transactionHash => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const response = await this.web3.eth.getTransactionReceipt(transactionHash);

                if (null === response) {
                    throw new Error("NULL response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Get transaction receipt",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "getTransactionReceipt",
                    transactionHash,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        if (error.error === "NULL response") {
            return null;
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * @param methodName string
     * @param params array
     * @returns {Promise<*>}
     */
    callContractMethod = async (methodName, params = []) => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                this.ensureWeb3();
                const contract = await this.getContract();
                const response = await contract.methods[methodName](...params).call();

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }

                return response;
            } catch (err) {
                error = {
                    action: "Call contract method",
                    error: err.message,
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "callContractMethod",
                    methodName,
                    params,
                };
                console.dir(error);
                await asyncTimeout(1);
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * Run events parser
     *
     * @returns {Promise<void>}
     */
    run = async () => {
        // @todo this needs to have a reset for all providers where the range should be bigger
        if ("undefined" !== typeof this.provider.blockRange) {
            this.range = this.provider.blockRange;
        }
        this.ensureWeb3();
        const block = await metadata.block(this.provider);
        const currentBlock = await this.getCurrentBlock();

        if ("topics" === this.provider.searchType) {
            await this.eventsByTopics(block, currentBlock, this.provider);
        } else {
            await this.events(block, currentBlock, this.provider);
        }
    };

    /**
     * Check if contract is active based on the block number
     *
     * @param block int
     * @returns {boolean}
     */
    isDeprecated = block => {
        if ("undefined" !== typeof this.provider.deprecatedAtBlock && block >= this.provider.deprecatedAtBlock) {
            console.log(`${this.provider.name} provider deprecated at ${this.provider.deprecatedAtBlock}`);

            return true;
        }

        return false;
    };

    /**
     * Parse events by topics (signatures)
     *
     * @param block int
     * @param currentBlock int
     * @returns {Promise<void>}
     */
    eventsByTopics = async (block, currentBlock) => {
        let run = true;
        let from = block;
        console.log("range", this.range);
        let to = block + this.range;

        while (run) {
            console.log(`processing past blocks for ${this.provider.name} from block ${from}`);
            const events = await this.getPastLogs({
                fromBlock: from,
                toBlock: to,
                address: this.provider.contract,
                topics: this.provider.eventsTopics,
            });

            if (events.length) {
                console.log("Events in block range: " + events.length);
                const chunkedEvents = _.chunk(events, this.chunkSize);

                for (const i in chunkedEvents) {
                    const promises = [];
                    for (const event of chunkedEvents[i]) {
                        promises.push(this.provider.process(event));
                    }
                    await Promise.all(promises);
                }
            }

            await metadata.update(this.provider, to);
            if (this.isDeprecated(to)) {
                return;
            }

            from = to + 1;
            to = to + this.range;
            // If we don't update current block number, we'll always check with the same block.
            // That might cause us trying to parse events from future.
            currentBlock = await this.getCurrentBlock();

            if (to > currentBlock) {
                run = false;
                await metadata.update(this.provider, currentBlock);
                await this._subscribeEventsByTopics(currentBlock);
            }
        }
    };

    /**
     * Subscribe to events by topics (signatures) since specified block
     * @param block
     * @returns {Promise<void>}
     * @private
     */
    _subscribeEventsByTopics = async block => {
        let retries = 0;
        let error = null;
        while (10 > retries) {
            try {
                await new Promise(() => {
                    const web3 = this.ensureWeb3();
                    web3.eth
                        .subscribe(
                            "logs",
                            {
                                address: this.provider.contract,
                                topics: this.provider.eventsTopics,
                            },
                            (err, log) => {
                                if (err) {
                                    console.log("ethereum event subscription error " + err, err);
                                    throw err;
                                }

                                if (log) {
                                    console.log(`event for ${this.provider.name} on block ${log.blockNumber}`);

                                    this.provider.process(log);
                                    metadata.update(this.provider, log.blockNumber - 1);
                                }
                            },
                        )
                        .on("connected", () => {
                            console.log(`subscribed to ${this.provider.name} events by topics from block ${block}`);
                        });
                });
            } catch (err) {
                error = {
                    action: "Subscribe to events by topics",
                    error: err.message || "n/a",
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "_subscribeEventsByTopics",
                    exception: err,
                };
                console.dir(error);
                await asyncTimeout();
                retries++;
            }
        }

        console.error(error);
        await asyncTimeout();
        process.exit(1);
    };

    /**
     * Parse events by event name
     *
     * @param contract
     * @param block int
     * @param currentBlock int
     * @returns {Promise<void>}
     */
    events = async (block, currentBlock) => {
        let run = true;
        let from = block;
        let to = block + this.range;
        if (to > currentBlock) {
            to = currentBlock;
        }

        while (run && this.running) {
            console.log(`processing past blocks for ${this.provider.name} from block ${from} to block ${to}`);

            for (const eventName of this.provider.events) {
                if (!this.running) {
                    break;
                }
                const events = await this.getPastEvents(eventName, {
                    fromBlock: from,
                    toBlock: to,
                });
                if (events.length) {
                    console.log(
                        `found ${events.length} events for ${this.provider.name} in range from block ${from} to ${to}`,
                    );
                    const chunks = _.chunk(events, this.chunkSize);

                    for (const chunk in chunks) {
                        const promises = [];
                        for (const event of chunks[chunk]) {
                            promises.push(this.provider.process(event));
                        }

                        await Promise.all(promises);
                    }
                }
            }

            await metadata.update(this.provider, to);

            if (this.isDeprecated(to)) {
                return;
            }

            from = to + 1;
            to = to + this.range;
            // If we don't update current block number, we'll always check with the same block.
            // That might cause us trying to parse events from future.
            currentBlock = await this.getCurrentBlock();

            if (to >= currentBlock) {
                run = false;
                await metadata.update(this.provider, currentBlock);
                await this._subscribeEvents(currentBlock);
            }
        }
        return;
    };

    /**
     * Subscribe to events by event names since specified block
     *
     * @param contract
     * @param block int
     * @returns {Promise<void>}
     * @private
     */
    _subscribeEvents = async block => {
        for (const name of this.provider.events) {
            try {
                const contract = await this.getContract();
                contract.events[name]({ fromBlock: block }, async (error, event) => {
                    if (error) {
                        throw new Error(error);
                    }

                    if (event) {
                        this.provider.process(event);
                        metadata.update(this.provider, event.blockNumber - 1);
                    }
                }).on("connected", id => {
                    console.log(`subscribed to ${this.provider.name} event ${name} with ID ${id} from block ${block}`);
                });
            } catch (err) {
                console.error({
                    action: "Subscribe to events",
                    error: err.message || "n/a",
                    provider: this.provider.name,
                    sdk: this.constructor.name,
                    function: "_subscribeEvents",
                });
                await asyncTimeout();
                process.exit(1);
            }
        }
    };

    /**
     * Parse address from hexadecimal string§
     * @param input string
     * @returns {string}
     */
    hexToAddress = input => ("0x" + input.substr(input.length - 40)).toLowerCase();

    /**
     * Parse array from transaction input data string
     *
     * @param input string
     * @returns {[]}
     */
    txDataToArray = input => input.substring(2).match(/.{1,64}/g) || [];

    /**
     * Parse array from transaction input data string
     *
     * @param input string
     * @returns {RegExpMatchArray}
     */
    getInputData = input => input.substring(10).match(/.{1,64}/g);

    /**
     * @returns {Contract}
     */
    getContract = async () => {
        const web3 = this.ensureWeb3();

        return new web3.eth.Contract(await this.getAbi(), this.provider.contract);
    };

    /**
     *
     * @param input string
     * @returns {string}
     */
    hexToTopic = input => {
        const string = "0000000000000000000000000000000000000000000000000000000000000000" + input.substring(2);
        return "0x" + string.slice(string.length - 64);
    };

    /**
     * @returns {Promise<*|any>}
     */
    getAbi = async () => {
        if (this.provider.hasOwnProperty("getAbi")) {
            return await this.provider.getAbi();
        }

        if (this.provider.hasOwnProperty("abi") && "object" === typeof this.provider.abi) {
            return this.provider.abi;
        }

        if (!this.provider.hasOwnProperty("pathToAbi")) {
            throw new Error("invalid path to abi, must provider full path");
        }

        const stringifiedAbi = await fs.promises.readFile(this.provider.pathToAbi, "utf8");
        const abi = JSON.parse(stringifiedAbi || "[]");
        this.provider.abi = abi;
        return abi;
    };
}

module.exports = EVMC;

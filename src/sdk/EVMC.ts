import metadata from "./metadata";
import Web3 from "web3";
import _ from "lodash";
import fs from "fs";
import { asyncTimeout } from "./util";
import { WS_PROXY_URL, AVAILABLE_PROTOCOLS, API_KEY } from "./constants";
import BasicSDK from "./basic-sdk";

import { IDappRadarAPIHeaders } from "./Interfaces";
import { Log, TransactionReceipt, Transaction, PastLogsOptions } from "web3-core";
import { BlockTransactionString } from "web3-eth";
import { EventData, PastEventOptions, Contract } from "web3-eth-contract";

// Ethereum Virtual Machine compatible
class EVMC extends BasicSDK {
    web3: any;
    running: boolean;
    range: number;
    protocol?: string;
    chunkSize?: number;

    constructor(provider: any) {
        super(provider);

        this.web3 = null;
        this.running = true;
        this.range = 100;
    }

    stop = (): void => {
        this.running = false;
    };

    private _getOptions = (): object => {
        const headers: IDappRadarAPIHeaders = {
            key: API_KEY,
            protocol: AVAILABLE_PROTOCOLS.ETH,
        };

        const customOptions = {
            headers,
            clientConfig: {
                maxReceivedFrameSize: 100 * 1000 * 1000,
                maxReceivedMessageSize: 100 * 1000 * 1000,
            },
            reconnect: {
                auto: true,
                delay: 5000,
                maxAttempts: 1000,
                onTimeout: false,
            },
        };

        if (this.protocol) {
            customOptions.headers.protocol = this.protocol;
        }

        return customOptions;
    };

    connect = (): void => {
        // @see https://web3js.readthedocs.io/en/v1.2.11/web3.html#configuration
        const customOptions = this._getOptions();

        const Web3ClientSocket = new Web3.providers.WebsocketProvider(WS_PROXY_URL, customOptions);
        this.web3 = new Web3(Web3ClientSocket);
        this.web3.currentProvider.once("error", (error: Error): void => {
            console.error("Error in web3", error);
            throw error;
        });
    };

    // Ensure Web3 connection established.
    // Returns existing Web3 connection or creates new one of it does not exists.
    ensureWeb3 = (): any => {
        if (!this.web3) {
            this.connect();
        }

        return this.web3;
    };

    getBlock = async (number: number): Promise<BlockTransactionString> => {
        const callback = async () => {
            const response: any = await this.web3.eth.getBlock(number);

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                blockNumber: number,
            },
        });
    };

    getCurrentBlock = async (): Promise<number> => {
        const callback = async () => {
            this.ensureWeb3();
            const response: number | null = await this.web3.eth.getBlockNumber();

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.retry({
            callback,
        });
    };

    getPastLogs = async (options: PastLogsOptions): Promise<Log[]> => {
        const callback = async () => {
            this.ensureWeb3();
            const response: any = await this.web3.eth.getPastLogs(options);

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                options,
            },
        });
    };

    getPastEvents = async (eventName: string, options: PastEventOptions): Promise<EventData[]> => {
        const callback = async () => {
            this.ensureWeb3();
            const contract = await this.getContract();
            const response = await contract.getPastEvents(eventName, options);

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                eventName,
                options,
            },
        });
    };

    getTransaction = async (transactionHash: string): Promise<Transaction> => {
        const callback = async () => {
            this.ensureWeb3();
            const response = await this.web3.eth.getTransaction(transactionHash);

            if (null === response) {
                throw new Error("NULL response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                transactionHash,
            },
        });
    };

    getTransactionReceipt = async (transactionHash: string): Promise<TransactionReceipt> => {
        const callback = async () => {
            this.ensureWeb3();
            const response = await this.web3.eth.getTransactionReceipt(transactionHash);

            if (null === response) {
                throw new Error("NULL response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                transactionHash,
            },
        });
    };

    callContractMethod = async (methodName: string, params: any[] = []): Promise<any> => {
        const callback = async () => {
            this.ensureWeb3();
            const contract = await this.getContract();
            const response = await contract.methods[methodName](...params).call();

            if (null === response) {
                await asyncTimeout(60);
                throw new Error("null response");
            }

            return response;
        };

        return this.retry({
            callback,
            customParams: {
                methodName,
                params,
            },
        });
    };

    getPastTransactions = async (from: number, to: number): Promise<Transaction[]> => {
        const callback = async () => {
            this.ensureWeb3();

            const contract = this.provider.contract;

            const responseFinal = <Transaction[]>[];

            for (let i = from; i < to; i++) {
                const response = await this.web3.eth.getBlock(i, true);

                if (null === response) {
                    throw new Error("NULL response");
                }

                const transactions = <Transaction[]>response.transactions;

                const contractTransactions = <Transaction>(
                    transactions.find(({ to }) => to !== undefined && to?.toLowerCase() === contract)
                );

                if (contractTransactions !== undefined) {
                    responseFinal.push(contractTransactions);
                }
            }

            return responseFinal;
        };

        return this.retry({
            callback,
            customParams: {
                from,
                to,
            },
        });
    };

    /**
     * Parse transactions from block x to block y
     */
    transactions = async (block: number, currentBlock: number): Promise<void> => {
        let run = true;
        let from: number = block;
        let to: number = block + this.range;
        if (to > currentBlock) {
            to = currentBlock;
        }

        while (run && this.running) {
            console.log(`processing past blocks for ${this.provider.name} from block ${from} to block ${to}`);

            const transactions: Transaction[] = await this.getPastTransactions(from, to);

            if (transactions.length) {
                console.log(
                    `found ${transactions.length} transactions for ${this.provider.name} in range from block ${from} to ${to}`,
                );

                const chunks: Transaction[][] = _.chunk(transactions, this.chunkSize);

                for (const chunk in chunks) {
                    const promises: Promise<void>[] = [];
                    for (const transaction of chunks[chunk]) {
                        promises.push(this.provider.process(transaction));
                    }

                    await Promise.all(promises);
                }
            }

            await this.getPastTransactions(from, to);
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
            }
        }
        return;
    };

    /**
     * Run events parser
     */
    run = async (): Promise<void> => {
        // @todo this needs to have a reset for all providers where the range should be bigger
        if ("undefined" !== typeof this.provider.blockRange) {
            this.range = this.provider.blockRange;
        }
        this.ensureWeb3();
        const block: number = +(await metadata.block(this.provider));
        const currentBlock: number = await this.getCurrentBlock();

        if (this.provider.events) {
            if ("topics" === this.provider.searchType) {
                await this.eventsByTopics(block, currentBlock);
            } else {
                await this.events(block, currentBlock);
            }
        } else {
            await this.transactions(block, currentBlock);
        }
    };

    /**
     * Check if contract is active based on the block number
     */
    isDeprecated = (block: number): boolean => {
        if ("undefined" !== typeof this.provider.deprecatedAtBlock && block >= this.provider.deprecatedAtBlock) {
            console.log(`${this.provider.name} provider deprecated at ${this.provider.deprecatedAtBlock}`);

            return true;
        }

        return false;
    };

    /**
     * Parse events by topics (signatures)
     */
    eventsByTopics = async (block: number, currentBlock: number): Promise<void> => {
        let run = true;
        let from: number = block;
        console.log("range", this.range);
        let to: number = block + this.range;

        while (run) {
            console.log(`processing past blocks for ${this.provider.name} from block ${from}`);
            const events: Log[] = await this.getPastLogs({
                fromBlock: from,
                toBlock: to,
                address: this.provider.contract,
                topics: this.provider.eventsTopics,
            });

            if (events.length) {
                console.log("Events in block range: " + events.length);
                const chunkedEvents: PastLogsOptions[][] = _.chunk(events, this.chunkSize);

                for (const i in chunkedEvents) {
                    const promises: Promise<void>[] = [];
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
     */
    private _subscribeEventsByTopics = async (block: number): Promise<void> => {
        const callback = async () => {
            await new Promise(() => {
                const web3 = this.ensureWeb3();
                web3.eth
                    .subscribe(
                        "logs",
                        {
                            address: this.provider.contract,
                            topics: this.provider.eventsTopics,
                        },
                        (err: Error, log: Log) => {
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
        };

        return this.retry({
            callback,
            customParams: {
                blockNumber: block,
                contract: this.provider.contract,
                topics: this.provider.eventsTopics,
            },
        });
    };

    /**
     * Parse events by event name
     */
    events = async (block: number, currentBlock: number): Promise<void> => {
        let run = true;
        let from: number = block;
        let to: number = block + this.range;
        if (to > currentBlock) {
            to = currentBlock;
        }

        while (run && this.running) {
            console.log(`processing past blocks for ${this.provider.name} from block ${from} to block ${to}`);

            for (const eventName of this.provider.events) {
                if (!this.running) {
                    break;
                }
                const events: EventData[] = await this.getPastEvents(eventName, {
                    fromBlock: from,
                    toBlock: to,
                });
                if (events.length) {
                    console.log(
                        `found ${events.length} events for ${this.provider.name} in range from block ${from} to ${to}`,
                    );
                    const chunks: EventData[][] = _.chunk(events, this.chunkSize);

                    for (const chunk in chunks) {
                        const promises: Promise<void>[] = [];
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
     */
    private _subscribeEvents = async (block: number): Promise<void> => {
        for (const name of this.provider.events) {
            try {
                const contract: Contract = await this.getContract();
                contract.events[name]({ fromBlock: block }, async (error: Error, event: EventData) => {
                    if (error) {
                        throw new Error();
                    }

                    if (event) {
                        this.provider.process(event);
                        metadata.update(this.provider, event.blockNumber - 1);
                    }
                }).on("connected", (id: number): void => {
                    console.log(`subscribed to ${this.provider.name} event ${name} with ID ${id} from block ${block}`);
                });
            } catch (err) {
                console.error({
                    action: "Subscribe to events",
                    error: err?.message || "n/a",
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
     * Parse address from hexadecimal string
     */
    hexToAddress = (input: string): string => ("0x" + input.substr(input.length - 40)).toLowerCase();

    /**
     * Parse array from transaction input data string
     */
    txDataToArray = (input: string): string[] => input.substring(2).match(/.{1,64}/g) || [];

    /**
     * Parse array from transaction input data string
     */
    getInputData = (input: string): RegExpMatchArray | null => input.substring(10).match(/.{1,64}/g);

    getContract = async (): Promise<Contract> => {
        const web3 = this.ensureWeb3();

        return new web3.eth.Contract(await this.getAbi(), this.provider.contract);
    };

    hexToTopic = (input: string): string => {
        const string = "0000000000000000000000000000000000000000000000000000000000000000" + input.substring(2);
        return "0x" + string.slice(string.length - 64);
    };

    getAbi = async (): Promise<object> => {
        if (this.provider.hasOwnProperty("getAbi")) {
            return await this.provider.getAbi();
        }

        if (this.provider.hasOwnProperty("abi") && "object" === typeof this.provider.abi) {
            return this.provider.abi;
        }

        if (!this.provider.hasOwnProperty("pathToAbi")) {
            throw new Error("invalid path to abi, must provider full path");
        }

        const stringifiedAbi: string = await fs.promises.readFile(this.provider.pathToAbi, "utf8");
        const abi: object = JSON.parse(stringifiedAbi || "[]");
        this.provider.abi = abi;
        return abi;
    };
}

export default EVMC;

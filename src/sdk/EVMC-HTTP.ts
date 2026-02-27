// @ts-nocheck
import metadata from "./metadata";
import Web3 from "web3";
import _ from "lodash";
import fs from "fs";
import {asyncTimeout} from "./utils";
import {API_KEY, HTTP_PROXY_URL} from "./constants";
import BasicSDK from "./basic-sdk";
import {Log, PastLogsOptions, Transaction, TransactionConfig, TransactionReceipt} from "web3-core";
import {BlockTransactionString} from "web3-eth";
import {Contract, EventData, PastEventOptions} from "web3-eth-contract";

// Ethereum Virtual Machine compatible
class EVMC_HTTP extends BasicSDK {
    web3: any;
    running: boolean;
    range: number;
    protocol?: string;
    chunkSize?: number;
    chainId: number;
    isConnected: boolean;
    node?: string;

    constructor(provider: any) {
        super(provider);

        this.web3 = null;
        this.running = true;
        this.range = 10000;
        this.chunkSize = 1;
        this.chainId = 1;
        this.isConnected = false;
    }

    stop = (): void => {
        this.running = false;
    };

    private getHeaders = (): { name: string, value: any }[] | undefined => {
        if (this.node) {
            return;
        }

        return [
            {name: "x-api-key", value: API_KEY},
            {name: "chain-id", value: this.chainId},
        ]
    }

    private getNodeUrl = (): string => {
        return this.node || HTTP_PROXY_URL;
    }

    connect = (): void => {
        // @see https://web3js.readthedocs.io/en/v1.2.11/web3.html#configuration
        this.web3 = new Web3(
            new Web3.providers.HttpProvider(this.getNodeUrl(), {
                headers: this.getHeaders(),
                timeout: 20000,
            }),
        );
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
            try {
                this.ensureWeb3();
                const response: number | null = await this.web3.eth.getBlockNumber();

                if (null === response) {
                    await asyncTimeout(60);
                    throw new Error("null response");
                }

                return response;
            } catch (err) {
                console.log(err);
                process.exit()
            }
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

    callContractMethod = async (
        methodName: string,
        params: any[] = [],
        transactionConfig?: TransactionConfig,
        blockNumber?: number
    ): Promise<any> => {
        const callback = async (): Promise<any> => {
            this.ensureWeb3();
            const contract: Contract = await this.getContract();
            const response: any = await contract.methods[methodName](...params).call(
                transactionConfig,
                blockNumber,
            );

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
                blockNumber,
            },
        });
    };

    getPastTransactions = async (from: number, to: number): Promise<Transaction[]> => {
        this.ensureWeb3();

        const callback = async (blockNumber: number): Promise<Transaction | undefined> => {
            const response = await this.web3.eth.getBlock(blockNumber, true);

            if (null === response) {
                throw new Error("NULL response");
            }

            const transactions = <Transaction[]>response.transactions;

            const contractTransactions = <Transaction>(
                transactions.find(({to}) => to !== undefined && to?.toLowerCase() === this.provider.contract)
            );

            if (contractTransactions !== undefined) {
                return contractTransactions;
            }

            return undefined;
        };

        const promises = [];
        for (let i = from; i < to; i++) {
            promises.push(
                this.retry({
                    callback: () => callback(i),
                    action: "get block data",
                    customParams: {
                        blockNumber: i,
                    },
                }),
            );
        }

        return (await Promise.all(promises)).filter(c => !!c);
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

        if (
            this.provider.searchType &&
            (this.provider.searchType.includes("topics") || this.provider.searchType.includes("address"))
        ) {
            await this.eventsByTopicsOrAddress(block, currentBlock);
        } else if ("block-scan" === this.provider.searchType) {
            await this.transactions(block, currentBlock);
        } else {
            await this.events(block, currentBlock);
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
     *
     * @param block int
     * @param currentBlock int
     * @returns {Promise<void>}
     */
    eventsByTopicsOrAddress = async (block: number, currentBlock: number): Promise<void> => {
        let from: number = block;
        let to: number = block + this.range;
        let latestBlock = currentBlock;

        while (true) {
            latestBlock = await this.getCurrentBlock();

            if (this.isDeprecated(from)) {
                return;
            }

            if (from > latestBlock) {
                await asyncTimeout();
                continue;
            }

            if (to > latestBlock) {
                to = latestBlock;
            }

            if (from >= to) {
                await asyncTimeout();
                continue;
            }

            console.log(`processing past blocks for ${this.provider.name} from block ${from} to ${to}`);
            const events: Log[] = await this.getPastLogs({
                fromBlock: from,
                toBlock: to,
                address:
                    this.provider.searchType && this.provider.searchType.includes("address")
                        ? this.provider.contract
                        : undefined,
                topics:
                    this.provider.searchType && this.provider.searchType.includes("topics")
                        ? this.provider.eventsTopics
                        : undefined,
            });

            if (events.length) {
                console.log("Events in block range: " + events.length);
                const chunkedEvents: PastLogsOptions[][] = _.chunk(events, this.chunkSize);

                for (const i in chunkedEvents) {
                    const salesToInsert: ISaleEntity[] = [];

                    const promises: Promise<ISaleEntity | undefined>[] = [];
                    for (const event of chunkedEvents[i]) {
                        promises.push(this.provider.process(event));
                    }
                    const sales: ISaleEntity[] = (await Promise.all(promises))
                        .flat()
                        .filter((item: ISaleEntity | undefined): item is ISaleEntity => !!item);
                    if (Array.isArray(sales) && sales.length) {
                        salesToInsert.push(...sales);
                    }

                    await InsertSales(salesToInsert, !!this.provider.resync);
                }
            }

            await metadata.update(this.provider, to);
            if (this.isDeprecated(to)) {
                return;
            }

            from = to;
            to = to + this.range;
            // If we don't update current block number, we'll always check with the same block.
            // That might cause us trying to parse events from future.

            if (to > latestBlock) {
                await metadata.update(this.provider, latestBlock);
                await asyncTimeout();
            }
        }
    };

    /**
     * Parse events by event name
     *
     * @param block int
     * @param currentBlock int
     * @returns {Promise<void>}
     */
    events = async (block: number, currentBlock: number): Promise<void> => {
        let from: number = block;
        let to: number = block + this.range;
        let latestBlock = currentBlock;

        while (true) {
            latestBlock = await this.getCurrentBlock();

            if (this.isDeprecated(from)) {
                return;
            }

            if (from > latestBlock) {
                console.log({
                    providerName: this.provider.name,
                    message: `"from" value is higher than "latestBlock' value`,
                    fromBlock: from,
                    toBlock: to,
                    latestBlock,
                });

                await asyncTimeout();
                continue;
            }

            if (to > latestBlock) {
                to = latestBlock;
            }

            if (from === to) {
                console.log({
                    providerName: this.provider.name,
                    message: `"from" value is equal to "to' value`,
                    fromBlock: from,
                    toBlock: to,
                    latestBlock,
                });

                to = from + this.range;

                await asyncTimeout();
                continue;
            }

            if (from >= to) {
                console.log({
                    providerName: this.provider.name,
                    message: `"from" value is higher or equal to "to' value`,
                    fromBlock: from,
                    toBlock: to,
                    latestBlock,
                });

                await asyncTimeout();
                continue;
            }

            console.log(`processing past blocks for ${this.provider.name} from block ${from} to block ${to}`);

            for (const eventName of this.provider.events) {
                const options = {
                    fromBlock: from,
                    toBlock: to,
                    topics: this.provider.eventsTopics,
                };
                const events: EventData[] = await this.getPastEvents(eventName, options);
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

            from = to;
            to = to + this.range;
            // If we don't update current block number, we'll always check with the same block.
            // That might cause us trying to parse events from future.

            if (to >= latestBlock) {
                await metadata.update(this.provider, latestBlock);
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

    getAbi = async (): Promise<IObjectStringAny> => {
        if (this.provider.hasOwnProperty("getAbi")) {
            return await this.provider.getAbi();
        }

        if (this.provider.hasOwnProperty("abi") && "object" === typeof this.provider.abi) {
            return this.provider.abi;
        }

        let path: string;
        if (this.provider.hasOwnProperty("pathToAbi")) {
            path = this.provider.pathToAbi;
        } else {
            const dirName = this.provider.basicProvider ?? this.provider.name;
            path = `${__dirname}/../adapters/${dirName}/abi.json`;
        }

        const stringifiedAbi: string = await fs.promises.readFile(path, "utf8");
        const abi: IObjectStringAny = JSON.parse(stringifiedAbi || "[]");
        this.provider.abi = abi;
        return abi;
    };
}

export default EVMC_HTTP;

import axios, {AxiosInstance} from "axios";
import {asyncTimeout} from "./utils";
import {HTTP_PROXY_URL, API_KEY} from "./constants";
import _ from "lodash";
import BasicSDK from "./basic-sdk";

interface IAlias {
    alias?: string;
    address: string;
}

interface ITransactionParameter {
    entrypoint: string;
    value: {
        [key: string]: any;
    };
}

interface IBigMapKeyShort {
    hash: string;
    key: {
        [key: string | number]: any;
    };
    value: {
        [key: string | number]: any;
    };
}

interface IBigMapDiff {
    bigmap: string;
    path: string;
    action: string;
    content?: IBigMapKeyShort;
}

interface IOperation {
    type?: string;
    id: number;
    level: number;
    timestamp: string;
    block: string;
    hash: string;
    counter: number;
    initiator: IAlias;
    sender: IAlias;
    nonce?: number;
    gasLimit: number;
    gasUsed: number;
    storageLimit: number;
    storageUsed: number;
    bakerFee: number;
    storageFee: number;
    allocationFee: number;
    target: IAlias;
    amount: number;
    parameter: ITransactionParameter;
    storage?: {
        [key: string]: any;
    };
    diffs?: IBigMapDiff[];
    status: string;
    errors: { [key: string]: any }[];
    hasInternals: boolean;
    tokenTransfersCount?: number;
}

class Tezos extends BasicSDK {
    provider: any;
    range: number;
    chunkSize: number;
    chainId: number;
    axiosInstance: AxiosInstance;

    constructor(provider: any) {
        super(provider);

        this.range = 500; // Maximum amount that API can handle is 500
        this.chunkSize = 1;
        this.chainId = 21;
        this.axiosInstance = axios.create({
            baseURL: HTTP_PROXY_URL,
            headers: {
                "x-api-key": API_KEY,
                "chain-id": this.chainId,
            }
        })
    }

    run = async (): Promise<void> => {
        await this.calls();
    };

    stop = (): void => {
        this.running = false;
    };

    calls = async (): Promise<void> => {
        while (this.running) {
            const calls = await this.getCalls(0);
            const chunks = _.chunk(calls, this.chunkSize);
            for (const chunk in chunks) {
                if (!this.running) {
                    return;
                }
                const promises = [];
                for (const call of chunks[chunk]) {
                    promises.push(this.provider.process(call, 0));
                }

                await Promise.all(promises);
            }

            if (calls.length < this.range) {
                await asyncTimeout(60);
            }
        }
    };

    getCalls = async (offset: number): Promise<IOperation[]> => {
        const callback = async (): Promise<object[]> => {
            const url = `/operations/transactions`;

            const config = {
                params: {
                    target: this.provider.contract,
                    entrypoint: this.provider.event,
                    limit: this.range,
                    offset,
                },
            };

            const response = await this.axiosInstance.get(url, config);

            return response.data;
        };

        return this.retry({
            callback,
            customParams: {
                contract: this.provider.contract,
                event: this.provider.event,
                range: this.range,
                offset,
            },
        });
    };

    getOperation = async (hash: string): Promise<IOperation> => {
        const callback = async (): Promise<IOperation> => {
            const url = `/operations/${hash}`;
            const response = await this.axiosInstance.get(url);

            return response.data;
        };

        return this.retry({
            callback,
            customParams: {
                transactionHash: hash,
            },
        });
    };
}

export default Tezos;

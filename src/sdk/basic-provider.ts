import {IObjectNumberString} from "./Interfaces";

export interface IBasicProviderOptions {
    name: string;
    basicProvider: string;
    chainId: number;
    block: number;
    contract: string;
    events?: string[];
    deprecatedAt?: number;
    blockRange?: number;
    chunkSize?: number;
    defaultPaymentToken?: string;
}

const PROTOCOL_TO_FILENAME_MAP: IObjectNumberString = {
    1: 'ethereum',
    15: 'binance',
    16: 'matic',
    19: 'avalanche',
    21: 'tezos',
    38: 'moonriver',
    39: 'moonbeam',
    43: 'celo',
    50: 'aurora',
}

class BasicProvider {
    name: string;
    basicProvider: string;
    chainId: number;
    block: number;
    contract: string;
    events: string[];
    sdk: any;
    deprecatedAt?: number;
    blockRange?: number;
    chunkSize?: number;
    defaultPaymentToken?: string;

    constructor(options: IBasicProviderOptions) {
        this.name = options.name;
        if (!this.name) {
            throw new Error(`Missing provider name`);
        }

        this.basicProvider = options.basicProvider;
        this.chainId = options.chainId;
        if (!this.chainId) {
            throw new Error(`Missing chain ID`);
        }

        this.block = options.block;
        if ("undefined" === typeof this.block || null === this.block) {
            throw new Error(`Missing block`);
        }

        this.contract = options.contract;
        if (!this.contract) {
            throw new Error(`Missing contract`);
        }

        if (options.deprecatedAt) {
            this.deprecatedAt = options.deprecatedAt;
        }

        if (options.blockRange) {
            this.blockRange = options.blockRange;
        }

        if (options.chunkSize) {
            this.chunkSize = options.chunkSize;
        }

        if (options.defaultPaymentToken) {
            this.defaultPaymentToken = options.defaultPaymentToken;
        }

        this.events = this.events ?? options.events;
        this.sdk = undefined;
    }

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    private getSdk = async (): Promise<any> => {
        if (!PROTOCOL_TO_FILENAME_MAP[this.chainId]) {
            throw new Error(`Chain with ID "${this.chainId}" is not supported`);
        }

        let filename: string = PROTOCOL_TO_FILENAME_MAP[this.chainId];

        return (await import(`${__dirname}/${filename}`)).default;
    };

    private loadSdk = async (): Promise<any> => {
        this.sdk = new (await this.getSdk())(this);
    };

    preRun = async () => {
        //
    };

    run = async (): Promise<any> => {
        await this.loadSdk();
        await this.preRun();

        return this.sdk.run();
    };
}

export default BasicProvider;

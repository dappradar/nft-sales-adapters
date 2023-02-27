import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import moment from "moment";
import Ethereum from "../../sdk/EVMC";
import BigNumber from "bignumber.js";
import priceSdk from "../../sdk/price";
import symbolSdk from "../../sdk/symbol";
import { EventData } from "web3-eth-contract";
import { BlockTransactionString } from "web3-eth";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

class DCCNineChronicles {
    name: string;
    symbol: ISymbolAPIResponse | undefined;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "DCC NineChronicles";
        this.symbol = undefined;
        this.token = "eth";
        this.protocol = "ethereum";
        this.block = 15572567;
        this.contract = "0xcea65a86195c911912ce48b6636ddd365c208130";
        this.events = ["Transfer"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async (): Promise<void> => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.symbol = symbol;

        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Ethereum(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getBuyer = async (event: EventData): Promise<string | null> => {
        const buyer = event.returnValues.owner;
        if (event.event === "Mint") {
            const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            return txReceipt.from;
        }

        return buyer;
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const baseTx = await this.sdk.getTransaction(event.transactionHash);
        if (baseTx.value == 0) {
            return; // ignore marketing (zero value) mints
        }

        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);

        let numberOfTokens = 0;

        for (let i = 0; i < txReceipt.logs.length; i++) {
            if (txReceipt.logs[i].topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                numberOfTokens++;
            }
        }

        const po = await priceSdk.get(this.token, this.protocol, block.timestamp);
        let nativePrice = new BigNumber(0);
        if (baseTx.value > 0)
            nativePrice = new BigNumber(baseTx.value)
                .dividedBy(10 ** (this.symbol?.decimals || 0))
                .dividedBy(numberOfTokens);

        const buyer = baseTx.from;

        if (!buyer) {
            return;
        }

        const tokenId = event.returnValues.tokenId;
        const entity = {
            providerName: this.name, // the name of the folder
            providerContract: this.contract, // the providers contract from which you get data
            protocol: this.protocol,
            nfts: [
                {
                    contract: this.contract,
                    id: tokenId,
                    amount: 1,
                },
            ],
            token: this.token,
            tokenSymbol: this.symbol?.symbol || "",
            price: nativePrice.toNumber(),
            priceUsd: !this.symbol?.decimals ? null : nativePrice.multipliedBy(po.price).toNumber(),
            seller: this.contract,
            buyer: buyer.toLowerCase(),
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default DCCNineChronicles;
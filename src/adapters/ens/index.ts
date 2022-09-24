import * as dotenv from "dotenv";
dotenv.config();

import moment from "moment";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/EVMC";
import path from "path";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";

import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";
import { TransactionReceipt } from "web3-core";

class ENS {
    // stands for Ethereum name service

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
        this.name = "ens";
        this.symbol = undefined;
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "ethereum";
        this.block = 12855192;
        this.contract = "0x283af0b28c62c092c9727f1ee09c02ca627eb7f5";
        this.events = ["NameRegistered", "NameRenewed"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = new Ethereum(this);
    }

    run = async (): Promise<void> => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.symbol = symbol;

        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = () => {
        return new Ethereum(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getBuyer = async (event: EventData): Promise<string | null> => {
        const buyer: string = event.returnValues.owner;

        if (event.event === "NameRenewed") {
            const txReceipt: TransactionReceipt | null = await this.sdk.getTransactionReceipt(event.transactionHash);
            if (txReceipt === null) {
                return null;
            }
            return txReceipt.from.toLowerCase();
        }

        return buyer.toLowerCase();
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await priceSdk.get(this.token, this.protocol, block.timestamp);
        const nativePrice = new BigNumber(event.returnValues.cost).dividedBy(10 ** (this.symbol?.decimals || 0));
        const buyer = await this.getBuyer(event);
        if (!buyer) {
            return;
        }

        const labelHash = event.returnValues.label;
        const tokenId = new BigNumber(labelHash, 16).toFixed();
        const entity: ISaleEntity = {
            providerName: this.name, // the name of the folder
            providerContract: this.contract, // the providers contract from which you get data
            protocol: this.protocol,
            nftContract: this.contract,
            nftId: tokenId,
            token: this.token,
            tokenSymbol: this.symbol?.symbol || "",
            amount: 1,
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: this.contract, // its bought from ens and transfered to the owner
            buyer,
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default ENS;

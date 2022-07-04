require("dotenv").config();

import moment from "moment";
import Avalanche from "../../sdk/avalanche";
import axios from "axios";
import path from "path";
import BigNumber from "bignumber.js";
import { ISaleEntity, ISymbolAPIResponse, EventSearchType } from "../../sdk/Interfaces";
import priceSdk from "../../sdk/price";
import symbolSdk from "../../sdk/symbol";
import { EventData } from "web3-eth-contract";
import { BlockTransactionString } from "web3-eth";
import { Log, TransactionReceipt, Transaction, PastLogsOptions } from "web3-core";

type BuyerInfo = {
    nftContract: string;
    nftId: string;
    buyer: string;
};

type PriceInfo = {
    price: number;
    priceUsd: number;
};

class Kalao {
    name: string;
    symbol: ISymbolAPIResponse | undefined;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    searchType: EventSearchType;
    eventsTopics: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: Avalanche;

    constructor() {
        this.name = "kalao-avalanche";
        this.symbol = undefined;
        this.token = "avax";
        this.protocol = "avalanche";
        this.block = 7369141;
        this.contract = "0x11ac3118309a7215c6d87c7c396e2df333ae3a9c";
        this.searchType = "topics";
        this.eventsTopics = ["0x410787feaee69e25111c916ccc79ee0fb3dd27b169bcb00209efdd59c5148f36"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
    }

    run = async (): Promise<void> => {
        this.sdk = this.loadSdk();
        this.symbol = await this.getSymbol();
        await this.sdk.run();
    };

    loadSdk = (): Avalanche => {
        return new Avalanche(this);
    };

    getSymbol = async (): Promise<ISymbolAPIResponse> => {
        return await symbolSdk.get(this.token, this.protocol);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getBuyerInfo = async (transaction: TransactionReceipt): Promise<BuyerInfo | undefined> => {
        const purchaseLog = transaction.logs.find(
            l => l.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Purchase Event Log
        );
        if (!purchaseLog) {
            return;
        }
        const nftContract = purchaseLog.address;
        const buyer = "0x" + purchaseLog.topics[2].substring(26, 66);
        const nftId = parseInt(purchaseLog.topics[3], 16).toString();

        return {
            nftContract,
            nftId,
            buyer: buyer.toLowerCase(),
        };
    };

    getSeller = async (dealId: number, block: BlockTransactionString): Promise<string> => {
        const seller = await this.sdk.callContractMethod("getSeller", [dealId], [undefined, block.number]);
        return seller.toLowerCase();
    };

    getPriceInfo = async (dealId: number, block: BlockTransactionString): Promise<PriceInfo | undefined> => {
        if (!this.symbol?.decimals) {
            return;
        }

        const price = await this.sdk.callContractMethod("getPrice", [dealId], [undefined, block.number]);
        const po = await priceSdk.get(this.token, this.protocol, block.timestamp as number);
        const nativePrice = new BigNumber(price).dividedBy(10 ** this.symbol.decimals);

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (event: Log): Promise<void> => {
        const dealId = parseInt(event.data.substring(0, 66), 16);
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp as number).utc();
        const transaction = await this.sdk.getTransactionReceipt(event.transactionHash);
        const buyerInfo = await this.getBuyerInfo(transaction);
        if (!buyerInfo) {
            return;
        }
        const seller = await this.getSeller(dealId, block);
        if (!seller) {
            return;
        }
        const priceInfo = await this.getPriceInfo(dealId, block);

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            token: this.token,
            tokenSymbol: this.symbol?.symbol ?? "",
            amount: 1,
            price: priceInfo?.price ?? null,
            priceUsd: priceInfo?.priceUsd ?? null,
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            ...buyerInfo,
            seller,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

module.exports = Kalao;

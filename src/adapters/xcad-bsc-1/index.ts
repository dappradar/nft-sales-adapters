import * as dotenv from "dotenv";
dotenv.config();

import BSC from "../../sdk/binance";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";
import path from "path";
import BigNumber from "bignumber.js";
import moment from "moment";
import { TransactionReceipt, Log } from "web3-core";

type AuctionInformation = {
    price: string;
    tokenContract: string;
    tokenId: string;
    seller: string;
    buyer: string;
};

type Transfer = {
    to: string;
    from: string;
    value: string;
};

class XCAD {
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
        this.name = "xcad-market";
        this.symbol = undefined;
        this.token = "0xd069599e718f963bd84502b49ba8f8657faf5b3a";
        this.protocol = "binance-smart-chain";
        this.block = 27292748;
        this.contract = "0x6f9d68dd285fbd9fcacdf603b56695a2df352cf9";
        this.events = ["AuctionSettled"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    loadSdk = () => {
        return new BSC(this);
    };

    run = async () => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) {
            throw new Error(`Missing symbol metadata for provider ${this.name}`);
        }
        this.symbol = symbol;

        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getNFTTransferEvent = (log: Log): Transfer => {
        return {
            from: new BigNumber(log.topics[1]).toString(16),
            to: new BigNumber(log.topics[2]).toString(16),
            value: new BigNumber(log.topics[3]).toString(),
        };
    };

    getTransferEvent = (log: Log): Transfer => {
        return {
            from: new BigNumber(log.topics[1]).toString(16),
            to: new BigNumber(log.topics[2]).toString(16),
            value: new BigNumber(log.data).toString(),
        };
    };

    getAuctionInformation = async (event: EventData): Promise<AuctionInformation | undefined> => {
        const txReceipt: TransactionReceipt | null = await this.sdk.getTransactionReceipt(event.transactionHash);
        if (!txReceipt) {
            return;
        }

        const transferLogs = txReceipt.logs.filter(
            log => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        );

        // Validate Correct Transaction Logs
        if (!transferLogs.length || transferLogs.length !== 3) {
            return;
        }

        const nftAddress = transferLogs[0].address;
        const nftTransfer = this.getNFTTransferEvent(transferLogs[0]);
        const userTransfer = this.getTransferEvent(transferLogs[1]);
        const treasuryTransfer = this.getTransferEvent(transferLogs[2]);

        const totalAmount = new BigNumber(userTransfer.value).plus(treasuryTransfer.value).toString();

        return {
            price: totalAmount,
            tokenContract: nftAddress,
            tokenId: nftTransfer.value,
            seller: `0x${userTransfer.to}`,
            buyer: `0x${nftTransfer.to}`,
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const auctionInformation = await this.getAuctionInformation(event);
        if (!auctionInformation) {
            return;
        }

        const { price, tokenContract, tokenId, seller, buyer } = auctionInformation;

        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const tokenPrice = await priceSdk.get(this.token, this.protocol, block.timestamp);
        const nativePrice = new BigNumber(price).dividedBy(10 ** (this.symbol?.decimals || 0));

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: tokenContract.toLowerCase(),
            nftId: tokenId,
            token: this.token || "",
            tokenSymbol: this.symbol?.symbol || "",
            amount: 1,
            price: nativePrice.toNumber(),
            priceUsd: !this.symbol?.decimals ? null : nativePrice.multipliedBy(tokenPrice.price).toNumber(),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
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

export default XCAD;

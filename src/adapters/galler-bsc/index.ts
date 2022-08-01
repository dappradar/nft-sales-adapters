import * as dotenv from "dotenv";
dotenv.config();

import moment from "moment";
import BigNumber from "bignumber.js";
import BSC from "../../sdk/binance";
import { AVAILABLE_PROTOCOLS } from "../../sdk/constants";
import path from "path";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";

import { ISaleEntity, ISymbolAPIResponse, IObjectStringAny } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";

class GallerBSC {
    name: string;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    symbol: ISymbolAPIResponse | undefined;
    pathToAbi: string | undefined;
    sdk: any;

    constructor() {
        this.name = "galler-bsc";
        this.token = "bnb";
        this.protocol = AVAILABLE_PROTOCOLS.BSC;
        this.block = 14444440;
        this.pathToAbi = path.join(__dirname, "../galler/abi.json");
        this.contract = "0xb50a86874394f75d9388dd5bc47705145110d9a5";
        this.events = ["OrdersMatched"];
        this.sdk = new BSC(this);
    }

    run = async (): Promise<void> => {
        const symbol = await symbolSdk.get(this.token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);
        this.symbol = symbol;

        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    loadSdk = (): any => {
        return new BSC(this);
    };

    getNftContractAndId = async (event: EventData): Promise<[string | null, string | null]> => {
        const txReceipt = await this.sdk.getTransactionReceipt(event.transactionHash);

        const buyer = event.returnValues.secondMaker.toLowerCase();
        const seller = event.returnValues.firstMaker.toLowerCase();

        if (txReceipt === null) {
            return [null, null];
        }
        const logs = txReceipt.logs;
        for (let i = 0; i < logs.length; i++) {
            const topics = logs[i].topics;
            if (
                topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
                this.sdk.hexToAddress(topics[1]) === seller.toLowerCase() &&
                this.sdk.hexToAddress(topics[2]) === buyer.toLowerCase()
            ) {
                const nftContract = logs[i].address.toLowerCase();
                const tokenIdHex = topics[3];
                const tokenId = parseInt(tokenIdHex, 16);
                return [nftContract, tokenId.toString()];
            }
        }

        return [null, null];
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await priceSdk.get(this.token, this.protocol, block.timestamp);
        const nativePrice = new BigNumber(event.returnValues.newSecondFill).dividedBy(
            10 ** (this.symbol?.decimals || 0),
        );
        const amount = event.returnValues.newFirstFill;
        const buyer = event.returnValues.secondMaker.toLowerCase();
        const seller = event.returnValues.firstMaker.toLowerCase();

        const [nftCollectionAddress, nftId] = await this.getNftContractAndId(event);

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            nftContract: nftCollectionAddress || "",
            nftId: nftId || "",
            token: this.token,
            tokenSymbol: this.symbol?.symbol || "",
            amount,
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
            seller,
            buyer,
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            protocol: AVAILABLE_PROTOCOLS.BSC,
        };

        return this.addToDatabase(entity);
    };
    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default GallerBSC;

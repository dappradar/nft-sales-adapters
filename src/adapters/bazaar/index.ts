import * as dotenv from "dotenv";

dotenv.config();

import path from "path";
import moment from "moment";
import BSC from "../../sdk/binance";
import BigNumber from "bignumber.js";

import { ISaleEntity } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";

class Bazaar {
    name: string;
    token: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "bazaar";
        this.token = "0x154a9f9cbd3449ad22fdae23044319d6ef2a1fab";
        this.protocol = "binance-smart-chain";
        this.block = 8114624;
        this.contract = "0x90099da42806b21128a094c713347c7885af79e2";
        this.events = ["PurchasedListing"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();

        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new BSC(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    getBuyer = async (event: EventData): Promise<string | null> => {
        const buyer = event.returnValues.owner;

        if (event.event === "PurchasedListing") {
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
        const buyer = await this.getBuyer(event);
        if (!buyer) {
            return;
        }

        const tokenId = event.returnValues.nftID;
        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: this.contract,
            nftId: tokenId,
            token: this.token,
            amount: 1,
            price: new BigNumber(event.returnValues.price),
            seller: this.contract,
            buyer: buyer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default Bazaar;

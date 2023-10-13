import * as dotenv from "dotenv";

dotenv.config();

import moment from "moment";
import BigNumber from "bignumber.js";
import Ethereum from "../../sdk/ethereum";
import path from "path";

import { ISaleEntity } from "../../sdk/Interfaces";

class X {
    name: string;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "x";
        this.protocol = "ethereum";
        this.block = 15127333;
        this.contract = "0xb4a2e49818dd8a5cdd818f22ab99263b62ddeb6c";
        this.events = [
            "0xd5a12c8e1b2b15aa8d8e98c670c585319359222157e5a1c959a59de835027b4f", // TakerBid
            "0xe1a9e4a1dd601b64511a244940f55fd6e2d1ba8846974ed476a0b6e478327bf8", // TakerAsk
            "0x782a08f6e55ce0dc0c0acae21b90c56f026e34f2693c89e7669eafc7a0546e82", // legacy TakerBid
        ];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = new Ethereum(this);
    }

    run = async (): Promise<void> => {
        this.sdk = this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = () => {
        return new Ethereum(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    process = async (event: any): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        let buyer = event.returnValues.taker;
        let seller = event.returnValues.maker;
        if (event.event === "TakerAsk") {
            buyer = event.returnValues.maker;
            seller = event.returnValues.taker;
        }

        const { collection, tokenId, amount, currency, price } = event.returnValues.fulfillment;

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: collection.toLowerCase(),
            nftId: tokenId,
            token: currency.toLowerCase(),
            amount: amount,
            price: new BigNumber(price),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };

        return this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default X;

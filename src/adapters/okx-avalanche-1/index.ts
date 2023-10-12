import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Avalanche from "../../sdk/avalanche";
import { ISaleEntity } from "../../sdk/Interfaces";

class OKX {
    name: string;
    protocol: string;
    block: number;
    deprecatedAtBlock: number;
    contract: string;
    events: string[];
    pathToAbi: string;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "okx-avalanche-1";
        this.protocol = "avalanche";
        this.block = 26572369;
        // this.deprecatedAtBlock = 26572425;
        this.contract = "0xa88ba7ea2912cde5d632c8de048a17f2ea3e75a0";
        this.events = ["MatchOrderResultsV3"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
    }

    run = async (): Promise<void> => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    loadSdk = (): any => {
        return new Avalanche(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (item: any): string => {
        if (item[2] === "0x0000000000000000000000000000000000000000") {
            return "avax";
        }
        return item[2].toLowerCase();
    };

    _processItem = async (event: EventData, item: any): Promise<void> => {
        const [actionType, price, payToken, nftContract, tokenId, amount, tradeType, extraData] = item;
        const token = this._getToken(item);
        const maker = extraData.substring(0, 42);
        const taker = `0x${extraData.substring(42, 82)}`;
        const isAceeptOffer = Number(actionType) === 3;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const buyer = isAceeptOffer ? maker : taker;
        const seller = isAceeptOffer ? taker : maker;

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nfts: [
                {
                    id: tokenId,
                    amount: Number(amount),
                    contract: nftContract.toLowerCase(),
                },
            ],
            token,
            price: new BigNumber(price),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            chainId: this.sdk.chainId,
        };
        await this.addToDatabase(entity);
    };

    process = async (event: EventData): Promise<void> => {
        const params = event.returnValues.params;
        for (let i = 0; i < params.length; i++) {
            await this._processItem(event, params[i]);
        }
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default OKX;

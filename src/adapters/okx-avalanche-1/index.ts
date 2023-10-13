import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import Avalanche from "../../sdk/avalanche";
import symbolSdk from "../../sdk/symbol";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { handleExtraData } from "../okx-polygon-1";

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
        this.block = 36224739;
        // this.deprecatedAtBlock = 26572425;
        this.contract = "0xa7FD99748cE527eAdC0bDAc60cba8a4eF4090f7c";
        this.events = ["MatchOrderResults"];
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
        const {
            actionType,
            paymentTokenAmount,
            paymentTokenContract,
            nftContract,
            tokenId,
            taker,
            maker,
            amount,
        } = item;
        const token = this._getToken(paymentTokenContract);
        const isAceeptOffer = Number(actionType) === 3;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const symbol: ISymbolAPIResponse = await symbolSdk.get(token, this.protocol);
        const po = await priceSdk.get(token, this.protocol, block.timestamp);
        const nativePrice = new BigNumber(paymentTokenAmount).dividedBy(10 ** (symbol?.decimals || 0));
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
        const extraData = event.returnValues.extraData;
        const params = handleExtraData(extraData);
        for (let i = 0; i < params.length; i++) {
            await this._processItem(event, params[i]);
        }
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default OKX;

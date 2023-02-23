import * as dotenv from "dotenv";

dotenv.config();

import BigNumber from "bignumber.js";
import moment from "moment";
import { EventData } from "web3-eth-contract";
import path from "path";
import priceSdk from "../../sdk/price";
import Binance from "../../sdk/binance";
import symbolSdk from "../../sdk/symbol";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

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
        this.name = "okx-bsc-1";
        this.protocol = "binance-smart-chain";
        this.block = 25862299;
        // this.deprecatedAtBlock = 16625257;
        this.contract = "0xcce3e3f79cf9091386f84610bb06947e2fc232a3";
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
        return new Binance(this);
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getToken = (item: any): string => {
        if (item[2] === "0x0000000000000000000000000000000000000000") {
            return "bnb";
        }
        return item[2];
    };

    _processItem = async (event: EventData, item: any): Promise<void> => {
        const [actionType, price, payToken, nftContract, tokenId, amount, tradeType, extraData] = item;
        const token = this._getToken(item);
        const maker = extraData.substring(0, 42);
        const taker = `0x${extraData.substring(42, 82)}`;
        const isAceeptOffer = Number(actionType) === 3;
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const symbol: ISymbolAPIResponse = await symbolSdk.get(token, this.protocol);
        const po = await priceSdk.get(token, this.protocol, block.timestamp);
        const nativePrice = new BigNumber(price).dividedBy(10 ** (symbol?.decimals || 0));
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
            token: payToken.toLowerCase(),
            tokenSymbol: symbol?.symbol || "",
            price: nativePrice.toNumber(),
            priceUsd: !symbol?.decimals ? null : nativePrice.multipliedBy(po.price).toNumber(),
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
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

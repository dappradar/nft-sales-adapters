import * as dotenv from "dotenv";
dotenv.config();

import moment from "moment";
import BigNumber from "bignumber.js";
import BSC from "../../sdk/binance";
import path from "path";
import symbolSdk from "../../sdk/symbol";
import priceSdk from "../../sdk/price";

import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";
import { EventData } from "web3-eth-contract";

class BHeroMarket {

    name: string;
    symbol: ISymbolAPIResponse | undefined;
    token: string | undefined;
    protocol: string;
    block: number;
    contract: string;
    events: string[];
    pathToAbi: string | undefined;
    range: number;
    chunkSize: number;
    sdk: any;

    constructor() {
        this.name = "bhero-market";
        this.symbol = undefined;
        this.token = undefined;
        this.protocol = "binance-smart-chain";
        this.block = 15498601;
        this.contract = "0x376a10e7f125a4e0a567cc08043c695cd8edd704";
        this.events = ["Sold"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    run = async () => {
        this.sdk = this.loadSdk();

        const token = await this.sdk.callContractMethod('bcoinContract');
        if (!token) throw new Error('Failed to fetch token address');
        
        const symbol = await symbolSdk.get(token, this.protocol);
        if (!symbol) throw new Error(`Missing symbol metadata for provider ${this.name}`);

        this.token = token.toLowerCase();
        this.symbol = symbol;

        await this.sdk.run();
    };

    loadSdk = () => {
        return new BSC(this);
    };

    stop = async () => {
        this.sdk.stop();
    };

    getBuyer = (event: EventData): string | null => {
        return event.returnValues.buyer;
    };

    getSeller = async (event: EventData): Promise<string | null> => {
        return event.returnValues.seller;
    };

    process = async (event: EventData): Promise<ISaleEntity | undefined> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();
        const po = await priceSdk.get(this.token || '', this.protocol, block.timestamp);
        const nativePrice = new BigNumber(event.returnValues.price).dividedBy(10 ** (this.symbol?.decimals || 0));
        const buyer = await this.getBuyer(event);
        if (!buyer) {
            return;
        }
        const tokenId = event.returnValues.tokenId;
        const seller = await this.getSeller(event);
        const nftContract = await this.sdk.callContractMethod('nftContract');

        const entity: ISaleEntity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: this.token || '',
            tokenSymbol: this.symbol?.symbol || '',
            amount: 1,
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
            seller: (seller || "").toLowerCase(),
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

module.exports = BHeroMarket;

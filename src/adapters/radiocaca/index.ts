import * as dotenv from "dotenv";
dotenv.config();

import path from "path";
import moment from "moment";
import BSC from "../../sdk/binance";
import BigNumber from "bignumber.js";
import priceSdk from "../../sdk/price";
import symbolSdk from "../../sdk/symbol";
import { EventData } from "web3-eth-contract";
import { BlockTransactionString } from "web3-eth";
import { ISaleEntity, ISymbolAPIResponse } from "../../sdk/Interfaces";

class RadioCaca {
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
        this.name = "radiocaca";
        this.symbol = undefined;
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "binance-smart-chain";
        this.block = 13219620;
        this.contract = "0xe97fdca0a3fc76b3046ae496c1502c9d8dfef6fc";
        this.events = ["AuctionExecuted"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    loadSdk = () => {
        return new BSC(this);
    };

    run = async () => {
        this.sdk = await this.loadSdk();
        await this.sdk.run();
    };

    stop = async (): Promise<void> => {
        this.sdk.stop();
    };

    _getPrice = async (
        event: EventData,
        block: BlockTransactionString,
        symbol: ISymbolAPIResponse,
        paymentToken: string,
    ): Promise<{ price: number | null; priceUsd: number | null }> => {
        const po = await priceSdk.get(paymentToken, this.protocol, +block.timestamp);

        if (!symbol?.decimals) {
            return {
                price: null,
                priceUsd: null,
            };
        }

        const amount = event.returnValues.bid;
        const nativePrice = new BigNumber(amount).dividedBy(10 ** (symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const auctionInfo = await this.sdk.callContractMethod("auctions", [event.returnValues.auctionId]);
        const status = auctionInfo[12];

        if (status === 0) return;

        const seller = auctionInfo[0];
        const count = auctionInfo[3];
        const paymentToken = auctionInfo[4].toLowerCase();
        const symbol = await symbolSdk.get(paymentToken, this.protocol);

        const buyer = event.returnValues.bidder;
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.nftAddress;

        const { price, priceUsd } = await this._getPrice(event, block, symbol, paymentToken);

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract.toLowerCase(),
            nftId: tokenId,
            token: paymentToken.toLowerCase(),
            tokenSymbol: symbol?.symbol || "",
            amount: count,
            price,
            priceUsd: priceUsd,
            seller: seller.toLowerCase(),
            buyer: buyer.toLowerCase(),
            soldAt: timestamp.format("YYYY-MM-DD HH:mm:ss"),
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
        };

        await this.addToDatabase(entity);
    };

    addToDatabase = async (entity: ISaleEntity): Promise<ISaleEntity> => {
        return entity;
    };
}

export default RadioCaca;

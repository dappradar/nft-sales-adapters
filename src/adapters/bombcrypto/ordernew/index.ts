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

class BombCryptoOrderNew {
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
        this.name = "bombcrypto-order";
        this.symbol = undefined;
        this.token = "0x0000000000000000000000000000000000000000";
        this.protocol = "binance-smart-chain";
        this.block = 14551809;
        this.contract = "0x049896f350C802CD5C91134E5f35Ec55FA8f0108";
        this.events = ["MatchTransaction"];
        this.pathToAbi = path.join(__dirname, "./abi.json");
        this.range = 500;
        this.chunkSize = 6;
        this.sdk = undefined;
    }

    loadSdk = () => {
        return new BSC(this);
    };

    run = async () => {
        this.sdk = this.loadSdk();
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
        if (!symbol?.decimals) {
            return {
                price: null,
                priceUsd: null,
            };
        }

        const po = await priceSdk.get(paymentToken, this.protocol, +block.timestamp);

        const amount = event.returnValues.price;
        const nativePrice = new BigNumber(amount).dividedBy(10 ** (symbol?.decimals || 0));

        return {
            price: nativePrice.toNumber(),
            priceUsd: nativePrice.multipliedBy(po.price).toNumber(),
        };
    };

    process = async (event: EventData): Promise<ISaleEntity | void> => {
        const block = await this.sdk.getBlock(event.blockNumber);
        const timestamp = moment.unix(block.timestamp).utc();

        const buyer = event.returnValues.buyer;
        const seller = event.returnValues.seller;
        const tokenId = event.returnValues.tokenId;
        const nftContract = event.returnValues.contractAddress;
        const paymentToken = event.returnValues.paymentToken;
        const symbol = await symbolSdk.get(paymentToken, this.protocol);

        const { price, priceUsd } = await this._getPrice(event, block, symbol, paymentToken);

        const entity = {
            providerName: this.name,
            providerContract: this.contract,
            protocol: this.protocol,
            nftContract: nftContract,
            nftId: tokenId,
            token: paymentToken,
            tokenSymbol: symbol?.symbol || "",
            amount: 1,
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

module.exports = BombCryptoOrderNew;